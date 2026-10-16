import { paginatedResult } from '../../utils/pagination.js';

export function createLookupsRepository(pool) {
  const writableColumns = {
    name: 'name',
    extra: 'extra',
    status: 'status',
  };

  return {
    async listValues(lookupType, parentId, includeInactive = false, pagination = null, query = '') {
      const result = await pool.query(
        `SELECT lookup_id, name, extra, parent_id, category_id, status
                ${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.lookup_value
          WHERE lookup_type = $1
            AND (status = 'ACTIVE' OR $3::boolean)
            AND (
              $2::int IS NULL
              OR (lookup_type = 'SUBCATEGORY' AND category_id = $2)
              OR (lookup_type <> 'SUBCATEGORY' AND parent_id = $2)
            )
            AND ($4 = '' OR name ILIKE '%' || $4 || '%')
          ORDER BY name
          ${pagination ? 'LIMIT $5 OFFSET $6' : ''}`,
        pagination
          ? [lookupType, parentId ?? null, includeInactive, query, pagination.pageSize, pagination.offset]
          : [lookupType, parentId ?? null, includeInactive, query],
      );
      return pagination ? paginatedResult(result.rows, pagination) : result.rows;
    },

    async createValue({ lookupType, name, parentId, categoryId, extra, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (lookupType === 'JOB_ROLE' && parentId !== null) {
          const parentResult = await client.query(
            `SELECT lookup_type FROM mams.lookup_value WHERE lookup_id = $1`,
            [parentId],
          );
          if (parentResult.rows[0]?.lookup_type !== 'DEPARTMENT') {
            const error = new Error('Job role parent must be a department');
            error.code = 'INVALID_LOOKUP_PARENT';
            throw error;
          }
        }

        const result = await client.query(
          `INSERT INTO mams.lookup_value (lookup_type, name, parent_id, category_id, extra)
           VALUES ($1, $2, $3, $4, $5::jsonb)
           RETURNING lookup_id, lookup_type, name, parent_id, category_id, extra, status, created_at`,
          [lookupType, name, parentId, categoryId, JSON.stringify(extra)],
        );
        const value = result.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'LOOKUP_CREATED', 'LOOKUP_VALUE', $3, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            value.lookup_id,
            JSON.stringify({
              lookup_type: value.lookup_type,
              name: value.name,
              parent_id: value.parent_id,
              category_id: value.category_id,
              extra: value.extra,
            }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async updateValue({ lookupType, lookupId, changes, actorUserId, actorRole, ipAddress, device }) {
      const entries = Object.entries(changes).filter(([key]) => writableColumns[key]);
      if (entries.length === 0) {
        throw new TypeError('At least one lookup field must be updated');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          `SELECT lookup_id, lookup_type, name, parent_id, category_id, extra, status
             FROM mams.lookup_value
            WHERE lookup_id = $1 AND lookup_type = $2
            FOR UPDATE`,
          [lookupId, lookupType],
        );
        const current = currentResult.rows[0];
        if (!current) {
          await client.query('ROLLBACK');
          return null;
        }

        const oldValue = {};
        const newValue = {};
        for (const [key, value] of entries) {
          const column = writableColumns[key];
          oldValue[column] = current[column];
          newValue[column] = value;
        }
        const assignments = entries.map(([key], index) => `${writableColumns[key]} = $${index + 1}`);
        const values = entries.map(([key, value]) => key === 'extra' ? JSON.stringify(value) : value);
        values.push(lookupId);
        values.push(lookupType);
        const updatedResult = await client.query(
          `UPDATE mams.lookup_value
              SET ${assignments.join(', ')}, updated_at = now()
            WHERE lookup_id = $${values.length - 1} AND lookup_type = $${values.length}
          RETURNING lookup_id, lookup_type, name, parent_id, category_id, extra, status, updated_at`,
          values,
        );
        const value = updatedResult.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'LOOKUP_UPDATED', 'LOOKUP_VALUE', $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            lookupId,
            JSON.stringify(oldValue),
            JSON.stringify(newValue),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteValue({ lookupType, lookupId, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          `SELECT lookup_id, lookup_type, name, parent_id, category_id, extra, status
             FROM mams.lookup_value
            WHERE lookup_id = $1 AND lookup_type = $2
            FOR UPDATE`,
          [lookupId, lookupType],
        );
        const value = currentResult.rows[0];
        if (!value) {
          await client.query('ROLLBACK');
          return null;
        }
        await client.query(
          'DELETE FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = $2',
          [lookupId, lookupType],
        );
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'LOOKUP_DELETED', 'LOOKUP_VALUE', $3, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            lookupId,
            JSON.stringify({
              lookup_type: value.lookup_type,
              name: value.name,
              parent_id: value.parent_id,
              category_id: value.category_id,
            }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
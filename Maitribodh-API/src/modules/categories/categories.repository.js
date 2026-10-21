import { ApiError } from '../../errors/ApiError.js';

export function createCategoriesRepository(pool) {
  const writableColumns = {
    name: 'name',
    formType: 'form_type',
    approvalRequired: 'approval_required',
    overstayCutoff: 'overstay_cutoff',
    permissionLevelId: 'permission_level_id',
    status: 'status',
    formSchema: 'form_schema',
  };
  function withoutBroadCategoryFields(row) {
    const category = { ...row };
    delete category.is_broad;
    delete category.broad_category_id;
    return category;
  }

  return {
    async listCategories({ pageSize, offset, query = '', formType, status }) {
      const result = await pool.query(
        `SELECT c.*, p.name AS permission_level, count(*) OVER()::int AS total
           FROM mams.category AS c
           LEFT JOIN mams.lookup_value AS p ON p.lookup_id = c.permission_level_id
          WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%' OR c.description ILIKE '%' || $1 || '%')
            AND ($2::varchar IS NULL OR c.form_type = $2)
            AND ($3::varchar IS NULL OR c.status = $3)
          ORDER BY c.name
          LIMIT $4 OFFSET $5`,
        [query, formType ?? null, status ?? null, pageSize, offset],
      );
      return result.rows.map(withoutBroadCategoryFields);
    },

    async getCategory(categoryId) {
      const result = await pool.query(
        `SELECT c.*, p.name AS permission_level
           FROM mams.category AS c
           LEFT JOIN mams.lookup_value AS p ON p.lookup_id = c.permission_level_id
          WHERE c.category_id = $1`,
        [categoryId],
      );
      return result.rows[0] ? withoutBroadCategoryFields(result.rows[0]) : null;
    },

    async createCategory({
      name,
      icon,
      description,
      formType,
      approvalRequired,
      overstayCutoff,
      permissionLevelId,
      actorUserId,
      actorRole,
      ipAddress,
      device,
    }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `INSERT INTO mams.category
             (name, form_type, approval_required, overstay_cutoff,
              permission_level_id, icon, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING category_id, name, form_type, approval_required,
                     overstay_cutoff, permission_level_id, icon, description, status, created_at`,
          [
            name,
            formType,
            approvalRequired,
            overstayCutoff,
            permissionLevelId,
            icon,
            description,
          ],
        );
        const category = result.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'CATEGORY_CREATED', 'CATEGORY', $3, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            category.category_id,
            JSON.stringify({
              name: category.name,
              form_type: category.form_type,
              approval_required: category.approval_required,
              permission_level_id: category.permission_level_id,
              icon: category.icon,
              description: category.description,
            }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return category;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async updateCategory({ categoryId, changes, actorUserId, actorRole, ipAddress, device }) {
      const entries = Object.entries(changes).filter(([key]) => writableColumns[key]);
      if (entries.length === 0) {
        throw new TypeError('At least one category field must be updated');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          'SELECT * FROM mams.category WHERE category_id = $1 FOR UPDATE',
          [categoryId],
        );
        const current = currentResult.rows[0];
        if (!current) {
          await client.query('ROLLBACK');
          return null;
        }
        if (changes.status === 'INACTIVE' && current.status === 'ACTIVE') {
          await client.query('SELECT pg_advisory_xact_lock(1296126567)');
          const active = await client.query("SELECT count(*)::int AS count FROM mams.category WHERE status = 'ACTIVE'");
          if (active.rows[0].count <= 1) throw new ApiError(409, 'LAST_ACTIVE_CATEGORY', 'At least one category must remain active.');
        }

        const oldValue = {};
        const newValue = {};
        for (const [key, value] of entries) {
          const column = writableColumns[key];
          oldValue[column] = current[column];
          newValue[column] = value;
        }

        const assignments = entries.map(([key], index) => `${writableColumns[key]} = $${index + 1}`);
        const values = entries.map(([key, value]) => key === 'formSchema' ? JSON.stringify(value) : value);
        values.push(categoryId);
        await client.query(
          `UPDATE mams.category
              SET ${assignments.join(', ')}, updated_at = now()
            WHERE category_id = $${values.length}
          RETURNING *`,
          values,
        );
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'CATEGORY_UPDATED', 'CATEGORY', $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            categoryId,
            JSON.stringify(oldValue),
            JSON.stringify(newValue),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        const detailedResult = await client.query(
          `SELECT c.*, p.name AS permission_level
             FROM mams.category AS c
             LEFT JOIN mams.lookup_value AS p ON p.lookup_id = c.permission_level_id
            WHERE c.category_id = $1`,
          [categoryId],
        );
        await client.query('COMMIT');
        return withoutBroadCategoryFields(detailedResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteCategory({ categoryId, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          'SELECT * FROM mams.category WHERE category_id = $1 FOR UPDATE',
          [categoryId],
        );
        const category = currentResult.rows[0];
        if (!category) {
          await client.query('ROLLBACK');
          return null;
        }
        await client.query('DELETE FROM mams.category WHERE category_id = $1', [categoryId]);
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'CATEGORY_DELETED', 'CATEGORY', $3, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            categoryId,
            JSON.stringify({ name: category.name, form_type: category.form_type }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return category;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
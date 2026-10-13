export function createLocationsRepository(pool) {
  const writableColumns = {
    name: 'name',
    locationType: 'location_type',
    isRestricted: 'is_restricted',
    departmentId: 'department_id',
    status: 'status',
  };

  return {
    async listActiveLocations({ pageSize, offset, query = '', locationType }) {
      const result = await pool.query(
        `SELECT location_id, name, location_type, is_restricted,
                count(*) OVER()::int AS total
           FROM mams.location
          WHERE status = 'ACTIVE'
            AND ($1 = '' OR name ILIKE '%' || $1 || '%')
            AND ($2::varchar IS NULL OR location_type = $2)
          ORDER BY location_type, name
          LIMIT $3 OFFSET $4`,
        [query, locationType ?? null, pageSize, offset],
      );
      return result.rows;
    },

    async getLocation(locationId) {
      const result = await pool.query(
        `SELECT location_id, name, location_type, is_restricted,
                department_id, status, created_at, updated_at
           FROM mams.location
          WHERE location_id = $1`,
        [locationId],
      );
      return result.rows[0] ?? null;
    },

    async createLocation({
      name,
      locationType,
      isRestricted,
      departmentId,
      actorUserId,
      actorRole,
      ipAddress,
      device,
    }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `INSERT INTO mams.location (name, location_type, is_restricted, department_id)
           VALUES ($1, $2, $3, $4)
           RETURNING location_id, name, location_type, is_restricted, department_id, status, created_at`,
          [name, locationType, isRestricted, departmentId],
        );
        const location = result.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'LOCATION_CREATED', 'LOCATION', $3, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            location.location_id,
            JSON.stringify({
              name: location.name,
              location_type: location.location_type,
              is_restricted: location.is_restricted,
              department_id: location.department_id,
            }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return location;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async updateLocation({ locationId, changes, actorUserId, actorRole, ipAddress, device }) {
      const entries = Object.entries(changes).filter(([key]) => writableColumns[key]);
      if (entries.length === 0) {
        throw new TypeError('At least one location field must be updated');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          'SELECT * FROM mams.location WHERE location_id = $1 FOR UPDATE',
          [locationId],
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
        const values = entries.map(([, value]) => value);
        values.push(locationId);
        const updatedResult = await client.query(
          `UPDATE mams.location
              SET ${assignments.join(', ')}, updated_at = now()
            WHERE location_id = $${values.length}
          RETURNING location_id, name, location_type, is_restricted,
                    department_id, status, created_at, updated_at`,
          values,
        );
        const location = updatedResult.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'MASTER', 'LOCATION_UPDATED', 'LOCATION', $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            locationId,
            JSON.stringify(oldValue),
            JSON.stringify(newValue),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return location;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
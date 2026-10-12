import { ApiError } from '../../errors/ApiError.js';

const deviceValue = (device) => device?.slice(0, 100) ?? null;

export function createVisitsRepository(pool) {
  return {
    async checkIn({ personId, checkinGateId, checkinLocationId, actorUserId, actorRole, device, ipAddress }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const personResult = await client.query(
          `SELECT p.person_id, p.status, p.accompanying_count, p.accompanying,
              p.expires_on < (now() AT TIME ZONE 'Asia/Kolkata')::date AS access_expired,
                  gate.location_id IS NOT NULL AS gate_valid,
                  area.location_id IS NOT NULL AS area_valid,
                  EXISTS (
                    SELECT 1 FROM mams.blacklist AS b
                     WHERE b.person_id = p.person_id
                       AND b.lifted_at IS NULL
                       AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
                       AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
                  ) AS is_blacklisted,
                  EXISTS (
                    SELECT 1 FROM mams.visit AS v
                     WHERE v.person_id = p.person_id AND v.status = 'OPEN'
                  ) AS already_inside,
                  (area.is_restricted AND NOT EXISTS (
                    SELECT 1 FROM mams.person_location AS pl
                     WHERE pl.person_id = p.person_id AND pl.location_id = area.location_id
                  )) AS location_warning
             FROM mams.person AS p
             LEFT JOIN mams.location AS gate
               ON gate.location_id = $2 AND gate.location_type = 'GATE' AND gate.status = 'ACTIVE'
             LEFT JOIN mams.location AS area
               ON area.location_id = $3 AND area.location_type = 'AREA' AND area.status = 'ACTIVE'
            WHERE p.person_id = $1
            FOR UPDATE OF p`,
          [personId, checkinGateId, checkinLocationId],
        );
        const person = personResult.rows[0];
        if (!person) {
          throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person record not found');
        }
        if (!person.gate_valid || !person.area_valid || checkinGateId === checkinLocationId) {
          throw new ApiError(400, 'INVALID_LOCATION', 'Select an active gate and area');
        }
        if (person.is_blacklisted) {
          throw new ApiError(409, 'BLOCKED_BLACKLIST', 'Blacklisted persons cannot check in');
        }
        if (person.status !== 'ACTIVE' || person.access_expired) {
          throw new ApiError(409, 'NOT_ACTIVE', 'Only active persons can check in');
        }
        if (person.already_inside) {
          throw new ApiError(409, 'ALREADY_INSIDE', 'Person already has an open visit');
        }
        const insertedResult = await client.query(
          `INSERT INTO mams.visit
             (person_id, checkin_gate_id, checkin_location_id, checkin_by,
              checkin_device, accompanying_count, accompanying_names, location_override)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
           RETURNING visit_id, person_id, status, checkin_at, checkin_gate_id,
                     checkin_location_id, accompanying_count, accompanying_names,
                     location_override`,
          [
            personId,
            checkinGateId,
            checkinLocationId,
            actorUserId,
            deviceValue(device),
            person.accompanying_count,
            JSON.stringify(person.accompanying),
            person.location_warning === true,
          ],
        );
        const visit = insertedResult.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'GATE', 'CHECK_IN', 'VISIT', $3, NULL, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            visit.visit_id,
            JSON.stringify({
              person_id: personId,
              checkin_gate_id: checkinGateId,
              checkin_location_id: checkinLocationId,
              location_warning: person.location_warning,
              status: visit.status,
            }),
            ipAddress ?? null,
            deviceValue(device),
          ],
        );
        await client.query('COMMIT');
        return { ...visit, locationWarning: person.location_warning };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (error.code === '23505') {
          throw new ApiError(409, 'ALREADY_INSIDE', 'Person already has an open visit');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_LOCATION', 'The selected gate or area is invalid');
        }
        throw error;
      } finally {
        client.release();
      }
    },

    async checkOut({ visitId, checkoutGateId, checkoutLocationId, actorUserId, actorRole, device, ipAddress }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          `SELECT visit_id, person_id, status, checkin_at
             FROM mams.visit
            WHERE visit_id = $1 AND status = 'OPEN'
            FOR UPDATE`,
          [visitId],
        );
        const current = currentResult.rows[0];
        if (!current) {
          await client.query('ROLLBACK');
          return null;
        }

        const updatedResult = await client.query(
          `UPDATE mams.visit
              SET status = 'CLOSED', checkout_at = now(), checkout_gate_id = $2,
                  checkout_location_id = $3, checkout_by = $4, checkout_device = $5
            WHERE visit_id = $1 AND status = 'OPEN'
          RETURNING visit_id, person_id, status, checkin_at, checkout_at,
                    checkin_gate_id, checkin_location_id, checkout_gate_id,
                    checkout_location_id, checkout_by, checkout_device`,
          [visitId, checkoutGateId, checkoutLocationId, actorUserId, deviceValue(device)],
        );
        const visit = updatedResult.rows[0];
        if (!visit) {
          await client.query('ROLLBACK');
          return null;
        }

        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'GATE', 'CHECK_OUT', 'VISIT', $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            visitId,
            JSON.stringify({ status: current.status, checkin_at: current.checkin_at }),
            JSON.stringify({ status: visit.status, checkout_at: visit.checkout_at }),
            ipAddress ?? null,
            deviceValue(device),
          ],
        );
        await client.query('COMMIT');
        return visit;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_LOCATION', 'The selected gate or location is invalid');
        }
        throw error;
      } finally {
        client.release();
      }
    },

    async reconcile({ visitId, note, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const current = (await client.query(
          `SELECT v.visit_id, v.person_id, v.checkin_gate_id, v.checkin_location_id,
                  v.checkin_at, p.first_name || ' ' || p.last_name AS name,
                  l.name AS location
             FROM mams.visit AS v
             JOIN mams.person AS p ON p.person_id = v.person_id
             JOIN mams.location AS l ON l.location_id = v.checkin_location_id
            WHERE v.visit_id = $1 AND v.status = 'OPEN'
            FOR UPDATE OF v`,
          [visitId],
        )).rows[0];
        if (!current) {
          await client.query('ROLLBACK');
          return null;
        }
        const visit = (await client.query(
          `UPDATE mams.visit SET status = 'CLOSED_BY_ADMIN', checkout_at = now(),
                  checkout_by = $2, admin_note = $3
            WHERE visit_id = $1 AND status = 'OPEN'
            RETURNING visit_id, person_id, status, checkout_at, admin_note`,
          [visitId, actorUserId, note],
        )).rows[0];
        if (!visit) {
          await client.query('ROLLBACK');
          return null;
        }
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'GATE', 'MANUAL_VISIT_RECONCILIATION', 'VISIT', $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [actorUserId, actorRole, visitId,
            JSON.stringify({ status: 'OPEN', person_id: current.person_id, location: current.location }),
            JSON.stringify({ status: visit.status, reason: note }), ipAddress ?? null, deviceValue(device)],
        );
        await client.query('COMMIT');
        return { ...visit, name: current.name, location: current.location };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally { client.release(); }
    },
  };
}
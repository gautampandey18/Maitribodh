export function createApprovalsRepository(pool) {
  return {
    async listPending({ pageSize, offset }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, p.photo_key IS NOT NULL AS has_photo,
                h.acted_by AS submitted_by, h.acted_at AS submitted_at,
                count(*) OVER()::int AS total
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN LATERAL (
             SELECT acted_by, acted_at
               FROM mams.approval_history
              WHERE person_id = p.person_id
                AND action IN ('SUBMITTED', 'RESUBMITTED')
              ORDER BY acted_at DESC
              LIMIT 1
           ) AS h ON true
          WHERE p.status = 'PENDING'
          ORDER BY h.acted_at
          LIMIT $1 OFFSET $2`,
        [pageSize, offset],
      );
      return result.rows;
    },

    async decide({ personId, decision, reason, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const personResult = await client.query(
          `SELECT person_id, status
             FROM mams.person
            WHERE person_id = $1
            FOR UPDATE`,
          [personId],
        );
        const person = personResult.rows[0];
        if (!person) {
          await client.query('ROLLBACK');
          return null;
        }
        if (person.status !== 'PENDING') {
          throw repositoryError('PERSON_NOT_PENDING', 'Person is not pending approval');
        }

        const submissionResult = await client.query(
          `SELECT acted_by
             FROM mams.approval_history
            WHERE person_id = $1 AND action IN ('SUBMITTED', 'RESUBMITTED')
            ORDER BY acted_at DESC
            LIMIT 1`,
          [personId],
        );
        const submitterId = submissionResult.rows[0]?.acted_by;
        if (!submitterId) {
          throw repositoryError('SUBMISSION_NOT_FOUND', 'Submission history is missing');
        }

        if (String(submitterId) === String(actorUserId)) {
          throw repositoryError('SELF_APPROVAL_FORBIDDEN', 'Approvers cannot approve or reject their own submissions');
        }

        const approved = decision === 'APPROVE';
        const updatedResult = await client.query(
          approved
            ? `UPDATE mams.person
                  SET status = 'ACTIVE', qr_version = 1, approved_by = $2,
                      approved_at = now(), updated_at = now()
                WHERE person_id = $1 AND status = 'PENDING'
              RETURNING person_id, person_code, status, qr_version, approved_by, approved_at`
            : `UPDATE mams.person
                  SET status = 'REJECTED', updated_by = $2, updated_at = now()
                WHERE person_id = $1 AND status = 'PENDING'
              RETURNING person_id, person_code, status`,
          [personId, actorUserId],
        );
        const updatedPerson = updatedResult.rows[0];
        if (!updatedPerson) {
          throw repositoryError('PERSON_NOT_PENDING', 'Person is not pending approval');
        }

        const historyAction = approved ? 'APPROVED' : 'REJECTED';
        const message = approved ? 'Your registration was approved.' : 'Your registration was rejected.';
        await client.query(
          `INSERT INTO mams.approval_history (person_id, action, reason, acted_by)
           VALUES ($1, $2, $3, $4)`,
          [personId, historyAction, reason ?? null, actorUserId],
        );
        await client.query(
          `INSERT INTO mams.notification
             (user_id, type, title, body, entity_type, entity_id)
           VALUES ($1, $2, $3, $4, 'PERSON', $5)`,
          [submitterId, historyAction, `Registration ${approved ? 'approved' : 'rejected'}`, message, personId],
        );
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'APPROVAL', $3, 'PERSON', $4, $5::jsonb, $6::jsonb, $7, $8)`,
          [
            actorUserId,
            actorRole,
            historyAction,
            personId,
            JSON.stringify({ status: 'PENDING' }),
            JSON.stringify({ status: updatedPerson.status, reason: reason ?? null }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return updatedPerson;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async resubmit({ personId, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const personResult = await client.query(
          `SELECT person_id, status, registered_by
             FROM mams.person
            WHERE person_id = $1
            FOR UPDATE`,
          [personId],
        );
        const person = personResult.rows[0];
        if (!person) {
          await client.query('ROLLBACK');
          return null;
        }
        if (person.status !== 'REJECTED') {
          throw repositoryError('PERSON_NOT_REJECTED', 'Only rejected registrations can be resubmitted');
        }

        const isSubmitter = String(person.registered_by) === String(actorUserId);
        const canAssist = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';
        if (!isSubmitter && !canAssist) {
          throw repositoryError('RESUBMISSION_FORBIDDEN', 'Only the original submitter or an Admin can resubmit this record');
        }

        const updateResult = await client.query(
          `UPDATE mams.person
              SET status = 'PENDING', updated_by = $2, updated_at = now()
            WHERE person_id = $1 AND status = 'REJECTED'
          RETURNING person_id, person_code, status, updated_at`,
          [personId, actorUserId],
        );
        const updatedPerson = updateResult.rows[0];
        if (!updatedPerson) {
          throw repositoryError('PERSON_NOT_REJECTED', 'Only rejected registrations can be resubmitted');
        }

        await client.query(
          `INSERT INTO mams.approval_history (person_id, action, acted_by)
           VALUES ($1, 'RESUBMITTED', $2)`,
          [personId, actorUserId],
        );
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'APPROVAL', 'RESUBMITTED', 'PERSON', $3,
                   $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            personId,
            JSON.stringify({ status: 'REJECTED' }),
            JSON.stringify({ status: 'PENDING' }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return updatedPerson;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

function repositoryError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
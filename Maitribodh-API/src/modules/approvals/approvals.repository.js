export function createApprovalsRepository(pool) {
  return {
    async syncNonApprovalPersons() {
      const result = await pool.query(
        `UPDATE mams.person AS p
            SET status = 'ACTIVE',
                qr_version = CASE WHEN p.qr_version = 0 THEN 1 ELSE p.qr_version END,
                approved_at = COALESCE(p.approved_at, now()),
                updated_at = now()
           FROM mams.category AS c
          WHERE p.category_id = c.category_id
            AND p.status IN ('PENDING', 'REJECTED')
            AND (
              c.approval_required = false
              OR upper(trim(c.form_type)) IN ('VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT')
              OR lower(trim(c.name)) IN ('visitor', 'vendor', 'contractor', 'participant')
            )
          RETURNING p.person_id`,
      );
      return result.rowCount;
    },

    async listPending({ pageSize, offset, name = '', category = '' }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, c.form_type, c.approval_required, p.photo_key IS NOT NULL AS has_photo,
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
            AND c.approval_required = true
            AND lower(trim(c.name)) NOT IN ('visitor', 'vendor', 'contractor', 'participant')
            AND upper(trim(c.form_type)) NOT IN ('VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT')
            AND ($1 = '' OR concat_ws(' ', p.first_name, p.last_name) ILIKE '%' || $1 || '%')
            AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
          ORDER BY h.acted_at
          LIMIT $3 OFFSET $4`,
        [name, category, pageSize, offset],
      );
      return result.rows;
    },

    async listByStatus({ status, pageSize, offset, name = '', category = '' }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, c.form_type, c.approval_required, p.photo_key IS NOT NULL AS has_photo,
                COALESCE(h.acted_at, p.created_at) AS submitted_at,
                count(*) OVER()::int AS total
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
           LEFT JOIN LATERAL (
             SELECT acted_at
               FROM mams.approval_history
              WHERE person_id = p.person_id
              ORDER BY acted_at DESC
              LIMIT 1
           ) AS h ON true
          WHERE p.status = $1
            AND c.approval_required = true
            AND lower(trim(c.name)) NOT IN ('visitor', 'vendor', 'contractor', 'participant')
            AND upper(trim(c.form_type)) NOT IN ('VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT')
            AND ($2 = '' OR concat_ws(' ', p.first_name, p.last_name) ILIKE '%' || $2 || '%')
            AND ($3 = '' OR c.name ILIKE '%' || $3 || '%')
          ORDER BY COALESCE(h.acted_at, p.created_at) DESC, p.person_id DESC
          LIMIT $4 OFFSET $5`,
        [status, name, category, pageSize, offset],
      );
      return result.rows;
    },

    async decide({ personId, decision, reason, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const personResult = await client.query(
          `SELECT p.person_id, p.status, p.registered_by, c.approval_required, c.form_type, c.name AS category_name
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE p.person_id = $1
            FOR UPDATE OF p`,
          [personId],
        );
        const person = personResult.rows[0];
        if (!person) {
          await client.query('ROLLBACK');
          return null;
        }
        const isNonApproval = person.approval_required === false
          || ['VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT'].includes(person.form_type?.toUpperCase()?.trim())
          || ['visitor', 'vendor', 'contractor', 'participant'].includes(person.category_name?.toLowerCase()?.trim());
        if (isNonApproval) {
          throw repositoryError('APPROVAL_NOT_REQUIRED', 'Approval is not required for this category');
        }
        const isPending = person.status === 'PENDING';
        const canRejectActive = decision === 'REJECT' && person.status === 'ACTIVE';
        if (!isPending && !canRejectActive) {
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
        const submitterId = submissionResult.rows[0]?.acted_by ?? person.registered_by;
        if (!submitterId) {
          throw repositoryError('SUBMISSION_NOT_FOUND', 'Submission history is missing');
        }

        if (isPending && String(submitterId) === String(actorUserId)) {
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
                  SET status = 'REJECTED',
                      qr_version = CASE WHEN status = 'ACTIVE' THEN qr_version + 1 ELSE qr_version END,
                      approved_by = NULL, approved_at = NULL,
                      updated_by = $2, updated_at = now()
                WHERE person_id = $1 AND status = $3
              RETURNING person_id, person_code, status`,
          approved ? [personId, actorUserId] : [personId, actorUserId, person.status],
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
            JSON.stringify({ status: person.status }),
            JSON.stringify({ status: updatedPerson.status, reason: reason ?? null }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return updatedPerson;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
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
          `SELECT p.person_id, p.status, p.registered_by, c.approval_required, c.form_type, c.name AS category_name
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE p.person_id = $1
            FOR UPDATE OF p`,
          [personId],
        );
        const person = personResult.rows[0];
        if (!person) {
          await client.query('ROLLBACK');
          return null;
        }
        const isNonApproval = person.approval_required === false
          || ['VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT'].includes(person.form_type?.toUpperCase()?.trim())
          || ['visitor', 'vendor', 'contractor', 'participant'].includes(person.category_name?.toLowerCase()?.trim());
        if (isNonApproval) {
          throw repositoryError('APPROVAL_NOT_REQUIRED', 'Approval is not required for this category');
        }
        if (person.status !== 'REJECTED') {
          throw repositoryError('PERSON_NOT_REJECTED', 'Only rejected registrations can be resubmitted');
        }

        const isSubmitter = String(person.registered_by) === String(actorUserId);
        const canAssist = ['ADMIN', 'SUPER_ADMIN', 'APPROVER'].includes(actorRole);
        if (!isSubmitter && !canAssist) {
          throw repositoryError('RESUBMISSION_FORBIDDEN', 'Only the original submitter or an Admin can resubmit this record');
        }

        const updateResult = await client.query(
          `UPDATE mams.person
              SET status = 'PENDING',
                  updated_by = $2, updated_at = now()
            WHERE person_id = $1 AND status = 'REJECTED'
          RETURNING person_id, person_code, status, qr_version, updated_at`,
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
            JSON.stringify({ status: updatedPerson.status }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return updatedPerson;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
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
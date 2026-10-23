import { ApiError } from '../../errors/ApiError.js';
import { CONSENT_NOTICE_VERSION, ID_PROOF_PATTERNS, REGISTRATION_LIMITS, schemaForCategory } from '../../constants/registration.js';
import { validateCategoryDetails } from './registration.validation.js';

export function createRegistrationRepository(pool) {
  function withoutCategoryPermission(category) {
    if (!category) return category;
    const result = { ...category };
    delete result.permission_level_id;
    return result;
  }

  async function transaction(operation) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  }

  async function audit(client, actor, activity, personId, oldValue, newValue) {
    await client.query(`INSERT INTO mams.audit_log (user_id, user_role, module, activity, entity_type, entity_id, old_value, new_value, ip_address, device)
      VALUES ($1, $2, 'OPERATIONS', $3, 'PERSON', $4, $5::jsonb, $6::jsonb, $7, $8)`,
    [actor.userId, actor.role, activity, personId, JSON.stringify(oldValue), JSON.stringify(newValue), actor.ipAddress ?? null, actor.device?.slice(0, 100) ?? null]);
  }

  return {
    async options() {
      const categories = await pool.query("SELECT * FROM mams.category WHERE status = 'ACTIVE' ORDER BY category_id");
      const lookups = await pool.query("SELECT * FROM mams.lookup_value WHERE status = 'ACTIVE' ORDER BY name");
      const locations = await pool.query("SELECT * FROM mams.location WHERE status = 'ACTIVE' ORDER BY name");
      return {
        categories: categories.rows.map((category) => ({
          ...Object.fromEntries(Object.entries(category).filter(([key]) => !['is_broad', 'broad_category_id', 'permission_level_id'].includes(key))),
          schema: schemaForCategory(category),
        })),
        lookups: lookups.rows,
        locations: locations.rows,
      };
    },
    async category(categoryId) {
      return withoutCategoryPermission((await pool.query('SELECT * FROM mams.category WHERE category_id = $1', [categoryId])).rows[0]);
    },
    async get(personId) {
      const person = (await pool.query(`SELECT p.*, c.name AS category, c.form_type,
        ARRAY(SELECT location_id FROM mams.person_location WHERE person_id = p.person_id) AS location_ids
        FROM mams.person p JOIN mams.category c USING (category_id) WHERE p.person_id = $1`, [personId])).rows[0];
      if (!person) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
      delete person.passport_number_enc;
      delete person.id_proof_number_enc;
      delete person.draft_data;
      return person;
    },
    async capturePhoto({ personId, photoKey, expectedMissingPhotoKey, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT p.photo_key, p.status, c.form_type FROM mams.person p JOIN mams.category c USING(category_id) WHERE p.person_id = $1 FOR UPDATE OF p', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        if (actor.role === 'SECURITY_GUARD' && current.status !== 'ACTIVE') throw new ApiError(409, 'INVALID_STATE', 'A photo can only be captured for an active person');
        if (actor.role === 'SECURITY_GUARD' && current.photo_key && current.photo_key !== expectedMissingPhotoKey) throw new ApiError(409, 'PHOTO_ALREADY_EXISTS', 'This person already has a profile photo');
        if (current.status === 'DRAFT') throw new ApiError(409, 'INVALID_STATE', 'A photo cannot be saved for a draft registration');
        await client.query('UPDATE mams.person SET photo_key = $2, updated_by = $3, updated_at = now() WHERE person_id = $1', [personId, photoKey, actor.userId]);
        await audit(client, actor, current.photo_key ? 'PHOTO_UPDATED' : 'PHOTO_CAPTURED', personId, current.photo_key ? { photo_key: current.photo_key } : null, { photo_key: photoKey });
        return { photo_key: photoKey, previous_photo_key: current.photo_key };
      });
    },
    async create({ input, category, photoKey, documents, passportEncrypted, idProofEncrypted, actor }) {
      return transaction(async (client) => {
        const currentCategory = (await client.query('SELECT * FROM mams.category WHERE category_id = $1 FOR SHARE', [input.categoryId])).rows[0];
        if (!currentCategory || currentCategory.status !== 'ACTIVE' || currentCategory.approval_required === null || currentCategory.approval_required !== category.approval_required) throw new ApiError(409, 'CATEGORY_CHANGED', 'Category configuration changed. Reload and review this registration.');
        validateCategoryDetails(input, currentCategory, actor.role);
        if (input.idProofTypeId) {
          const proof = (await client.query("SELECT name FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = 'ID_PROOF_TYPE' AND status = 'ACTIVE'", [input.idProofTypeId])).rows[0];
          if (!proof) throw new ApiError(400, 'VALIDATION_ERROR', 'Select an active ID Proof Type');
          if (input.idProofNumber && ID_PROOF_PATTERNS[proof.name] && !ID_PROOF_PATTERNS[proof.name].test(input.idProofNumber)) throw new ApiError(400, 'VALIDATION_ERROR', 'ID Proof Number does not match the selected type.');
        }
        const schema = schemaForCategory(currentCategory);
        for (const field of schema.fields ?? []) {
          const value = input.categoryDetails[field.key];
          if (field.type !== 'select' || !field.source || value === undefined || value === '') continue;
          const selected = field.source === 'AREA'
            ? await client.query("SELECT location_id FROM mams.location WHERE location_id = $1 AND location_type = 'AREA' AND status = 'ACTIVE'", [value])
            : await client.query("SELECT lookup_id, parent_id, category_id FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = $2 AND status = 'ACTIVE'", [value, field.source]);
          if (!selected.rowCount) throw new ApiError(400, 'VALIDATION_ERROR', `Select an active ${field.label}`);
          if (field.source === 'JOB_ROLE' && String(selected.rows[0].parent_id) !== String(input.categoryDetails.department_id)) throw new ApiError(400, 'VALIDATION_ERROR', 'Job Role must belong to the selected Department.');
          if (field.source === 'SUBCATEGORY' && selected.rows[0].category_id && Number(selected.rows[0].category_id) !== input.categoryId) throw new ApiError(400, 'VALIDATION_ERROR', 'Select a subcategory for this category');
        }
        const permissionId = input.permissionLevelId;
        if (permissionId && !(await client.query("SELECT lookup_id FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = 'PERMISSION_LEVEL' AND status = 'ACTIVE'", [permissionId])).rowCount) throw new ApiError(400, 'VALIDATION_ERROR', 'Select an active permission level');
        const status = category.approval_required ? 'PENDING' : 'ACTIVE';
        const result = await client.query(`INSERT INTO mams.person
          (category_id, first_name, last_name, mobile, alternate_mobile, gender, resident_status, passport_number_enc, passport_last4, date_of_birth,
           address, email, photo_key, emergency_contact_name, emergency_contact_mobile, permission_level_id, category_details, accompanying_count,
           documents, remarks, status, source, qr_version, registered_by, consent_at, consent_notice_version, consent_captured_by, expires_on,
           id_proof_type_id, id_proof_number_enc, id_proof_last4)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,$19::jsonb,$20,$21,$22,$23,$24,now(),$25,$24,$26,$27,$28,$29)
          RETURNING person_id, person_code, status, qr_version`,
        [input.categoryId, input.firstName, input.lastName, input.mobile, input.alternateMobile || null, input.gender, input.residentStatus,
          passportEncrypted, input.residentStatus === 'NON_RESIDENT' ? input.passportNumber.slice(-4) : null, input.dateOfBirth || null,
          input.address || null, input.email || null, photoKey, input.emergencyName || null, input.emergencyMobile || null, permissionId,
          JSON.stringify(input.categoryDetails), input.accompanyingCount, JSON.stringify(documents), input.remarks || null, status, input.source,
          status === 'ACTIVE' ? 1 : 0, actor.userId, CONSENT_NOTICE_VERSION, input.categoryDetails.end_date || null,
          input.idProofTypeId ?? null, idProofEncrypted ?? null, input.idProofNumber ? input.idProofNumber.slice(-4) : null]);
        const person = result.rows[0];
        for (const locationId of new Set(input.locationIds)) {
          const assigned = await client.query(`INSERT INTO mams.person_location (person_id, location_id, assigned_by)
            SELECT $1, location_id, $3 FROM mams.location WHERE location_id = $2 AND location_type = 'AREA' AND status = 'ACTIVE' RETURNING location_id`, [person.person_id, locationId, actor.userId]);
          if (!assigned.rowCount) throw new ApiError(400, 'VALIDATION_ERROR', 'Select active assigned areas');
        }
        if (status === 'PENDING') await client.query("INSERT INTO mams.approval_history (person_id, action, acted_by) VALUES ($1, 'SUBMITTED', $2)", [person.person_id, actor.userId]);
        await audit(client, actor, 'CREATE', person.person_id, null, { ...person, name: `${input.firstName} ${input.lastName}`, category: category.name });
        await client.query(`INSERT INTO mams.notification (user_id, type, title, body, entity_type, entity_id)
          SELECT user_id, 'REGISTRATION_SUBMITTED', 'Registration Submitted', $1, 'PERSON', $2 FROM mams.app_user
          WHERE status = 'ACTIVE' AND (role IN ('SUPER_ADMIN','ADMIN','APPROVER') OR user_id = $3)`, [`${input.firstName} ${input.lastName} · ${category.name} · ${status}`, person.person_id, actor.userId]);
        return person;
      });
    },
    async update({ personId, changes, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT p.*, c.form_type FROM mams.person p JOIN mams.category c USING(category_id) WHERE person_id = $1 FOR UPDATE OF p', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        if (current.form_type !== 'VISITOR' && !changes.mobile.startsWith('+91')) throw new ApiError(400, 'VALIDATION_ERROR', 'Only Visitor profiles can use a non-Indian mobile number');
        const updated = (await client.query(`UPDATE mams.person SET first_name = $2, last_name = $3, mobile = $4::varchar(16), alternate_mobile = $5,
          email = $6, address = $7, emergency_contact_name = $8, emergency_contact_mobile = $9,
          qr_version = CASE WHEN mobile IS DISTINCT FROM $11::varchar(16) AND status = 'ACTIVE' THEN qr_version + 1 ELSE qr_version END,
          updated_by = $10, updated_at = now() WHERE person_id = $1 RETURNING person_id, person_code, first_name, last_name, mobile, status, qr_version`,
        [personId, changes.firstName, changes.lastName, changes.mobile, changes.alternateMobile || null, changes.email || null, changes.address || null,
          changes.emergencyName || null, changes.emergencyMobile || null, actor.userId, changes.mobile])).rows[0];
        const before = { first_name: current.first_name, last_name: current.last_name, mobile: current.mobile, status: current.status, qr_version: current.qr_version };
        await audit(client, actor, 'UPDATE', personId, before, updated);
        if (current.mobile !== changes.mobile) await audit(client, actor, 'QR_REGENERATION', personId, { qr_version: current.qr_version }, { qr_version: updated.qr_version });
        return updated;
      });
    },
    async delete({ personId, actor }) {
      return transaction(async (client) => {
        const current = (await client.query(
          'SELECT person_id, first_name, last_name, status, photo_key, documents FROM mams.person WHERE person_id = $1 FOR UPDATE',
          [personId],
        )).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');

        await client.query('DELETE FROM mams.visit WHERE person_id = $1', [personId]);
        await client.query('DELETE FROM mams.blacklist WHERE person_id = $1', [personId]);
        await client.query('DELETE FROM mams.person WHERE person_id = $1', [personId]);
        await audit(
          client,
          actor,
          'DELETE',
          personId,
          { first_name: current.first_name, last_name: current.last_name, status: current.status },
          null,
        );
        return { photo_key: current.photo_key, documents: current.documents ?? [] };
      });
    },
    async addDocuments({ personId, documents, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT p.documents, c.form_type FROM mams.person p JOIN mams.category c USING(category_id) WHERE p.person_id = $1 FOR UPDATE OF p', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        const existingDocuments = current.documents ?? [];
        if (existingDocuments.length + documents.length > REGISTRATION_LIMITS.documentCount) throw new ApiError(400, 'VALIDATION_ERROR', `A person can have at most ${REGISTRATION_LIMITS.documentCount} documents.`);
        const combined = [...existingDocuments, ...documents];
        await client.query('UPDATE mams.person SET documents = $2::jsonb, updated_by = $3, updated_at = now() WHERE person_id = $1', [personId, JSON.stringify(combined), actor.userId]);
        await audit(client, actor, 'DOCUMENTS_UPDATED', personId, { documents: existingDocuments }, { documents: combined });
        return { documents: combined };
      });
    },
    async updateAccess({ personId, changes, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT p.permission_level_id, p.expires_on, c.form_type FROM mams.person p JOIN mams.category c USING(category_id) WHERE p.person_id = $1 FOR UPDATE OF p', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        if (changes.permissionLevelId && !(await client.query("SELECT lookup_id FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = 'PERMISSION_LEVEL' AND status = 'ACTIVE'", [changes.permissionLevelId])).rowCount) throw new ApiError(400, 'VALIDATION_ERROR', 'Select an active permission level');
        const locationIds = [...new Set(changes.locationIds)];
        if (locationIds.length) {
          const areas = await client.query("SELECT location_id FROM mams.location WHERE location_id = ANY($1::integer[]) AND location_type = 'AREA' AND status = 'ACTIVE'", [locationIds]);
          if (areas.rowCount !== locationIds.length) throw new ApiError(400, 'VALIDATION_ERROR', 'Select active assigned areas');
        }
        await client.query('UPDATE mams.person SET permission_level_id = $2, expires_on = $3, updated_by = $4, updated_at = now() WHERE person_id = $1', [personId, changes.permissionLevelId, changes.expiresOn || null, actor.userId]);
        await client.query('DELETE FROM mams.person_location WHERE person_id = $1', [personId]);
        for (const locationId of locationIds) await client.query('INSERT INTO mams.person_location (person_id, location_id, assigned_by) VALUES ($1, $2, $3)', [personId, locationId, actor.userId]);
        const updated = { permission_level_id: changes.permissionLevelId, location_ids: locationIds, expires_on: changes.expiresOn || null };
        await audit(client, actor, 'ACCESS_UPDATED', personId, current, updated);
        return updated;
      });
    },
    async setStatus({ personId, status, reason, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT status FROM mams.person WHERE person_id = $1 FOR UPDATE', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (status === 'ACTIVE' && current.status !== 'DEACTIVATED') throw new ApiError(409, 'INVALID_STATE', 'Only deactivated profiles can be reactivated');
        if (status === 'DEACTIVATED' && current.status !== 'ACTIVE') throw new ApiError(409, 'INVALID_STATE', 'Only active profiles can be deactivated');
        await client.query('UPDATE mams.person SET status = $2, deactivated_reason = $3, updated_by = $4, updated_at = now() WHERE person_id = $1', [personId, status, reason, actor.userId]);
        await audit(client, actor, status === 'ACTIVE' ? 'REACTIVATE_PERSON' : 'DEACTIVATE_PERSON', personId, current, { status, reason });
        return { person_id: personId, status };
      });
    },
    async saveDraft({ draftId, input, actor }) {
      return transaction(async (client) => {
        const data = { ...input, passportNumber: '', idProofNumber: '' };
        const result = draftId
          ? await client.query("UPDATE mams.person SET draft_data = $1::jsonb, updated_at = now() WHERE person_id = $2 AND registered_by = $3 AND status = 'DRAFT' RETURNING person_id", [JSON.stringify(data), draftId, actor.userId])
          : await client.query("INSERT INTO mams.person (category_id, registered_by, status, draft_data) VALUES ($1, $2, 'DRAFT', $3::jsonb) RETURNING person_id", [input.categoryId, actor.userId, JSON.stringify(data)]);
        if (!result.rowCount) throw new ApiError(404, 'DRAFT_NOT_FOUND', 'Draft not found');
        await audit(client, actor, 'SAVE_DRAFT', result.rows[0].person_id, null, { category_id: input.categoryId });
        return result.rows[0];
      });
    },
    async drafts(userId) {
      return (await pool.query(`SELECT p.person_id, p.draft_data, p.updated_at
        FROM mams.person p
        JOIN mams.category c ON c.category_id = p.category_id AND c.status = 'ACTIVE'
        WHERE p.registered_by = $1 AND p.status = 'DRAFT'
          AND p.updated_at > now() - interval '7 days'
        ORDER BY p.updated_at DESC`, [userId])).rows;
    },
    async activity(personId) {
      return (await pool.query('SELECT v.*, l.name AS location FROM mams.visit v JOIN mams.location l ON l.location_id = v.checkin_location_id WHERE person_id = $1 ORDER BY checkin_at DESC LIMIT 100', [personId])).rows;
    },
  };
}
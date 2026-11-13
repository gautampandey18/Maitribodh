import { ApiError } from '../../errors/ApiError.js';
import { CONSENT_NOTICE_VERSION, ID_PROOF_PATTERNS, REGISTRATION_LIMITS, schemaForCategory } from '../../constants/registration.js';
import { validateCategoryDetails } from './registration.validation.js';

export function createRegistrationRepository(pool) {
  async function transaction(operation) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error.code === '23505' && (
        ['ux_person_mobile_category', 'ux_person_identity_category', 'person_identity_mobile_key'].includes(error.constraint)
        || String(error.detail).includes('mobile')
      )) {
        throw new ApiError(409, 'DUPLICATE_REGISTRATION', 'This mobile number is already registered under this category.');
      }
      throw error;
    } finally { client.release(); }
  }

  async function audit(client, actor, activity, personId, oldValue, newValue) {
    await client.query(`INSERT INTO mams.audit_log (user_id, user_role, module, activity, entity_type, entity_id, old_value, new_value, ip_address, device)
      VALUES ($1, $2, 'OPERATIONS', $3, 'PERSON', $4, $5::jsonb, $6::jsonb, $7, $8)`,
    [actor.userId, actor.role, activity, personId, JSON.stringify(oldValue), JSON.stringify(newValue), actor.ipAddress ?? null, actor.device?.slice(0, 100) ?? null]);
  }

  async function validateCategoryReferences(client, input, category) {
    const schema = schemaForCategory(category);
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
  }

  return {
    async options() {
      const categories = await pool.query("SELECT * FROM mams.category WHERE status = 'ACTIVE' ORDER BY category_id");
      const lookups = await pool.query("SELECT * FROM mams.lookup_value WHERE status = 'ACTIVE' ORDER BY name");
      const locations = await pool.query(
        `SELECT location.*,
                COALESCE((SELECT sum(1 + visit.accompanying_count)::int
                            FROM mams.visit AS visit
                           WHERE visit.checkin_location_id = location.location_id
                             AND visit.status = 'OPEN'), 0) AS current_occupancy
           FROM mams.location AS location
          WHERE location.status = 'ACTIVE'
          ORDER BY location.name`,
      );
      return {
        categories: categories.rows.map((category) => ({
          ...Object.fromEntries(Object.entries(category).filter(([key]) => !['is_broad', 'broad_category_id'].includes(key))),
          schema: schemaForCategory(category),
        })),
        lookups: lookups.rows,
        locations: locations.rows,
      };
    },
    async category(categoryId) {
      return (await pool.query('SELECT * FROM mams.category WHERE category_id = $1', [categoryId])).rows[0];
    },
    async checkMobile({ mobile, categoryId, personId = null }) {
      const normalized = mobile.startsWith('+') ? mobile : `+91${mobile}`;
      const existing = (await pool.query(
        `SELECT person.person_id, identity.qr_code AS person_code,
                identity.first_name || ' ' || identity.last_name AS name, person.status
         FROM mams.person AS person
         JOIN mams.person_identity AS identity USING (identity_id)
         WHERE person.category_id = $1
           AND (identity.mobile = $2 OR identity.mobile = $3)
           AND ($4::bigint IS NULL OR person.person_id <> $4)
           AND person.status IN ('ACTIVE', 'PENDING', 'DEACTIVATED')
         LIMIT 1`,
        [categoryId, normalized, mobile, personId],
      )).rows[0];
      if (existing) {
        return {
          available: false,
          message: 'This mobile number is already registered under this category.',
          existingPerson: {
            personId: existing.person_id,
            personCode: existing.person_code,
            name: existing.name,
            status: existing.status,
          },
        };
      }
      return { available: true };
    },
    async get(personId) {
      const person = (await pool.query(`SELECT p.*, identity.first_name, identity.last_name,
        identity.mobile, identity.alternate_mobile, identity.gender, identity.date_of_birth,
        identity.resident_status, identity.passport_number_enc, identity.passport_last4,
        identity.address, identity.email, identity.photo_key, identity.id_proof_type_id,
        identity.id_proof_number_enc, identity.id_proof_last4, identity.emergency_contact_name,
        identity.emergency_contact_mobile, identity.documents, identity.guardian_name,
        identity.guardian_mobile, identity.guardian_consent_at, identity.guardian_consent_notice_version,
        identity.qr_code AS person_code, identity.identity_id AS user_id,
        identity.qr_code AS identity_qr_code, identity.qr_version AS identity_qr_version,
        c.name AS registration_category, c.form_type,
        COALESCE(category_summary.categories, '') AS category,
        COALESCE(category_summary.active_categories, '') AS active_category,
        ARRAY(SELECT location_id FROM mams.person_location WHERE person_id = p.person_id) AS location_ids
        FROM mams.person p
        JOIN mams.category c USING (category_id)
        LEFT JOIN mams.person_identity AS identity USING (identity_id)
        LEFT JOIN LATERAL (
          SELECT string_agg(DISTINCT category.name, ', ' ORDER BY category.name)
                   FILTER (WHERE membership.status <> 'DRAFT') AS categories,
                 string_agg(DISTINCT category.name, ', ' ORDER BY category.name)
                   FILTER (WHERE membership.status = 'ACTIVE'
                     OR (membership.status = 'PENDING' AND category.approval_required = false)) AS active_categories
            FROM mams.person AS membership
            JOIN mams.category AS category ON category.category_id = membership.category_id
           WHERE ((p.identity_id IS NOT NULL AND membership.identity_id = p.identity_id)
               OR (p.identity_id IS NULL AND membership.person_id = p.person_id))
        ) AS category_summary ON true
        WHERE p.person_id = $1`, [personId])).rows[0];
      if (!person) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
      delete person.passport_number_enc;
      delete person.id_proof_number_enc;
      delete person.draft_data;
      return person;
    },
    async categoryAssignments(personId) {
      const result = await pool.query(
        `SELECT p.person_id, p.identity_id, identity.identity_id AS user_id,
                identity.qr_code AS person_code, identity.first_name, identity.last_name, identity.mobile,
                identity.alternate_mobile, identity.gender, identity.date_of_birth, identity.resident_status,
                identity.address, identity.email, identity.emergency_contact_name, identity.emergency_contact_mobile,
                identity.photo_key, identity.id_proof_type_id, identity.id_proof_number_enc, identity.id_proof_last4,
                identity.passport_number_enc, identity.passport_last4, identity.documents, p.status AS profile_status,
                identity.qr_code, identity.qr_version,
                COALESCE(jsonb_agg(jsonb_build_object(
                  'category_id', c.category_id, 'name', c.name, 'status', registration.status
                )) FILTER (WHERE c.category_id IS NOT NULL), '[]'::jsonb) AS categories
           FROM mams.person AS p
           JOIN mams.person_identity AS identity USING (identity_id)
           LEFT JOIN mams.person AS registration
             ON registration.identity_id = p.identity_id
            AND registration.status <> 'DRAFT'
           LEFT JOIN mams.category AS c ON c.category_id = registration.category_id
          WHERE p.person_id = $1 AND p.status <> 'DRAFT'
          GROUP BY p.person_id, identity.identity_id`,
        [personId],
      );
      if (!result.rowCount) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
      const profile = result.rows[0];
      delete profile.id_proof_number_enc;
      delete profile.passport_number_enc;
      return profile;
    },
    async capturePhoto({ personId, photoKey, expectedMissingPhotoKey, actor }) {
      return transaction(async (client) => {
        const current = (await client.query(`SELECT identity.photo_key, p.status, c.form_type, identity.identity_id
          FROM mams.person p
          JOIN mams.person_identity AS identity USING (identity_id)
          JOIN mams.category c USING(category_id)
          WHERE p.person_id = $1 FOR UPDATE OF p, identity`, [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        if (actor.role === 'SECURITY_GUARD' && current.status !== 'ACTIVE') throw new ApiError(409, 'INVALID_STATE', 'A photo can only be captured for an active person');
        if (actor.role === 'SECURITY_GUARD' && current.photo_key && current.photo_key !== expectedMissingPhotoKey) throw new ApiError(409, 'PHOTO_ALREADY_EXISTS', 'This person already has a profile photo');
        if (current.status === 'DRAFT') throw new ApiError(409, 'INVALID_STATE', 'A photo cannot be saved for a draft registration');
        await client.query('UPDATE mams.person_identity SET photo_key = $2 WHERE identity_id = $1', [current.identity_id, photoKey]);
        await client.query('UPDATE mams.person SET updated_by = $2, updated_at = now() WHERE person_id = $1', [personId, actor.userId]);
        await audit(client, actor, current.photo_key ? 'PHOTO_UPDATED' : 'PHOTO_CAPTURED', personId, current.photo_key ? { photo_key: current.photo_key } : null, { photo_key: photoKey });
        return { photo_key: photoKey, previous_photo_key: current.photo_key };
      });
    },
    async create({ input, category, photoKey, documents, passportEncrypted, idProofEncrypted, actor }) {
      return transaction(async (client) => {
        const currentCategory = (await client.query('SELECT * FROM mams.category WHERE category_id = $1 FOR SHARE', [input.categoryId])).rows[0];
        if (!currentCategory || currentCategory.status !== 'ACTIVE' || currentCategory.approval_required === null || currentCategory.approval_required !== category.approval_required) throw new ApiError(409, 'CATEGORY_CHANGED', 'Category configuration changed. Reload and review this registration.');
        validateCategoryDetails(input, currentCategory, actor.role);
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`person-mobile:${input.mobile}`]);
        let identity = (await client.query(
          'SELECT * FROM mams.person_identity WHERE mobile = $1 FOR UPDATE',
          [input.mobile],
        )).rows[0];
        if (!identity) {
          identity = (await client.query(
            `INSERT INTO mams.person_identity
              (mobile, qr_code, first_name, last_name, alternate_mobile, gender, date_of_birth,
               resident_status, passport_number_enc, passport_last4, address, email, photo_key,
               id_proof_type_id, id_proof_number_enc, id_proof_last4, emergency_contact_name,
               emergency_contact_mobile, documents)
             VALUES
              ($1, 'MB-' || lpad(nextval('mams.person_code_seq')::text, 6, '0'), $2, $3, $4, $5,
               $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb)
             RETURNING *`,
            [input.mobile, input.firstName, input.lastName, input.alternateMobile || null, input.gender,
              input.dateOfBirth || null, input.residentStatus, passportEncrypted,
              input.residentStatus === 'NON_RESIDENT' ? input.passportNumber.slice(-4) : null,
              input.address || null, input.email || null, photoKey, input.idProofTypeId ?? null,
              idProofEncrypted ?? null, input.idProofNumber ? input.idProofNumber.slice(-4) : null,
              input.emergencyName || null, input.emergencyMobile || null, JSON.stringify(documents)],
          )).rows[0];
        }
        const existingPerson = (await client.query(
          `SELECT person_id FROM mams.person
            WHERE identity_id = $1
              AND category_id = $2
              AND status IN ('ACTIVE', 'PENDING', 'DEACTIVATED')
            LIMIT 1`,
          [identity.identity_id, input.categoryId],
        )).rows[0];
        if (existingPerson) {
          throw new ApiError(409, 'DUPLICATE_REGISTRATION', 'This mobile number is already registered under this category.');
        }
        if (input.idProofTypeId) {
          const proof = (await client.query("SELECT name FROM mams.lookup_value WHERE lookup_id = $1 AND lookup_type = 'ID_PROOF_TYPE' AND status = 'ACTIVE'", [input.idProofTypeId])).rows[0];
          if (!proof) throw new ApiError(400, 'VALIDATION_ERROR', 'Select an active ID Proof Type');
          if (input.idProofNumber && ID_PROOF_PATTERNS[proof.name] && !ID_PROOF_PATTERNS[proof.name].test(input.idProofNumber)) throw new ApiError(400, 'VALIDATION_ERROR', 'ID Proof Number does not match the selected type.');
        }
        await validateCategoryReferences(client, input, currentCategory);
        const isNonApproval = category.approval_required === false
          || ['VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT'].includes(category.form_type)
          || ['visitor', 'vendor', 'contractor', 'participant'].includes(category.name?.toLowerCase()?.trim());
        const status = !isNonApproval && category.approval_required ? 'PENDING' : 'ACTIVE';
        const result = await client.query(`INSERT INTO mams.person
          (category_id, identity_id, category_details, accompanying_count, remarks, status, source,
           registered_by, consent_at, consent_notice_version, consent_captured_by, expires_on)
          VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, now(), $9, $8, $10)
          RETURNING person_id, category_id, status`,
        [input.categoryId, identity.identity_id, JSON.stringify(input.categoryDetails), input.accompanyingCount,
          input.remarks || null, status, input.source, actor.userId, CONSENT_NOTICE_VERSION,
          input.categoryDetails.end_date || null]);
        const person = {
          ...result.rows[0],
          identity_id: identity.identity_id,
          user_id: identity.identity_id,
          person_code: identity.qr_code,
          qr_version: identity.qr_version,
        };
        for (const locationId of new Set(input.locationIds)) {
          const assigned = await client.query(`INSERT INTO mams.person_location (person_id, location_id, assigned_by)
            SELECT $1, location_id, $3 FROM mams.location WHERE location_id = $2 AND location_type = 'AREA' AND status = 'ACTIVE' RETURNING location_id`, [person.person_id, locationId, actor.userId]);
          if (!assigned.rowCount) throw new ApiError(400, 'VALIDATION_ERROR', 'Select active assigned areas');
        }
        if (status === 'PENDING') await client.query("INSERT INTO mams.approval_history (person_id, action, acted_by) VALUES ($1, 'SUBMITTED', $2)", [person.person_id, actor.userId]);
        await audit(client, actor, 'CREATE', person.person_id, null, { ...person, name: `${input.firstName} ${input.lastName}`, category: category.name });
        await client.query(`INSERT INTO mams.notification (user_id, type, title, body, entity_type, entity_id)
          SELECT user_id, 'REGISTRATION_SUBMITTED', 'Registration Submitted', $1, 'PERSON', $2 FROM mams.app_user
          WHERE status = 'ACTIVE' AND (roles && ARRAY['SUPER_ADMIN','ADMIN','APPROVER']::varchar[] OR user_id = $3)`, [`${input.firstName} ${input.lastName} · ${category.name} · ${status}`, person.person_id, actor.userId]);
        return person;
      });
    },
    async addCategories({ personId, registrations, actor }) {
      return transaction(async (client) => {
        const profile = (await client.query(
          `SELECT p.person_id, p.identity_id, p.status AS profile_status,
                  identity.mobile, identity.first_name, identity.last_name, identity.alternate_mobile,
                  identity.gender, identity.resident_status, identity.date_of_birth, identity.address,
                  identity.email, identity.emergency_contact_name, identity.emergency_contact_mobile,
                  identity.photo_key, identity.id_proof_type_id, identity.id_proof_number_enc,
                  identity.id_proof_last4, identity.passport_number_enc, identity.passport_last4,
                  identity.documents, identity.qr_code AS identity_qr_code,
                  identity.qr_version AS identity_qr_version
             FROM mams.person AS p
             JOIN mams.person_identity AS identity USING (identity_id)
            WHERE p.person_id = $1 AND p.status <> 'DRAFT'
            FOR UPDATE OF p, identity`,
          [personId],
        )).rows[0];
        if (!profile) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');

        const categoryIds = registrations.map(({ categoryId }) => categoryId);
        if (new Set(categoryIds).size !== categoryIds.length) {
          throw new ApiError(400, 'VALIDATION_ERROR', 'Select each category only once.');
        }
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`person-mobile:${profile.mobile}`]);
        const categories = (await client.query(
          'SELECT * FROM mams.category WHERE category_id = ANY($1::smallint[]) FOR SHARE',
          [categoryIds],
        )).rows;
        if (categories.length !== categoryIds.length) throw new ApiError(400, 'VALIDATION_ERROR', 'One or more selected categories are unavailable.');

        const created = [];
        for (const registration of registrations) {
          const category = categories.find((item) => item.category_id === registration.categoryId);
          if (!category || category.status !== 'ACTIVE' || category.approval_required === null) {
            throw new ApiError(409, 'CATEGORY_CHANGED', 'A selected category is no longer available. Reload and review the selection.');
          }
          const input = {
            categoryId: registration.categoryId,
            firstName: profile.first_name,
            lastName: profile.last_name,
            mobile: profile.mobile,
            alternateMobile: profile.alternate_mobile ?? '',
            gender: profile.gender,
            residentStatus: profile.resident_status,
            dateOfBirth: profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : '',
            address: profile.address ?? '',
            email: profile.email ?? '',
            emergencyName: profile.emergency_contact_name ?? '',
            emergencyMobile: profile.emergency_contact_mobile ?? '',
            categoryDetails: registration.categoryDetails,
            locationIds: registration.locationIds,
          };
          validateCategoryDetails(input, category, actor.role);
          await validateCategoryReferences(client, input, category);

          const existing = (await client.query(
            `SELECT person_id FROM mams.person
              WHERE identity_id = $1 AND category_id = $2
                AND status IN ('ACTIVE', 'PENDING', 'DEACTIVATED')
              LIMIT 1`,
            [profile.identity_id, category.category_id],
          )).rows[0];
          if (existing) {
            throw new ApiError(409, 'DUPLICATE_REGISTRATION', `${category.name} is already assigned to this person.`);
          }

          const isNonApproval = category.approval_required === false
            || ['VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT'].includes(category.form_type)
            || ['visitor', 'vendor', 'contractor', 'participant'].includes(category.name?.toLowerCase()?.trim());
          const status = !isNonApproval && category.approval_required ? 'PENDING' : 'ACTIVE';
          const inserted = (await client.query(
            `INSERT INTO mams.person
              (category_id, identity_id, category_details, status, source, registered_by,
               consent_at, consent_notice_version, consent_captured_by, expires_on, accompanying_count)
             VALUES
              ($1,$2,$3::jsonb,$4,'MANUAL',$5,now(),$6,$5,$7,$8)
             RETURNING person_id, category_id, status`,
            [
              category.category_id, profile.identity_id, JSON.stringify(registration.categoryDetails),
              status, actor.userId, CONSENT_NOTICE_VERSION,
              registration.categoryDetails.end_date || null, registration.accompanyingCount,
            ],
          )).rows[0];

          for (const locationId of registration.locationIds) {
            const assigned = await client.query(
              `INSERT INTO mams.person_location (person_id, location_id, assigned_by)
               SELECT $1, location_id, $3 FROM mams.location
                WHERE location_id = $2 AND location_type = 'AREA' AND status = 'ACTIVE'
               RETURNING location_id`,
              [inserted.person_id, locationId, actor.userId],
            );
            if (!assigned.rowCount) throw new ApiError(400, 'VALIDATION_ERROR', 'Select active assigned areas.');
          }
          if (status === 'PENDING') {
            await client.query("INSERT INTO mams.approval_history (person_id, action, acted_by) VALUES ($1, 'SUBMITTED', $2)", [inserted.person_id, actor.userId]);
          }
          await audit(client, actor, 'CATEGORY_ASSIGNED', inserted.person_id, null, {
            identity_id: profile.identity_id, category_id: category.category_id, category: category.name, status,
          });
          await client.query(
            `INSERT INTO mams.notification (user_id, type, title, body, entity_type, entity_id)
             SELECT user_id, 'REGISTRATION_SUBMITTED', 'Registration Submitted', $1, 'PERSON', $2
               FROM mams.app_user
              WHERE status = 'ACTIVE' AND (roles && ARRAY['SUPER_ADMIN','ADMIN','APPROVER']::varchar[] OR user_id = $3)`,
            [`${profile.first_name} ${profile.last_name} · ${category.name} · ${status}`, inserted.person_id, actor.userId],
          );
          created.push(inserted);
        }
        return { items: created, identity_qr_code: profile.identity_qr_code };
      });
    },
    async update({ personId, changes, actor }) {
      return transaction(async (client) => {
        const current = (await client.query(`SELECT p.*, c.form_type, identity.first_name, identity.last_name,
            identity.mobile, identity.alternate_mobile, identity.email, identity.address,
            identity.emergency_contact_name, identity.emergency_contact_mobile,
            identity.qr_code AS person_code, identity.qr_version
          FROM mams.person p
          JOIN mams.person_identity AS identity USING (identity_id)
          JOIN mams.category c USING(category_id)
          WHERE p.person_id = $1
          FOR UPDATE OF p, identity`, [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        if (changes.futureCheckinAccess !== undefined) {
          if (!['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can change future check-in access');
          if (current.form_type !== 'PARTICIPANT' || typeof changes.futureCheckinAccess !== 'boolean') throw new ApiError(400, 'VALIDATION_ERROR', 'Future check-in access is available only for participants and must be Yes or No');
        }
        if (current.form_type !== 'VISITOR' && !changes.mobile.startsWith('+91')) throw new ApiError(400, 'VALIDATION_ERROR', 'Only Visitor profiles can use a non-Indian mobile number');
        if (changes.mobile && changes.mobile !== current.mobile) {
          const duplicate = (await client.query(
            `SELECT person.person_id FROM mams.person AS person
             JOIN mams.person_identity AS identity USING (identity_id)
             WHERE person.category_id = $1
               AND identity.mobile = $2
               AND person.person_id <> $3
               AND person.status IN ('ACTIVE', 'PENDING', 'DEACTIVATED')
             LIMIT 1`,
            [current.category_id, changes.mobile, personId],
          )).rows[0];
          if (duplicate) {
            throw new ApiError(409, 'DUPLICATE_REGISTRATION', 'This mobile number is already registered under this category.');
          }
          const currentIdentity = (await client.query(
            'SELECT identity_id FROM mams.person_identity WHERE identity_id = $1 FOR UPDATE',
            [current.identity_id],
          )).rows[0];
          const conflictingIdentity = (await client.query(
            'SELECT identity_id FROM mams.person_identity WHERE mobile = $1 AND identity_id <> $2',
            [changes.mobile, currentIdentity.identity_id],
          )).rows[0];
          if (conflictingIdentity) {
            throw new ApiError(409, 'DUPLICATE_REGISTRATION', 'This mobile number is already linked to another person.');
          }
          await client.query(
            `UPDATE mams.person_identity
                SET mobile = $2, qr_version = qr_version + 1
              WHERE identity_id = $1`,
            [currentIdentity.identity_id, changes.mobile],
          );
        }
        const profile = (await client.query(`UPDATE mams.person_identity
          SET first_name = $2, last_name = $3, mobile = $4::varchar(16), alternate_mobile = $5,
              email = $6, address = $7, emergency_contact_name = $8, emergency_contact_mobile = $9,
              qr_version = CASE WHEN mobile IS DISTINCT FROM $4::varchar(16) THEN qr_version + 1 ELSE qr_version END
          WHERE identity_id = $1
          RETURNING identity_id, qr_code AS person_code, qr_version, first_name, last_name, mobile,
                    alternate_mobile, email, address, emergency_contact_name, emergency_contact_mobile`,
        [current.identity_id, changes.firstName, changes.lastName, changes.mobile, changes.alternateMobile || null,
          changes.email === undefined ? current.email : changes.email || null, changes.address || null,
          changes.emergencyName || null, changes.emergencyMobile || null])).rows[0];
        const updated = (await client.query(`UPDATE mams.person SET
          category_details = CASE WHEN $2::boolean IS NULL THEN category_details
            ELSE jsonb_set(COALESCE(category_details, '{}'::jsonb), '{future_checkin_access}',
              to_jsonb(CASE WHEN $2::boolean THEN 'YES'::text ELSE 'NO'::text END)) END,
          updated_by = $3, updated_at = now() WHERE person_id = $1 RETURNING person_id, status, category_details`,
        [personId, changes.futureCheckinAccess ?? null, actor.userId])).rows[0];
        const before = { first_name: current.first_name, last_name: current.last_name, mobile: current.mobile, status: current.status, qr_version: current.qr_version };
        const after = { ...profile, status: updated.status };
        if (changes.futureCheckinAccess !== undefined) {
          before.future_checkin_access = current.category_details?.future_checkin_access ?? 'NO';
          after.future_checkin_access = changes.futureCheckinAccess ? 'YES' : 'NO';
        }
        await audit(client, actor, 'UPDATE', personId, before, after);
        if (current.mobile !== changes.mobile) await audit(client, actor, 'QR_REGENERATION', personId, { qr_version: current.qr_version }, { qr_version: profile.qr_version });
        return { ...updated, ...profile };
      });
    },
    async delete({ personId, actor }) {
      return transaction(async (client) => {
        const current = (await client.query(
          `SELECT person.person_id, person.identity_id, person.status, profile.first_name,
                  profile.last_name, profile.photo_key, profile.documents
             FROM mams.person AS person
             JOIN mams.person_identity AS profile USING (identity_id)
            WHERE person.person_id = $1
            FOR UPDATE OF person, profile`,
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
        const remainingRegistrations = current.identity_id
          ? await client.query('SELECT person_id FROM mams.person WHERE identity_id = $1 LIMIT 1', [current.identity_id])
          : { rowCount: 0 };
        if (!remainingRegistrations.rowCount && current.identity_id) {
          await client.query('DELETE FROM mams.person_identity WHERE identity_id = $1', [current.identity_id]);
        }
        return {
          photo_key: remainingRegistrations.rowCount ? null : current.photo_key,
          documents: remainingRegistrations.rowCount ? [] : current.documents ?? [],
        };
      });
    },
    async addDocuments({ personId, documents, actor }) {
      return transaction(async (client) => {
        const current = (await client.query(`SELECT identity.identity_id, identity.documents, c.form_type
          FROM mams.person p
          JOIN mams.person_identity AS identity USING (identity_id)
          JOIN mams.category c USING(category_id)
          WHERE p.person_id = $1
          FOR UPDATE OF p, identity`, [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        const existingDocuments = current.documents ?? [];
        if (existingDocuments.length + documents.length > REGISTRATION_LIMITS.documentCount) throw new ApiError(400, 'VALIDATION_ERROR', `A person can have at most ${REGISTRATION_LIMITS.documentCount} documents.`);
        const combined = [...existingDocuments, ...documents];
        await client.query('UPDATE mams.person_identity SET documents = $2::jsonb WHERE identity_id = $1', [current.identity_id, JSON.stringify(combined)]);
        await client.query('UPDATE mams.person SET updated_by = $2, updated_at = now() WHERE person_id = $1', [personId, actor.userId]);
        await audit(client, actor, 'DOCUMENTS_UPDATED', personId, { documents: existingDocuments }, { documents: combined });
        return { documents: combined };
      });
    },
    async updateAccess({ personId, changes, actor }) {
      return transaction(async (client) => {
        const current = (await client.query('SELECT p.expires_on, c.form_type FROM mams.person p JOIN mams.category c USING(category_id) WHERE p.person_id = $1 FOR UPDATE OF p', [personId])).rows[0];
        if (!current) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        if (current.form_type === 'STAFF' && !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) throw new ApiError(403, 'FORBIDDEN', 'Only an administrator can edit Staff profiles');
        const locationIds = [...new Set(changes.locationIds)];
        if (locationIds.length) {
          const areas = await client.query("SELECT location_id FROM mams.location WHERE location_id = ANY($1::integer[]) AND location_type = 'AREA' AND status = 'ACTIVE'", [locationIds]);
          if (areas.rowCount !== locationIds.length) throw new ApiError(400, 'VALIDATION_ERROR', 'Select active assigned areas');
        }
        await client.query('UPDATE mams.person SET expires_on = $2, updated_by = $3, updated_at = now() WHERE person_id = $1', [personId, changes.expiresOn || null, actor.userId]);
        await client.query('DELETE FROM mams.person_location WHERE person_id = $1', [personId]);
        for (const locationId of locationIds) await client.query('INSERT INTO mams.person_location (person_id, location_id, assigned_by) VALUES ($1, $2, $3)', [personId, locationId, actor.userId]);
        const updated = { location_ids: locationIds, expires_on: changes.expiresOn || null };
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
        delete data.permissionLevelId;
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
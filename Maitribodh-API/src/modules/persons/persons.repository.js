export function createPersonsRepository(pool) {
  return {
    async getActivePersonQr(personId) {
      const result = await pool.query(
        `SELECT identity.qr_code AS person_code, identity.qr_version
           FROM mams.person AS person
           JOIN mams.person_identity AS identity USING (identity_id)
          WHERE person.person_id = $1
            AND person.status = 'ACTIVE'
             AND identity.qr_code IS NOT NULL`,
        [personId],
      );
      return result.rows[0] ?? null;
    },

    async search({ query, categoryId, status, offset, pageSize }) {
      const result = await pool.query(
        `WITH matching AS (
           SELECT p.person_id, p.identity_id, identity.identity_id AS user_id,
                  identity.qr_code AS identity_qr_code, identity.qr_version,
                  identity.first_name || ' ' || identity.last_name AS name,
                  c.name AS registration_category, c.approval_required, identity.mobile,
                  p.status,
                  p.created_at, p.updated_at, p.expires_on
             FROM mams.person AS p
             LEFT JOIN mams.person_identity AS identity USING (identity_id)
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE p.status <> 'DRAFT'
              AND ($1 = '' OR identity.qr_code = upper($1)
                OR identity.mobile = $1
                OR ($1 ~ '^[0-9]{10}$' AND identity.mobile = '+91' || $1)
                OR (regexp_replace($1, '[^0-9]', '', 'g') <> ''
                  AND regexp_replace(identity.mobile, '[^0-9]', '', 'g')
                    LIKE '%' || regexp_replace($1, '[^0-9]', '', 'g') || '%')
                OR lower(identity.first_name || ' ' || identity.last_name) LIKE '%' || lower($1) || '%')
              AND ($2::smallint IS NULL OR p.category_id = $2)
              AND ($3::varchar IS NULL OR p.status = $3)
         ),
         people AS (
           SELECT DISTINCT ON (COALESCE(identity_id, -person_id)) *
             FROM matching
            ORDER BY COALESCE(identity_id, -person_id),
                      updated_at DESC, created_at DESC, person_id DESC
         )
         SELECT people.person_id, people.identity_id, people.user_id,
                people.identity_qr_code AS person_code,
                people.identity_qr_code, people.qr_version, people.name,
                people.registration_category,
                COALESCE(category_summary.categories, ARRAY[]::text[]) AS categories,
                array_to_string(COALESCE(category_summary.categories, ARRAY[]::text[]), ', ') AS category,
                array_to_string(COALESCE(category_summary.categories, ARRAY[]::text[]), ', ') AS active_category,
                people.approval_required, people.mobile, people.status,
                people.created_at, people.expires_on,
                count(*) OVER () AS total
           FROM people
           LEFT JOIN LATERAL (
             SELECT array_agg(DISTINCT c.name ORDER BY c.name) AS categories
               FROM mams.person AS membership
               JOIN mams.category AS c ON c.category_id = membership.category_id
              WHERE membership.status = 'ACTIVE'
                 AND ((people.identity_id IS NOT NULL AND membership.identity_id = people.identity_id)
                  OR (people.identity_id IS NULL AND membership.person_id = people.person_id))
           ) AS category_summary ON true
          ORDER BY people.created_at DESC, people.person_id DESC
          LIMIT $5 OFFSET $4`,
        [query, categoryId ?? null, status ?? null, offset, pageSize],
      );
      return result.rows;
    },
  };
}
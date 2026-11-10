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
        `SELECT p.person_id, p.identity_id, p.person_code,
                identity.qr_code AS identity_qr_code, identity.qr_version,
                p.first_name || ' ' || p.last_name AS name,
          c.name AS category, c.approval_required, p.mobile,
          CASE WHEN c.approval_required = false AND p.status = 'PENDING' THEN 'ACTIVE' ELSE p.status END AS status,
          p.created_at, p.expires_on,
                count(*) OVER () AS total
           FROM mams.person AS p
           LEFT JOIN mams.person_identity AS identity USING (identity_id)
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE p.status <> 'DRAFT'
            AND ($1 = '' OR p.person_code = upper($1)
              OR p.mobile = $1
              OR ($1 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $1)
              OR (regexp_replace($1, '[^0-9]', '', 'g') <> ''
                AND regexp_replace(p.mobile, '[^0-9]', '', 'g')
                  LIKE '%' || regexp_replace($1, '[^0-9]', '', 'g') || '%')
              OR lower(p.first_name || ' ' || p.last_name) LIKE '%' || lower($1) || '%')
            AND ($2::smallint IS NULL OR p.category_id = $2)
            AND ($3::varchar IS NULL OR ($3 = 'PENDING' AND p.status = 'PENDING' AND c.approval_required = true) OR ($3 = 'ACTIVE' AND (p.status = 'ACTIVE' OR (p.status = 'PENDING' AND c.approval_required = false))) OR ($3 NOT IN ('PENDING', 'ACTIVE') AND p.status = $3))
          ORDER BY p.created_at DESC
          LIMIT $5 OFFSET $4`,
        [query, categoryId ?? null, status ?? null, offset, pageSize],
      );
      return result.rows;
    },
  };
}
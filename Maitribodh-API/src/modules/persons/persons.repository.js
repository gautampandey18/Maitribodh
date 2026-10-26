export function createPersonsRepository(pool) {
  return {
    async getActivePersonQr(personId) {
      const result = await pool.query(
        `SELECT person_code, qr_version
           FROM mams.person
          WHERE person_id = $1 AND status = 'ACTIVE' AND qr_version > 0`,
        [personId],
      );
      return result.rows[0] ?? null;
    },

    async search({ query, categoryId, status, offset, pageSize }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code,
                p.first_name || ' ' || p.last_name AS name,
          c.name AS category, p.mobile, p.status, p.created_at, p.expires_on, p.qr_version,
                count(*) OVER () AS total
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE p.status <> 'DRAFT'
            AND ($1 = '' OR p.person_code = upper($1)
              OR p.mobile = $1
              OR ($1 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $1)
              OR lower(p.first_name || ' ' || p.last_name) LIKE '%' || lower($1) || '%')
            AND ($2::smallint IS NULL OR p.category_id = $2)
            AND ($3::varchar IS NULL OR p.status = $3)
          ORDER BY p.created_at DESC
          LIMIT $5 OFFSET $4`,
        [query, categoryId ?? null, status ?? null, offset, pageSize],
      );
      return result.rows;
    },
  };
}
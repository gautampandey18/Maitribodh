export function createPublicQrRepository(pool) {
  return {
    async lookup({ mobile, clientIpKey, maskedMobile }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [clientIpKey]);

        const counts = await client.query(
          `SELECT count(*) FILTER (WHERE occurred_at >= now() - interval '1 minute')::int AS minute_count,
                  count(*) FILTER (WHERE occurred_at >= now() - interval '24 hours')::int AS day_count
             FROM mams.audit_log
            WHERE module = 'QR'
              AND activity IN ('PUBLIC_QR_LOOKUP', 'PUBLIC_QR_RATE_LIMITED')
              AND ip_address = $1`,
          [clientIpKey],
        );
        const minuteCount = counts.rows[0].minute_count;
        const dayCount = counts.rows[0].day_count;
        const limitWindow = minuteCount >= 10 ? 'MINUTE' : dayCount >= 50 ? 'DAY' : null;

        if (limitWindow) {
          await client.query(
            `INSERT INTO mams.audit_log
               (module, activity, entity_type, old_value, ip_address)
             VALUES ('QR', 'PUBLIC_QR_RATE_LIMITED', 'PUBLIC_LOOKUP', $1::jsonb, $2)`,
            [JSON.stringify({ mobile_masked: maskedMobile, limit_window: limitWindow }), clientIpKey],
          );
          await client.query('COMMIT');
          return {
            limited: true,
            window: limitWindow,
            retryAfterSeconds: limitWindow === 'MINUTE' ? 60 : 86400,
          };
        }

        const matches = await client.query(
          `SELECT p.person_code, p.first_name, p.last_name, p.qr_version, c.name AS category
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE p.mobile = $1
              AND p.status = 'ACTIVE'
              AND p.qr_version > 0
              AND NOT EXISTS (
                SELECT 1
                  FROM mams.blacklist AS b
                 WHERE b.person_id = p.person_id
                   AND b.lifted_at IS NULL
                   AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
                   AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
              )
            ORDER BY p.created_at`,
          [mobile],
        );

        await client.query(
          `INSERT INTO mams.audit_log
             (module, activity, entity_type, new_value, ip_address)
           VALUES ('QR', 'PUBLIC_QR_LOOKUP', 'PUBLIC_LOOKUP', $1::jsonb, $2)`,
          [JSON.stringify({ mobile_masked: maskedMobile, matches: matches.rowCount }), clientIpKey],
        );
        await client.query('COMMIT');
        return { limited: false, matches: matches.rows };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
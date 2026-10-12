import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { paginatedResult, parsePagination } from '../../utils/pagination.js';

export function createActivityRouter({ pool, authenticate }) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/notifications', asyncHandler(async (request, response) => {
    const result = await pool.query(`SELECT notification_id, type, title, body, is_read, created_at FROM mams.notification
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [request.auth.userId]);
    const unread = await pool.query('SELECT count(*)::int AS count FROM mams.notification WHERE user_id = $1 AND is_read = false', [request.auth.userId]);
    response.set('Cache-Control', 'private, no-store').json({ items: result.rows, unreadCount: unread.rows[0].count });
  }));
  router.post('/notifications/read', asyncHandler(async (request, response) => {
    await pool.query('UPDATE mams.notification SET is_read = true WHERE user_id = $1 AND is_read = false', [request.auth.userId]);
    response.json({ unreadCount: 0 });
  }));
  router.get('/audit', authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (request, response) => {
    const parsed = z.object({ query: z.string().trim().max(100).default(''), userId: z.coerce.number().int().positive().optional(), action: z.string().max(60).optional(), personId: z.coerce.number().int().positive().optional() }).safeParse(request.query);
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid audit filters');
    const { query, userId, action, personId } = parsed.data;
    const pagination = parsePagination(request.query);
    const result = await pool.query(`SELECT a.*, u.username AS actor, p.mobile AS person_mobile,
      COALESCE(p.first_name || ' ' || p.last_name, a.entity_type || ' ' || a.entity_id::text, a.module) AS entity,
      count(*) OVER()::int AS total FROM mams.audit_log a LEFT JOIN mams.app_user u USING(user_id)
      LEFT JOIN mams.person p ON a.entity_type = 'PERSON' AND p.person_id = a.entity_id
      WHERE ($1 = '' OR a.module ILIKE '%' || $1 || '%'
        OR a.activity ILIKE '%' || $1 || '%'
        OR a.entity_type ILIKE '%' || $1 || '%'
        OR a.entity_id::text ILIKE '%' || $1 || '%'
        OR u.username ILIKE '%' || $1 || '%'
        OR p.mobile ILIKE '%' || $1 || '%'
        OR p.first_name || ' ' || p.last_name ILIKE '%' || $1 || '%')
        AND ($2::bigint IS NULL OR a.user_id = $2) AND ($3::varchar IS NULL OR a.activity = $3)
        AND ($4::bigint IS NULL OR (a.entity_type = 'PERSON' AND a.entity_id = $4))
      ORDER BY a.occurred_at DESC, a.audit_id DESC LIMIT $5 OFFSET $6`, [query, userId ?? null, action ?? null, personId ?? null, pagination.pageSize, pagination.offset]);
    const filters = await pool.query('SELECT DISTINCT activity FROM mams.audit_log ORDER BY activity');
    const users = await pool.query('SELECT user_id, username FROM mams.app_user ORDER BY username');
    response.set('Cache-Control', 'private, no-store').json({ ...paginatedResult(result.rows, pagination), actions: filters.rows.map((item) => item.activity), users: users.rows });
  }));
  return router;
}
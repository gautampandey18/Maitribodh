import { z } from 'zod';
import { ApiError } from '../errors/ApiError.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(5),
});

export function parsePagination(query) {
  const parsed = paginationSchema.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid pagination values');
  }
  const { page, pageSize } = parsed.data;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function paginatedResult(rows, { page, pageSize }) {
  const total = rows.length ? Number(rows[0].total) : 0;
  return {
    items: rows.map(({ total: _total, ...item }) => item),
    total,
    page,
    pageSize,
  };
}

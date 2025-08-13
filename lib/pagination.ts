import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().min(1).optional(),
  categoryId: z.string().optional()
});
export type PaginationParams = z.infer<typeof paginationQuerySchema>;
export function buildPagination(query: URLSearchParams): PaginationParams {
  return paginationQuerySchema.parse({
    page: query.get('page') ?? undefined,
    pageSize: query.get('pageSize') ?? undefined,
    q: query.get('q') ?? undefined,
    categoryId: query.get('categoryId') ?? undefined
  });
}

/**
 * Simple page/limit pagination, per
 * docs/architecture/GDN_API_Architecture.md ("Pagination": "?page=1&
 * limit=20", "Maximum page size must be enforced").
 */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>): Pagination {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limitCandidate =
    Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT;
  const limit = Math.min(limitCandidate, MAX_LIMIT);

  return { page, limit, offset: (page - 1) * limit };
}

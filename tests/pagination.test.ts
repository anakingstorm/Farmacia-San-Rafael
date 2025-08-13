import { describe, it, expect } from 'vitest';
import { buildPagination } from '../lib/pagination';

describe('pagination util', () => {
  it('defaults values', () => {
    const params = buildPagination(new URLSearchParams());
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(20);
  });
  it('parses provided values', () => {
    const params = buildPagination(new URLSearchParams({ page: '2', pageSize: '5', q: 'asp', categoryId: 'abc' }));
    expect(params).toMatchObject({ page: 2, pageSize: 5, q: 'asp', categoryId: 'abc' });
  });
});

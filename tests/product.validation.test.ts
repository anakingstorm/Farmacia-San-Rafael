import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative()
});

describe('product schema', () => {
  it('accepts valid data', () => {
    const data = { name: 'Acetaminofén', slug: 'acetaminofen', priceCents: 1234, stock: 10 };
    expect(() => productSchema.parse(data)).not.toThrow();
  });
  it('rejects invalid price', () => {
    const data = { name: 'A', slug: 'a', priceCents: -5, stock: 1 };
    expect(() => productSchema.parse(data)).toThrow();
  });
});

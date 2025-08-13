import { describe, it, expect, vi } from 'vitest';
import { siicarClient } from '../lib/siicar';

vi.mock('../lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(async () => ({
        id: 'order1',
        totalCents: 1234,
        items: [
          { quantity: 2, unitPriceCents: 400, product: { sku: 'ABC', name: 'Prod A' } },
          { quantity: 1, unitPriceCents: 434, product: { sku: null, name: 'Prod B' } }
        ]
      }))
    }
  }
}));

describe('siicar client stub', () => {
  it('maps order to sale payload', async () => {
    const res = await siicarClient.sendSale('order1');
    expect(res.ok).toBe(true);
    expect(res.integrationRef).toMatch(/SIICAR-order1/);
    expect(res.echo?.items.length).toBe(2);
  });
});

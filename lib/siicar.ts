import { prisma } from './prisma';

export interface SiicarSaleItem { sku: string | null; name: string; unitPriceCents: number; quantity: number; }
export interface SiicarSalePayload { externalOrderId: string; totalCents: number; currency: string; items: SiicarSaleItem[]; }
export interface SiicarSaleResult { ok: boolean; integrationRef: string; echo?: SiicarSalePayload; }

export class SiicarClient {
  private baseUrl: string;
  private apiKey: string;
  constructor() {
    this.baseUrl = process.env.SIICAR_BASE_URL || 'https://stub.siicar.local';
    this.apiKey = process.env.SIICAR_API_KEY || 'stub-key';
  }
  async sendSale(orderId: string): Promise<SiicarSaleResult> {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
    if (!order) throw new Error('Order not found');
    const payload: SiicarSalePayload = {
      externalOrderId: order.id,
      totalCents: order.totalCents,
      currency: 'MXN',
      items: order.items.map(i => ({ sku: i.product.sku, name: i.product.name, unitPriceCents: i.unitPriceCents, quantity: i.quantity }))
    };
    return { ok: true, integrationRef: 'SIICAR-' + order.id.slice(0, 8), echo: payload };
  }
}

export const siicarClient = new SiicarClient();

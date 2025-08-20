import { prisma } from './prisma';

async function wait(ms: number) { return new Promise(res => setTimeout(res, ms)); }

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
    // If envs look like stub, short-circuit
    const isStub = this.baseUrl.includes('stub') || this.apiKey === 'stub-key';
    if (isStub) {
      return { ok: true, integrationRef: 'SIICAR-' + order.id.slice(0, 8), echo: payload };
    }
    // Real HTTP call with basic retries
    const url = this.baseUrl.replace(/\/$/, '') + '/sales';
    const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` };
    let lastErr: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`SIICAR ${res.status}: ${text}`);
        }
        const data = await res.json().catch(() => ({}));
        const ref = data.integrationRef || data.id || `SIICAR-${order.id.slice(0,8)}`;
        return { ok: true, integrationRef: String(ref) };
      } catch (e) {
        lastErr = e;
        if (attempt < 3) await wait(300 * attempt);
      }
    }
    throw new Error(`Fallo integracion SIICAR: ${lastErr?.message || lastErr}`);
  }
}

export const siicarClient = new SiicarClient();

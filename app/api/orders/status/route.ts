import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';

const schema = z.object({ orderId: z.string(), status: z.enum(['PENDING','PAID','CANCELLED','FULFILLED']) });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!((session?.user as any)?.role === 'ADMIN')) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { orderId, status } = parsed.data;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!current) throw new Error('No encontrado');
      // If cancelling, restock
      if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
        for (const it of current.items) {
          await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
        }
      }
      const up = await tx.order.update({ where: { id: orderId }, data: { status } });
      return up;
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e.message === 'No encontrado' ? 'No encontrado' : 'Error al actualizar';
    const code = e.message === 'No encontrado' ? 404 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

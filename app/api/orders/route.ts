import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/config';

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
});

type OrderProduct = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
};

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const json = await req.json();
  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const itemsInput = parsed.data.items;
  const products: OrderProduct[] = await prisma.product.findMany({ where: { id: { in: itemsInput.map(i => i.productId) } } });
  const itemsData = itemsInput.map(i => {
    const p = products.find((pp) => pp.id === i.productId)!;
    if (p.stock < i.quantity) throw new Error(`Stock insuficiente para ${p.name}`);
    return { productId: p.id, quantity: i.quantity, unitPriceCents: p.priceCents };
  });
  const totalCents = itemsData.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const order = await prisma.$transaction(async (tx: TransactionClient) => {
    for (const it of itemsInput) {
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
    }
    return tx.order.create({ data: { userId: user.id, totalCents, items: { create: itemsData } } });
  });
  return NextResponse.json(order, { status: 201 });
}

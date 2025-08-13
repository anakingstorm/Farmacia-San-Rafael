import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { user: { email: session.user.email } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(orders);
}

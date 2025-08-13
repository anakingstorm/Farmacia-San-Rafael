import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: params.id }, include: { products: true } });
  if (!category) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(category);
}

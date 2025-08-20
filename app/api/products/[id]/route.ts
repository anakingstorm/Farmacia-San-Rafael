import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { z } from 'zod';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(product);
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session && (session.user as any)?.role === 'ADMIN')) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session && (session.user as any)?.role === 'ADMIN')) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}

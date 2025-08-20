import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { z } from 'zod';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: params.id }, include: { products: true } });
  if (!category) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(category);
}

const catPatch = z.object({ name: z.string().min(2).optional(), slug: z.string().min(2).optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!((session?.user as any)?.role === 'ADMIN')) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const json = await req.json();
  const parsed = catPatch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const updated = await prisma.category.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!((session?.user as any)?.role === 'ADMIN')) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}

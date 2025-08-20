import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/config';

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

export async function GET() {
  const categories = await prisma.category.findMany();
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session && (session.user as any)?.role === 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const json = await req.json();
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.category.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

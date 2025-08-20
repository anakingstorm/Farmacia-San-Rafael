import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { buildPagination } from '../../../lib/pagination';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/config';

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative().default(0),
  categoryId: z.string(),
  imageUrl: z.string().url().optional()
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = buildPagination(url.searchParams);
  const where: any = {};
  if (params.q) where.name = { contains: params.q, mode: 'insensitive' };
  if (params.categoryId) where.categoryId = params.categoryId;
  const skip = (params.page - 1) * params.pageSize;
  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, skip, take: params.pageSize }),
    prisma.product.count({ where })
  ]);
  return NextResponse.json({ data, total, page: params.page, pageSize: params.pageSize, pages: Math.ceil(total / params.pageSize) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session && (session.user as any)?.role === 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const json = await req.json();
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const created = await prisma.product.create({ data });
  return NextResponse.json(created, { status: 201 });
}

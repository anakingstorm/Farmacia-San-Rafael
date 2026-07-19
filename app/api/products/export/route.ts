import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

type ExportProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  description: string | null;
  category: { name: string; slug: string } | null;
};

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const products: ExportProduct[] = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'id',
    'name',
    'slug',
    'sku',
    'priceCents',
    'stock',
    'category',
    'categorySlug',
    'imageUrl',
    'description',
  ];

  const rows = products.map((product) => [
    product.id,
    product.name,
    product.slug,
    product.sku ?? '',
    product.priceCents,
    product.stock,
    product.category?.name ?? '',
    product.category?.slug ?? '',
    product.imageUrl ?? '',
    product.description ?? '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="productos-exportados.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
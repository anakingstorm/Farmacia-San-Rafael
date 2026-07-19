import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props { params: { id: string } }

type CategoryProduct = {
  id: string;
  name: string;
  priceCents: number;
};

type CategoryWithProducts = {
  name: string;
  products: CategoryProduct[];
};

export const dynamic = 'force-dynamic';

export default async function CategoriaDetalle({ params }: Props) {
  const category: CategoryWithProducts | null = await prisma.category.findUnique({ where: { id: params.id }, include: { products: true } });
  if (!category) return notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {category.products.map((p) => (
          <Link href={`/productos/${p.id}`} key={p.id} className="border rounded p-2 text-sm hover:shadow">
            <div className="font-medium line-clamp-2 mb-2">{p.name}</div>
            <div className="text-brand font-semibold">$ {(p.priceCents/100).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

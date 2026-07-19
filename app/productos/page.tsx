import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ProductListItem = {
  id: string;
  name: string;
  priceCents: number;
};

export default async function ProductosPage() {
  const products: ProductListItem[] = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Productos</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link href={`/productos/${p.id}`} key={p.id} className="border rounded p-2 text-sm hover:shadow">
            <div className="font-medium line-clamp-2 mb-2">{p.name}</div>
            <div className="text-brand font-semibold">$ {(p.priceCents/100).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

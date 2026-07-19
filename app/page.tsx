import { prisma } from '../lib/prisma';
export const dynamic = 'force-dynamic';

type HomeProduct = {
  id: string;
  name: string;
  priceCents: number;
};

type HomeCategory = {
  id: string;
  name: string;
};

export default async function HomePage() {
  const products: HomeProduct[] = await prisma.product.findMany({ take: 6, orderBy: { createdAt: 'desc' } });
  const categories: HomeCategory[] = await prisma.category.findMany({ take: 6 });
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Productos Recientes</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border rounded p-2 text-sm flex flex-col">
              <div className="font-medium line-clamp-2">{p.name}</div>
              <div className="text-brand font-semibold mt-auto">$ {(p.priceCents / 100).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Categorías</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="px-3 py-1 text-xs bg-brand/10 text-brand rounded-full">{c.name}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

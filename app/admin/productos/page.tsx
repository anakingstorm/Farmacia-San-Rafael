import { prisma } from '../../../lib/prisma';
export const dynamic = 'force-dynamic';

type AdminCategory = {
  id: string;
  name: string;
};

type AdminProduct = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  category: { name: string } | null;
};

export default async function AdminProductosPage() {
  const products: AdminProduct[] = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
  const categories: AdminCategory[] = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Productos</h1>
      <form
        className="space-y-2 border p-3 rounded bg-white text-xs"
        method="post"
        action="/api/admin/products"
      >
        <div className="flex gap-2 flex-wrap">
          <input
            name="name"
            placeholder="Nombre"
            required
            className="border p-1 rounded flex-1 min-w-[160px]"
          />
          <select
            name="categoryId"
            required
            className="border p-1 rounded min-w-[160px]"
            defaultValue=""
          >
            <option value="" disabled>
              Categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="priceCents"
            type="number"
            min={0}
            step={1}
            placeholder="Precio (¢)"
            required
            className="border p-1 rounded w-28"
          />
          <input
            name="stock"
            type="number"
            min={0}
            step={1}
            placeholder="Stock"
            required
            className="border p-1 rounded w-24"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </form>
      <table className="w-full text-xs border">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="p-2">Nombre</th>
            <th className="p-2">Categoría</th>
            <th className="p-2">Precio</th>
            <th className="p-2">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.category?.name}</td>
              <td className="p-2">$ {(p.priceCents/100).toFixed(2)}</td>
              <td className="p-2">{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

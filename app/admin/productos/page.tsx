import { prisma } from '../../../lib/prisma';
import NewProductForm from './product-form';

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Productos</h1>
      <NewProductForm categories={categories} />
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

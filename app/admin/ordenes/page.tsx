import { prisma } from '../../../lib/prisma';
export const dynamic = 'force-dynamic';

export default async function AdminOrdenesPage() {
  const orders = await prisma.order.findMany({ include: { user: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Órdenes</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border min-w-[800px]">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Total</th>
              <th className="p-2">Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-2 font-mono truncate max-w-[120px]" title={o.id}>{o.id}</td>
                <td className="p-2">{o.user.email}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2">$ {(o.totalCents/100).toFixed(2)}</td>
                <td className="p-2">{o.items.map(i=> i.product.name + ' x'+i.quantity).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

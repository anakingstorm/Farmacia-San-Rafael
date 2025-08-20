import { prisma } from '../../lib/prisma';
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [products, orders, users] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count()
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Productos</div><div className="text-2xl font-semibold">{products}</div></div>
        <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Órdenes</div><div className="text-2xl font-semibold">{orders}</div></div>
        <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Usuarios</div><div className="text-2xl font-semibold">{users}</div></div>
      </div>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/config';
import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type UserOrder = {
  id: string;
  status: string;
  totalCents: number;
  items: Array<{ quantity: number; product: { name: string } }>;
};

export default async function MisOrdenesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <div className="text-sm">Necesitas iniciar sesión.</div>;
  }
  const orders: UserOrder[] = await prisma.order.findMany({ where: { user: { email: session.user.email } }, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mis Órdenes</h1>
      {orders.length === 0 && <p className="text-sm text-gray-600">Aún no tienes órdenes.</p>}
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="border rounded p-3 text-xs bg-white">
            <div className="flex justify-between">
              <span className="font-mono">{o.id.slice(0,12)}...</span>
              <span className="font-semibold">$ {(o.totalCents/100).toFixed(2)}</span>
            </div>
            <div className="text-gray-500 mb-1">{o.status}</div>
            <div className="line-clamp-2">{o.items.map(i=> i.product.name + ' x'+i.quantity).join(', ')}</div>
            <Link href={`/api/siicar/sale`} className="text-brand underline mt-2 inline-block">Enviar a SIICAR (API)</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

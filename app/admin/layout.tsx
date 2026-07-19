import { getServerSession } from 'next-auth';
import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth/config';
import { isAdminOwnerSession } from '../../lib/auth/permissions';

export const metadata = { title: 'Admin | Farmacia San Rafael' };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    redirect('/cuenta/login');
  }

  const owner = isAdminOwnerSession(session);

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="border rounded p-4 space-y-3 text-sm bg-white h-fit">
        <div className="font-semibold text-brand">Admin</div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin">Dashboard</Link>
          {owner ? <Link href="/admin/datos">Datos</Link> : null}
          <Link href="/admin/productos">Productos</Link>
          <Link href="/admin/ordenes">Órdenes</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = { title: 'Admin | Farmacia San Rafael' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="border rounded p-4 space-y-3 text-sm bg-white h-fit">
        <div className="font-semibold text-brand">Admin</div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/datos">Datos</Link>
          <Link href="/admin/productos">Productos</Link>
          <Link href="/admin/ordenes">Órdenes</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

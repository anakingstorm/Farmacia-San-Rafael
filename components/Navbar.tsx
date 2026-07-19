"use client";
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '../lib/cart-context';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-brand text-white px-4 py-3 flex justify-between items-center">
      <Link href="/" className="font-semibold tracking-wide">Farmacia San Rafael</Link>
      <div className="hidden md:flex gap-4 text-sm items-center">
        <Link href="/productos">Productos</Link>
        <Link href="/carrito" className="relative">Carrito{count>0 && <span className="ml-1 bg-white text-brand rounded-full px-2 text-[10px] font-semibold">{count}</span>}</Link>
        {session?.user ? (
          <div className="flex items-center gap-3">
              {session.user.role === 'ADMIN' ? <Link href="/admin" className="text-xs underline">Admin</Link> : null}
              <Link href="/cuenta/ordenes" className="text-xs underline">Mis Órdenes</Link>
              <span className="text-xs">Hola, {session.user.name || session.user.email}</span>
              <button onClick={()=>signOut()} className="text-xs underline">Salir</button>
          </div>
        ) : (
          <>
            <Link href="/cuenta/login">Ingresar</Link>
            <Link href="/cuenta/registro">Crear Cuenta</Link>
          </>
        )}
      </div>
      <button className="md:hidden text-sm" onClick={()=>setOpen(o=>!o)}>Menú</button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-brand/95 flex flex-col p-4 gap-2 md:hidden text-sm">
          <Link href="/productos" onClick={()=>setOpen(false)}>Productos</Link>
          <Link href="/carrito" onClick={()=>setOpen(false)}>Carrito {count>0 && <span>({count})</span>}</Link>
          {session?.user ? (
            <>
              {session.user.role === 'ADMIN' ? <Link href="/admin" onClick={()=>setOpen(false)}>Admin</Link> : null}
              <Link href="/cuenta/ordenes" onClick={()=>setOpen(false)}>Mis Órdenes</Link>
              <button onClick={()=>{signOut(); setOpen(false);}} className="text-left">Salir</button>
            </>
          ) : (
            <>
              <Link href="/cuenta/login" onClick={()=>setOpen(false)}>Ingresar</Link>
              <Link href="/cuenta/registro" onClick={()=>setOpen(false)}>Crear Cuenta</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

"use client";
import { useCart } from '../../lib/cart-context';

export default function CarritoPage() {
  const { items, totalCents, remove, clear } = useCart();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Carrito</h1>
      {items.length === 0 && <p className="text-sm text-gray-600">Tu carrito está vacío.</p>}
      {items.length > 0 && (
        <>
          <ul className="divide-y border rounded bg-white">
            {items.map(i => (
              <li key={i.productId} className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className="text-xs text-gray-500">{i.quantity} x ${(i.priceCents/100).toFixed(2)}</div>
                </div>
                <button onClick={() => remove(i.productId)} className="text-red-600 text-xs">Quitar</button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center">
            <div className="font-semibold">Total: ${(totalCents/100).toFixed(2)}</div>
            <button onClick={clear} className="text-xs text-gray-500">Vaciar</button>
          </div>
        </>
      )}
    </div>
  );
}

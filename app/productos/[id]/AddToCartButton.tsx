"use client";
import { useCart } from '../../../lib/cart-context';

export default function AddToCartButton({ product }: { product: { id: string; name: string; priceCents: number } }) {
  const { add } = useCart();
  return (
    <button
      onClick={() => add({ productId: product.id, name: product.name, priceCents: product.priceCents })}
      className="bg-brand text-white px-4 py-2 rounded text-sm"
    >
      Agregar al carrito
    </button>
  );
}

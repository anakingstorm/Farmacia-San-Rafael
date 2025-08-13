import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';

interface Props { params: { id: string } }

export default async function ProductoDetalle({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return notFound();
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="aspect-square bg-gray-100 rounded" />
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <div className="text-brand font-semibold text-xl">$ {(product.priceCents/100).toFixed(2)}</div>
        {product.description && <p className="text-sm text-gray-700 whitespace-pre-line">{product.description}</p>}
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}

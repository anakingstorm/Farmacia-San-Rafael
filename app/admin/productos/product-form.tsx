"use client";
import { useState } from 'react';

interface Cat { id: string; name: string }
export default function NewProductForm({ categories }: { categories: Cat[] }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', categoryId: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setOk(false);
    const priceCents = Math.round(parseFloat(form.price) * 100);
    const stock = parseInt(form.stock || '0', 10);
    const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, slug: form.slug, priceCents, stock, categoryId: form.categoryId }) });
    if (!res.ok) {
      setError('Error al crear');
    } else { setOk(true); setForm({ name: '', slug: '', price: '', stock: '', categoryId: '' }); }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="border rounded p-4 space-y-3 bg-white text-xs">
      <div className="font-semibold">Nuevo Producto</div>
      {error && <div className="text-red-600">{error}</div>}
      {ok && <div className="text-green-600">Creado</div>}
      <div className="grid md:grid-cols-5 gap-2">
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nombre" required className="border p-2 rounded" />
        <input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} placeholder="Slug" required className="border p-2 rounded" />
        <input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="Precio" required className="border p-2 rounded" />
        <input value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" required className="border p-2 rounded" />
        <select value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))} required className="border p-2 rounded">
          <option value="">Categoría</option>
          {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <button disabled={loading} className="bg-brand text-white px-4 py-2 rounded disabled:opacity-50">{loading? 'Guardando...' : 'Guardar'}</button>
    </form>
  );
}

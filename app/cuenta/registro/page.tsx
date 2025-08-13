"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    if (!res.ok) {
      const js = await res.json();
      setError(js.error || 'Error');
    } else {
      router.push('/cuenta/login');
    }
  }
  return (
    <form onSubmit={submit} className="max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Crear Cuenta</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" required className="border w-full p-2 rounded text-sm" />
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required className="border w-full p-2 rounded text-sm" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" required className="border w-full p-2 rounded text-sm" />
      <button className="bg-brand text-white px-4 py-2 rounded text-sm w-full">Registrarme</button>
    </form>
  );
}

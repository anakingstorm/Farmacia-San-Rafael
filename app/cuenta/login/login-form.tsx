"use client";
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, callbackUrl, redirect: false });
    if (res?.error) {
      setError('Credenciales inválidas');
      return;
    }

    if (res?.url) {
      router.push(res.url);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Ingresar</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required className="border w-full p-2 rounded text-sm" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" required className="border w-full p-2 rounded text-sm" />
      <button className="bg-brand text-white px-4 py-2 rounded text-sm w-full">Entrar</button>
    </form>
  );
}

import { NextResponse } from 'next/server';

export async function GET() {
  // Stub de integración con SIICAR
  return NextResponse.json({ ok: true, mensaje: 'Stub SIICAR operativo. Implementar llamada real.' });
}

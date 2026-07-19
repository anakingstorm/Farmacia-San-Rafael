"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';

type ImportResult = {
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
};

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setResult({ error: 'Selecciona un archivo antes de importar.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data?.error || 'No se pudo importar el archivo.' });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ error: 'Error de red al importar el archivo.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Importar datos</h3>
        <p className="text-sm text-slate-500">
          Sube un archivo Excel o CSV exportado desde SIICAR para actualizar productos.
        </p>
      </div>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Importando...' : 'Importar archivo'}
        </button>
        <span className="text-xs text-slate-500">
          Campos esperados: SKU, nombre, precio y stock.
        </span>
      </div>

      {result ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {'error' in result && result.error ? (
            <p className="text-red-700">{result.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Importación completada</p>
              <p>Creados: {result.created ?? 0}</p>
              <p>Actualizados: {result.updated ?? 0}</p>
              <p>Omitidos: {result.skipped ?? 0}</p>
              {result.errors && result.errors.length > 0 ? (
                <details className="pt-2">
                  <summary className="cursor-pointer text-slate-600">Ver errores</summary>
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                    {result.errors.map((error, index) => (
                      <li key={`${error}-${index}`}>{error}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
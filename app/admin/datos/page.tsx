import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ImportForm from './import-form';
import { authOptions } from '../../../lib/auth/config';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

async function isAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
}

export default async function AdminDatosPage() {
  const admin = await isAdminSession();

  if (!admin) {
    redirect('/cuenta/login');
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Administrador</p>
        <h1 className="text-2xl font-semibold text-slate-900">Importar y descargar datos</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Esta sección sirve como ventana propia para mover información entre SIICAR y tu base de datos.
          Puedes descargar el catálogo actual, exportar una plantilla y subir archivos para actualizar productos.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <a
          href="/api/products/export"
          className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-semibold text-slate-900">Descargar catálogo</div>
          <p className="mt-2 text-sm text-slate-600">
            Baja un CSV con los productos actuales para respaldo o revisión.
          </p>
        </a>

        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          <div className="text-sm font-semibold text-slate-900">Importar SIICAR</div>
          <p className="mt-2 text-sm text-slate-600">
            Sube el Excel o CSV exportado desde SIICAR usando el formulario de abajo.
          </p>
        </div>

        <a
          href="/api/siicar/sync?check=health"
          className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-semibold text-slate-900">Estado de SIICAR</div>
          <p className="mt-2 text-sm text-slate-600">
            Verifica si el bridge local de SIICAR responde antes de sincronizar.
          </p>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ImportForm />

        <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Flujo recomendado</h3>
            <p className="text-sm text-slate-500">
              Si no recuerdas el formato exacto, empieza por descargar el catálogo actual para comparar columnas.
            </p>
          </div>

          <ol className="space-y-3 text-sm text-slate-700">
            <li className="rounded-lg bg-slate-50 p-3">1. Exporta productos desde SIICAR a Excel o CSV.</li>
            <li className="rounded-lg bg-slate-50 p-3">2. Revisa el archivo descargado desde esta pantalla si necesitas una plantilla.</li>
            <li className="rounded-lg bg-slate-50 p-3">3. Importa el archivo con el formulario y revisa el resumen final.</li>
            <li className="rounded-lg bg-slate-50 p-3">4. Si luego necesitas sincronización automática, usa el bridge de SIICAR.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
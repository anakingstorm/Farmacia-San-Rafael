// Vercel Cron Function: /api/cron/siicar-sync
//
// Sincroniza datos de SIICAR cada 5 minutos
//
// Configuración en vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/siicar-sync",
//     "schedule": "*/5 * * * *"
//   }]
// }
//
// Documentación: https://vercel.com/docs/crons/introduction

import { NextResponse } from 'next/server';
import { siicarSyncService } from '../../../../lib/siicar-sync';

// Este header es requerido por Vercel para validar que es un cron legítimo
const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-this';

export async function GET(req: Request) {
  // Verificar que viene de Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized cron' },
      { status: 401 }
    );
  }

  try {
    const startTime = Date.now();
    console.log('[CRON] Iniciando sincronización de SIICAR...');

    // Ejecutar todas las sincronizaciones
    const results = await siicarSyncService.syncAll();

    const duration = Date.now() - startTime;
    const allSuccess = results.every(r => r.success);

    console.log(`[CRON] Sincronización completada en ${duration}ms`);

    return NextResponse.json({
      success: allSuccess,
      results,
      duration,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[CRON] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error en sincronización cron',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// WebhookType es requerido por Vercel para funciones cron
export const dynamic = 'force-dynamic';

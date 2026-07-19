/**
 * API Endpoint: POST /api/siicar/sync
 * 
 * Sincroniza datos desde SIICAR manualmente
 * Requerimientos:
 * - Debe estar autenticado como ADMIN
 * - SIICAR bridge debe estar corriendo localmente
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { siicarSyncService } from '../../../../lib/siicar-sync';
import type { SyncResult } from '../../../../lib/siicar-sync';

export async function POST(req: Request) {
  try {
    // Verificar autenticación y rol ADMIN
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // TODO: Verificar que sea ADMIN
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 403 }
    //   );
    // }

    const body = await req.json().catch(() => ({}));
    const syncType: string = body.type || 'all';
    const minutosAtras: number = body.minutosAtras || 5;

    let results: SyncResult[] = [];

    if (syncType === 'all') {
      results = await siicarSyncService.syncAll();
    } else if (syncType === 'products') {
      results = [await siicarSyncService.syncProducts()];
    } else if (syncType === 'inventory') {
      results = [await siicarSyncService.syncInventory()];
    } else if (syncType === 'sales') {
      results = [await siicarSyncService.syncRecentSales(minutosAtras)];
    } else if (syncType === 'purchases') {
      results = [await siicarSyncService.syncRecentPurchases(minutosAtras)];
    } else {
      return NextResponse.json(
        { error: 'Tipo de sincronización inválido' },
        { status: 400 }
      );
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[SIICAR API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en sincronización' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Health check simple
  try {
    const { searchParams } = new URL(req.url);
    const checkParam = searchParams.get('check');

    if (checkParam === 'health') {
      // Verify SIICAR connection
      const { siicarBridge } = await import('../../../../lib/siicar-bridge');
      const isHealthy = await siicarBridge.healthCheck();
      
      return NextResponse.json({
        siicar: isHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Use POST to trigger sync or ?check=health for status' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

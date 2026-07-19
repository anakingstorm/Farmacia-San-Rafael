/**
 * SIICAR Synchronization Service
 * Sincroniza datos desde SIICAR con la BD local
 */

import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { siicarBridge } from './siicar-bridge';
import type { SiicarProduct, SiicarInventory, SiicarSale, SiicarPurchase } from './siicar-bridge';

export interface SyncResult {
  tipo: string;
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
  duration: number;
}

export class SiicarSyncService {
  /**
   * Sincroniza TODOS los productos y categorías de SIICAR
   */
  async syncProducts(): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    let error: string | undefined;

    try {
      const siicarProducts = await siicarBridge.fetchProducts();
      console.log(`[SIICAR SYNC] Sincronizando ${siicarProducts.length} productos...`);

      for (const siicarProduct of siicarProducts) {
        try {
          await this.syncProduct(siicarProduct);
          itemsProcessed++;
        } catch (e) {
          console.error(`[SIICAR SYNC] Error sincronizando producto ${siicarProduct.sku}:`, e);
          itemsFailed++;
        }
      }

      // Log sincronización
      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'PRODUCTS',
          status: itemsFailed === 0 ? 'SUCCESS' : itemsFailed < itemsProcessed ? 'PARTIAL' : 'FAILED',
          itemsProcessed,
          itemsFailed,
          duration: Date.now() - startTime,
          metadata: { totalProductos: siicarProducts.length }
        }
      });

      console.log(`[SIICAR SYNC] ✓ Productos sincronizados: ${itemsProcessed}/${siicarProducts.length}`);
    } catch (e: any) {
      error = e.message;
      console.error('[SIICAR SYNC] Fatal error syncing products:', e);
      
      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'PRODUCTS',
          status: 'FAILED',
          itemsProcessed,
          itemsFailed,
          error: error,
          duration: Date.now() - startTime
        }
      });
    }

    return {
      tipo: 'PRODUCTS',
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      error,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sincroniza inventario de SIICAR
   */
  async syncInventory(): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    let error: string | undefined;

    try {
      const siicarInventory = await siicarBridge.fetchInventory();
      console.log(`[SIICAR SYNC] Actualizando inventario: ${siicarInventory.length} items...`);

      for (const item of siicarInventory) {
        try {
          // Buscar producto por SKU
          const product = await prisma.product.findUnique({
            where: { sku: item.sku }
          });

          if (product) {
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: item.cantidad }
            });
            itemsProcessed++;
          } else {
            console.warn(`[SIICAR SYNC] Producto con SKU ${item.sku} no encontrado`);
            itemsFailed++;
          }
        } catch (e) {
          console.error(`[SIICAR SYNC] Error actualizando inventario para ${item.sku}:`, e);
          itemsFailed++;
        }
      }

      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'INVENTORY',
          status: itemsFailed === 0 ? 'SUCCESS' : itemsFailed < itemsProcessed ? 'PARTIAL' : 'FAILED',
          itemsProcessed,
          itemsFailed,
          duration: Date.now() - startTime
        }
      });

      console.log(`[SIICAR SYNC] ✓ Inventario actualizado: ${itemsProcessed}/${siicarInventory.length}`);
    } catch (e: any) {
      error = e.message;
      console.error('[SIICAR SYNC] Fatal error syncing inventory:', e);
      
      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'INVENTORY',
          status: 'FAILED',
          itemsProcessed,
          itemsFailed,
          error,
          duration: Date.now() - startTime
        }
      });
    }

    return {
      tipo: 'INVENTORY',
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      error,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sincroniza ventas recientes de SIICAR
   */
  async syncRecentSales(minutosAtras: number = 5): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    let error: string | undefined;

    try {
      const siicarSales = await siicarBridge.fetchRecentSales(minutosAtras);
      console.log(`[SIICAR SYNC] Sincronizando ${siicarSales.length} ventas...`);

      for (const sale of siicarSales) {
        try {
          await this.syncSale(sale);
          itemsProcessed++;
        } catch (e) {
          console.error(`[SIICAR SYNC] Error sincronizando venta ${sale.id}:`, e);
          itemsFailed++;
        }
      }

      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'SALES',
          status: itemsFailed === 0 ? 'SUCCESS' : itemsFailed < itemsProcessed ? 'PARTIAL' : 'FAILED',
          itemsProcessed,
          itemsFailed,
          duration: Date.now() - startTime
        }
      });

      console.log(`[SIICAR SYNC] ✓ Ventas sincronizadas: ${itemsProcessed}/${siicarSales.length}`);
    } catch (e: any) {
      error = e.message;
      console.error('[SIICAR SYNC] Fatal error syncing sales:', e);
      
      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'SALES',
          status: 'FAILED',
          itemsProcessed,
          itemsFailed,
          error,
          duration: Date.now() - startTime
        }
      });
    }

    return {
      tipo: 'SALES',
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      error,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sincroniza compras recientes de SIICAR
   */
  async syncRecentPurchases(minutosAtras: number = 5): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsFailed = 0;
    let error: string | undefined;

    try {
      const siicarPurchases = await siicarBridge.fetchRecentPurchases(minutosAtras);
      console.log(`[SIICAR SYNC] Sincronizando ${siicarPurchases.length} compras...`);

      for (const purchase of siicarPurchases) {
        try {
          await this.syncPurchase(purchase);
          itemsProcessed++;
        } catch (e) {
          console.error(`[SIICAR SYNC] Error sincronizando compra ${purchase.id}:`, e);
          itemsFailed++;
        }
      }

      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'PURCHASES',
          status: itemsFailed === 0 ? 'SUCCESS' : itemsFailed < itemsProcessed ? 'PARTIAL' : 'FAILED',
          itemsProcessed,
          itemsFailed,
          duration: Date.now() - startTime
        }
      });

      console.log(`[SIICAR SYNC] ✓ Compras sincronizadas: ${itemsProcessed}/${siicarPurchases.length}`);
    } catch (e: any) {
      error = e.message;
      console.error('[SIICAR SYNC] Fatal error syncing purchases:', e);
      
      await prisma.siicarSyncLog.create({
        data: {
          tipo: 'PURCHASES',
          status: 'FAILED',
          itemsProcessed,
          itemsFailed,
          error,
          duration: Date.now() - startTime
        }
      });
    }

    return {
      tipo: 'PURCHASES',
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      error,
      duration: Date.now() - startTime
    };
  }

  /**
   * Sincroniza un producto individual de SIICAR
   */
  private async syncProduct(siicarProduct: SiicarProduct): Promise<void> {
    const slug = this.slugify(siicarProduct.nombre);

    // Obtener o crear categoría
    let categoryId: string;
    if (siicarProduct.categoria) {
      const categorySlug = this.slugify(siicarProduct.categoria);
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug }
      });

      if (category) {
        categoryId = category.id;
      } else {
        const newCategory = await prisma.category.create({
          data: {
            name: siicarProduct.categoria,
            slug: categorySlug
          }
        });
        categoryId = newCategory.id;
      }
    } else {
      // Categoría por defecto
      const defaultCategory = await prisma.category.findUnique({
        where: { slug: 'otros' }
      });
      categoryId = defaultCategory?.id || (await prisma.category.create({
        data: { name: 'Otros', slug: 'otros' }
      })).id;
    }

    // Sincronizar producto
    const existingProduct = await prisma.product.findUnique({
      where: { sku: siicarProduct.sku }
    });

    if (existingProduct) {
      // Actualizar
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: siicarProduct.nombre,
          priceCents: siicarProduct.precio,
          stock: siicarProduct.stock,
          categoryId,
          siicarSku: siicarProduct.sku,
          updatedAt: new Date()
        }
      });
    } else {
      // Crear
      await prisma.product.create({
        data: {
          name: siicarProduct.nombre,
          slug,
          description: siicarProduct.detalles?.presentacion,
          sku: siicarProduct.sku,
          siicarSku: siicarProduct.sku,
          priceCents: siicarProduct.precio,
          stock: siicarProduct.stock,
          categoryId
        }
      });
    }
  }

  /**
   * Sincroniza una venta de SIICAR
   */
  private async syncSale(siicarSale: SiicarSale): Promise<void> {
    // Verificar si ya existe
    const existing = await prisma.siicarSale.findUnique({
      where: { externalId: siicarSale.id }
    });

    if (existing) {
      return; // Ya sincronizada
    }

    // Crear venta
    await prisma.siicarSale.create({
      data: {
        externalId: siicarSale.id,
        fecha: new Date(siicarSale.fecha),
        totalCents: siicarSale.total,
        synced: true,
        syncedAt: new Date(),
        metadata: siicarSale as unknown as Prisma.InputJsonValue,
        items: {
          create: siicarSale.items.map(item => ({
            siicarSku: item.sku,
            cantidad: item.cantidad,
            precioCents: item.precio
          }))
        }
      }
    });
  }

  /**
   * Sincroniza una compra de SIICAR
   */
  private async syncPurchase(siicarPurchase: SiicarPurchase): Promise<void> {
    // Verificar si ya existe
    const existing = await prisma.siicarPurchase.findUnique({
      where: { externalId: siicarPurchase.id }
    });

    if (existing) {
      return; // Ya sincronizada
    }

    // Crear compra
    await prisma.siicarPurchase.create({
      data: {
        externalId: siicarPurchase.id,
        fecha: new Date(siicarPurchase.fecha),
        proveedor: siicarPurchase.proveedor,
        totalCents: siicarPurchase.total,
        synced: true,
        syncedAt: new Date(),
        metadata: siicarPurchase as unknown as Prisma.InputJsonValue,
        items: {
          create: siicarPurchase.items.map(item => ({
            siicarSku: item.sku,
            cantidad: item.cantidad,
            costoCents: item.costo
          }))
        }
      }
    });
  }

  /**
   * Utilidad: convertir texto a slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Ejecuta todas las sincronizaciones
   */
  async syncAll(): Promise<SyncResult[]> {
    console.log('[SIICAR SYNC] Iniciando sincronización completa...');
    const results: SyncResult[] = [];

    // Verificar conexión con SIICAR
    const isHealthy = await siicarBridge.healthCheck();
    if (!isHealthy) {
      console.error('[SIICAR SYNC] SIICAR no está disponible');
      return [{
        tipo: 'ALL',
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        error: 'SIICAR no disponible',
        duration: 0
      }];
    }

    results.push(await this.syncProducts());
    results.push(await this.syncInventory());
    results.push(await this.syncRecentSales());
    results.push(await this.syncRecentPurchases());

    const allSuccess = results.every(r => r.success);
    console.log(`[SIICAR SYNC] Sincronización completada. Estado: ${allSuccess ? '✓ OK' : '⚠ PARCIAL'}`);

    return results;
  }
}

export const siicarSyncService = new SiicarSyncService();

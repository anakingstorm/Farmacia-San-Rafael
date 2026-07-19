/**
 * SIICAR Bridge Client
 * Conecta con el software SIICAR local para sincronizar:
 * - Productos y categorías
 * - Inventario (stock)
 * - Ventas
 * - Compras
 */

export interface SiicarProduct {
  sku: string;
  nombre: string;
  precio: number; // en centavos
  stock: number;
  categoria?: string;
  detalles?: Record<string, any>;
}

export interface SiicarInventory {
  sku: string;
  cantidad: number;
  ultimaActualizacion: string;
}

export interface SiicarSale {
  id: string;
  fecha: string;
  items: Array<{
    sku: string;
    cantidad: number;
    precio: number;
  }>;
  total: number;
}

export interface SiicarPurchase {
  id: string;
  fecha: string;
  proveedor: string;
  items: Array<{
    sku: string;
    cantidad: number;
    costo: number;
  }>;
  total: number;
}

export class SiicarBridge {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(
    baseUrl: string = process.env.SIICAR_LOCAL_URL || 'http://localhost:9500',
    apiKey: string = process.env.SIICAR_LOCAL_KEY || ''
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.timeout = 10000; // 10s timeout
  }

  /**
   * Obtiene todos los productos de SIICAR
   */
  async fetchProducts(): Promise<SiicarProduct[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/productos`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SIICAR] Error fetching products:', error);
      return [];
    }
  }

  /**
   * Obtiene el inventario actual de SIICAR
   */
  async fetchInventory(): Promise<SiicarInventory[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/inventario`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SIICAR] Error fetching inventory:', error);
      return [];
    }
  }

  /**
   * Obtiene ventas de los últimos N minutos
   */
  async fetchRecentSales(minutosAtras: number = 5): Promise<SiicarSale[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/ventas?minutosAtras=${minutosAtras}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SIICAR] Error fetching sales:', error);
      return [];
    }
  }

  /**
   * Obtiene compras de los últimos N minutos
   */
  async fetchRecentPurchases(minutosAtras: number = 5): Promise<SiicarPurchase[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/compras?minutosAtras=${minutosAtras}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SIICAR] Error fetching purchases:', error);
      return [];
    }
  }

  /**
   * Verifica conexión con SIICAR
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/health`,
        { method: 'GET' }
      );
      return response?.status === 'ok';
    } catch (error) {
      console.error('[SIICAR] Health check failed:', error);
      return false;
    }
  }

  /**
   * Fetch con timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SIICAR API returned ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const siicarBridge = new SiicarBridge();

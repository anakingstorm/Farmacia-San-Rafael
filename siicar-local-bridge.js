/**
 * SIICAR Local Bridge Server
 * 
 * Este servidor DEBE ejecutarse en la máquina donde está instalado SIICAR
 * para exponer sus datos a través de HTTP/REST API
 * 
 * Uso:
 *   node siicar-local-bridge.js
 * 
 * Variables de entorno:
 *   - SIICAR_PORT: Puerto donde escuchar (default: 9500)
 *   - SIICAR_API_KEY: Clave para proteger el endpoint (default: vacío)
 *   - SIICAR_DB_PATH: Ruta a la base de datos SIICAR (si aplica)
 * 
 * Endpoints:
 *   GET  /api/health          - Health check
 *   GET  /api/productos       - Obtener todos los productos
 *   GET  /api/inventario      - Obtener estado de inventario
 *   GET  /api/ventas          - Obtener ventas recientes
 *   GET  /api/compras         - Obtener compras recientes
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.SIICAR_PORT || 9500;
const API_KEY = process.env.SIICAR_API_KEY || '';

/**
 * AQUÍ: Conectar con la librería/API de SIICAR
 * 
 * Opciones comunes:
 * 1. Si SIICAR usa una base de datos SQL (MSSQL, MySQL, PostgreSQL)
 *    - Instala el driver: npm install mssql mysql2 pg
 *    - Crea conexión y queries
 * 
 * 2. Si SIICAR tiene una API propia
 *    - Usa fetch/axios para conectar
 * 
 * 3. Si SIICAR usa archivos (JSON, CSV)
 *    - Lee los archivos del filesystem
 * 
 * Ejemplo con SQL Server (MSSQL):
 */

// Aquí va la configuración específica de SIICAR
// ============================================

/**
 * Funciones stub (reemplazar con lógica real de SIICAR)
 */
async function getSiicarProducts() {
  // TODO: Conectar con SIICAR real
  return [
    {
      sku: 'MED-001',
      nombre: 'Paracetamol 500mg',
      precio: 5000, // centavos = $50
      stock: 150,
      categoria: 'Analgésicos',
      detalles: { presentacion: 'Caja x 30', lote: 'LT2024001' }
    },
    {
      sku: 'MED-002',
      nombre: 'Amoxicilina 500mg',
      precio: 8000,
      stock: 80,
      categoria: 'Antibióticos',
      detalles: { presentacion: 'Caja x 21', lote: 'LT2024002' }
    }
  ];
}

async function getSiicarInventory() {
  // TODO: Conectar con SIICAR real
  return [
    { sku: 'MED-001', cantidad: 150, ultimaActualizacion: new Date().toISOString() },
    { sku: 'MED-002', cantidad: 80, ultimaActualizacion: new Date().toISOString() }
  ];
}

async function getSiicarSales(minutosAtras = 5) {
  // TODO: Conectar con SIICAR real
  return [
    {
      id: 'VENTA-2024-001',
      fecha: new Date().toISOString(),
      items: [
        { sku: 'MED-001', cantidad: 2, precio: 5000 }
      ],
      total: 10000
    }
  ];
}

async function getSiicarPurchases(minutosAtras = 5) {
  // TODO: Conectar con SIICAR real
  return [];
}

/**
 * Middleware de autenticación
 */
function checkAuth(req) {
  if (!API_KEY) return true; // Sin autenticación si no se configura
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  return token === API_KEY;
}

/**
 * Manejador de solicitudes HTTP
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health Check
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // Verificar autenticación para otros endpoints
    if (!checkAuth(req)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // Productos
    if (pathname === '/api/productos' && req.method === 'GET') {
      const productos = await getSiicarProducts();
      res.writeHead(200);
      res.end(JSON.stringify(productos));
      return;
    }

    // Inventario
    if (pathname === '/api/inventario' && req.method === 'GET') {
      const inventario = await getSiicarInventory();
      res.writeHead(200);
      res.end(JSON.stringify(inventario));
      return;
    }

    // Ventas
    if (pathname === '/api/ventas' && req.method === 'GET') {
      const minutos = parseInt(query.minutosAtras || '5');
      const ventas = await getSiicarSales(minutos);
      res.writeHead(200);
      res.end(JSON.stringify(ventas));
      return;
    }

    // Compras
    if (pathname === '/api/compras' && req.method === 'GET') {
      const minutos = parseInt(query.minutosAtras || '5');
      const compras = await getSiicarPurchases(minutos);
      res.writeHead(200);
      res.end(JSON.stringify(compras));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  SIICAR Bridge Server Running              ║
║  URL: http://localhost:${PORT}              ║
║  API Key: ${API_KEY ? '✓ Configured' : '✗ Not set (insecure)'}  ║
╚════════════════════════════════════════════╝
  `);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} ya está en uso`);
  } else {
    console.error('Server error:', e);
  }
  process.exit(1);
});

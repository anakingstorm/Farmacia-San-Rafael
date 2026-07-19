# 🚀 SIICAR Sync CHECKLIST DE IMPLEMENTACIÓN

Hemos creado una **solución completa** para sincronizar SIICAR cada 5 minutos. Aquí está todo listo.

---

## 📦 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `lib/siicar-bridge.ts` | Cliente para conectar el bridge local |
| `lib/siicar-sync.ts` | Lógica core de sincronización |
| `siicar-local-bridge.js` | Servidor HTTP que expone SIICAR (corre localmente) |
| `siicar-utils.js` | Utilidades para setup y testing |
| `app/api/siicar/sync/route.ts` | API endpoint manual de sincronización |
| `app/api/cron/siicar-sync/route.ts` | Función cron que corre cada 5 min en Vercel |
| `vercel.json` | Configuración de cron para Vercel |
| `.env.example` | Variables de entorno actualizadas |
| `SIICAR-INTEGRATION.md` | Guía completa de instalación |
| `prisma/schema.prisma` | Schema extendido con tablas SIICAR |

---

## ⚡ PRÓXIMOS PASOS (Orden Recomendado)

### 1️⃣ Configurar Variables de Entorno

```bash
cd c:\Users\anaki\Farmacia-San-Rafael

# Crear .env.local desde template
Copy-Item .env.example .env.local

# Editar .env.local y completar:
# - SIICAR_LOCAL_URL = http://localhost:9500
# - SIICAR_LOCAL_KEY = (generar con siicar-utils.js)
# - CRON_SECRET = (generar con siicar-utils.js)
```

**Generar claves secretas:**
```bash
# Si Node.js está instalado en tu proyecto (nvm-windows):
node siicar-utils.js secrets
```

---

### 2️⃣ Editar SIICAR Bridge para tu Caso

Abre `siicar-local-bridge.js` y reemplaza las funciones stub:

- `getSiicarProducts()` 
- `getSiicarInventory()`
- `getSiicarSales()`
- `getSiicarPurchases()`

**Opciones según cómo accedas a SIICAR:**

**A) Si SIICAR usa SQL Server (MSSQL):**
```bash
npm install mssql
```

```javascript
const sql = require('mssql');
const config = {
  server: process.env.SIICAR_DB_SERVER || 'localhost',
  database: process.env.SIICAR_DB_NAME || 'SIICAR',
  authentication: {
    type: 'windows'
  },
  options: { encrypt: true }
};

async function getSiicarProducts() {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  const result = await pool.request()
    .query('SELECT * FROM Productos');
  await pool.close();
  return result.recordset;
}
```

**B) Si SIICAR usa MySQL:**
```bash
npm install mysql2
```

```javascript
const mysql = require('mysql2/promise');

async function getSiicarProducts() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'siicar',
    password: 'password',
    database: 'siicar_db'
  });
  const [rows] = await conn.execute('SELECT * FROM productos');
  conn.end();
  return rows;
}
```

**C) Si SIICAR tiene API HTTP:**
```javascript
async function getSiicarProducts() {
  const response = await fetch('http://siicar-api.local/productos', {
    headers: { 'Authorization': `Bearer ${process.env.SIICAR_AUTH_TOKEN}` }
  });
  return await response.json();
}
```

**D) Si SIICAR usa archivos JSON:**
```javascript
const fs = require('fs');

async function getSiicarProducts() {
  const data = fs.readFileSync('C:\\SIICAR\\productos.json', 'utf-8');
  return JSON.parse(data);
}
```

---

### 3️⃣ Crear Migración de Prisma

```bash
# Desde la carpeta del proyecto
npx prisma migrate dev --name add_siicar_sync_tables

# Responde "Yes" cuando pregunte si crear la migración
```

Esto crea las tablas:
- `SiicarProductSync`
- `SiicarSale` & `SiicarSaleItem`
- `SiicarPurchase` & `SiicarPurchaseItem`
- `SiicarSyncLog`

---

### 4️⃣ Probar en Local

```bash
# Terminal 1: Corre el bridge SIICAR
node siicar-local-bridge.js

# Deberías ver:
# ╔════════════════════════════════════════════╗
# ║  SIICAR Bridge Server Running              ║
# ║  URL: http://localhost:9500                ║
# ╚════════════════════════════════════════════╝

# Terminal 2: Test rápido
node siicar-utils.js test-siicar

# Terminal 3: Corre el dev server
npm run dev

# Test manual en el navegador:
# GET http://localhost:3000/api/siicar/sync?check=health
```

---

### 5️⃣ Configurar Vercel

#### En el Dashboard de Vercel:

1. **Settings > Environment Variables:**
   ```
   SIICAR_LOCAL_URL = https://abc123.ngrok.io  (con ngrok)
   SIICAR_LOCAL_KEY = tu-clave-secreta
   CRON_SECRET = tu-clave-cron
   ```

2. **Settings > Crons:**
   - Verifica que `/api/cron/siicar-sync` esté listado con `*/5 * * * *`

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Add SIICAR synchronization"
   git push
   ```

---

### 6️⃣ Exponer SIICAR a Internet (para Vercel)

Como SIICAR corre localmente y Vercel necesita conectar, tienes opciones:

#### Opción A: ngrok (Recomendado para desarrollo)
```bash
# Download: https://ngrok.com/download
ngrok http 9500

# Te dará algo como: https://abc123.ngrok.io
# Usa esto en SIICAR_LOCAL_URL en Vercel
```

#### Opción B: Port Forwarding en Router
En tu router (192.168.1.1), redirige:
- Puerto externo: 9500 → IP interna:9500
- Usa el IP público de tu router en Vercel

#### Opción C: VPN/Bastion Host
Implementa tu propio túnel seguro (Cloudflare Tunnel, WireGuard, etc.)

---

## 🔍 ESQUEMA DE DATOS

### Tabla `Product` (actualizada)
```sql
- id (uuid)
- name (string)
- sku (unique) 
- priceCents (int)
- stock (int) ← ¡Se actualiza cada 5 min! 
- siicarSku (string) ← Mapeo a SIICAR
- siicarSync (rel) ← Estado de sync
```

### Tabla `SiicarProductSync` (nueva)
```sql
- id (uuid)
- productId (fk)
- siicarSku (unique)
- lastSyncAt (datetime)
- syncStatus (SYNCED | PENDING | FAILED)
```

### Tabla `SiicarSale` (nueva)
```sql
- id (uuid) 
- externalId (unique) ← ID original de SIICAR
- fecha (datetime)
- totalCents (int)
- items (rel) ← Detalles de la venta
- synced (bool)
```

Similar para `SiicarPurchase`, `SiicarSyncLog`

---

## 📊 FLUJO DE SINCRONIZACIÓN 

```
VERCEL CRON (cada 5 minutos)
   ↓
GET /api/cron/siicar-sync?Bearer=CRON_SECRET
   ↓ (autenticación verificada)
siicarSyncService.syncAll()
   ↓
┌─────────────────────────────────────┐
├─ syncProducts()                     ├─→ Crea/actualiza Products
├─ syncInventory()                    ├─→ Actualiza stock
├─ syncRecentSales(5)                 ├─→ Importa ventas últimos 5 min
└─ syncRecentPurchases(5)             └─→ Importa compras últimos 5 min
   ↓
Cada operación log en SiicarSyncLog
   ↓
BD PostgreSQL
   ↓
¡Datos disponibles en tu sitio web!
```

---

## 🧪 TESTING

### Test SIICAR Bridge
```bash
node siicar-utils.js test-siicar
# ✅ SIICAR está conectado
# o
# ❌ No se pudo conectar a SIICAR
```

### Test ngrok
```bash
node siicar-utils.js test-ngrok
# ✅ ngrok está activo
```

### Test API Manual
```bash
# Sincronizar productos
curl -X POST http://localhost:3000/api/siicar/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "products"}'

# Sincronizar ventas últimas 10 min
curl -X POST http://localhost:3000/api/siicar/sync \
  -d '{"type": "sales", "minutosAtras": 10}'

# Health check
curl http://localhost:3000/api/siicar/sync?check=health
```

### Consultar Logs
En tu BD PostgreSQL:
```sql
SELECT * FROM "SiicarSyncLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver último status
SELECT 
  tipo, 
  status, 
  "itemsProcessed", 
  "itemsFailed", 
  duration,
  "createdAt"
FROM "SiicarSyncLog"
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 🆘 TROUBLESHOOTING

| Problema | Causa | Solución |
|----------|-------|----------|
| `Cannot connect to SIICAR` | Bridge no corre | `node siicar-local-bridge.js` |
| `EADDRINUSE :::9500` | Puerto en uso | Cambiar `SIICAR_PORT=9501` |
| `ngrok not responding` | ngrok no activo | `ngrok http 9500` |
| `Cron no se ejecuta` | CRON_SECRET incorrecto | Verificar en `vercel.json` + env vars |
| Datos old en web | BD no actualiza | Verificar conexión DB desde Vercel |
| HTTP 401 en cron | `CRON_SECRET` no coincide | Debe figurar en Vercel env vars |

---

## 📋 CHECKLIST FINAL

- [ ] Archivos creados (/lib, /app/api, vercel.json)
- [ ] .env.local configurado con:
  - [ ] SIICAR_LOCAL_URL
  - [ ] SIICAR_LOCAL_KEY
  - [ ] CRON_SECRET
- [ ] siicar-local-bridge.js editado con lógica real
- [ ] Migración Prisma ejecutada (`npx prisma migrate dev`)
- [ ] Bridge local testeado (`node siicar-utils.js test-siicar`)
- [ ] Dev server funciona (`npm run dev`)
- [ ] API manual de sync testeado
- [ ] Vercel vars de env configuradas
- [ ] ngrok activo (si usas esa opción)
- [ ] Cron activo en Vercel dashboard
- [ ] Logs de sincronización en BD

---

## 📞 DOCUMENTACIÓN

📄 Ver: `SIICAR-INTEGRATION.md` (guía completa)

Para dudas específicas sobre SIICAR:
- Pide la documentación técnica a la persona que lo instaló
- Verifica formato de datos (JSON, XML, CSV)
- Confirma direcciones/puertos de acceso

---

**¡Listo! Tu sincronización SIICAR está lista para usar.** 🎉

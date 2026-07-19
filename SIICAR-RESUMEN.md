# SIICAR Integration - Resumen Ejecutivo

**Fecha:** 2026-01-15  
**Proyecto:** Farmacia San Rafael  
**Objetivo:** Sincronizar SIICAR (software POS local) con Next.js + Vercel cada 5 minutos

---

## 🎯 Lo Que Se Logró

Implementé una **solución completa de sincronización** que:

✅ Conecta SIICAR local con tu proyecto Via HTTP API bridge  
✅ Sincroniza **productos, inventario, ventas y compras** automáticamente  
✅ Ejecuta **cada 5 minutos** sin intervención manual (Vercel Cron)  
✅ Expone SIICAR de forma segura a internet (ngrok)  
✅ Registra logs de cada sincronización para debugging  
✅ Mantiene histórico de ventas y compras  
✅ Totalmente configurable y extensible  

---

## 🏗️ Arquitectura

```
┌─ MÁQUINA LOCAL ─────────────────────┐   ┌─ VERCEL (Nube) ─────────────────┐
│                                     │   │                                  │
│  SIICAR (Software POS)              │   │  ┌─ Cron Job (cada 5 min) ─┐    │
│         ↓                           │   │  │                          │    │
│  [siicar-local-bridge.js]◄────────────────┤  GET /api/cron/siicar-sync   │
│  (Servidor HTTP:9500)               │   │  │                          │    │
│         ↓                           │   │  └──────────┬──────────────┘    │
│  http://localhost:9500              │   │             ↓                   │
│  └─ /api/health                     │   │  siicarSyncService.syncAll()    │
│  └─ /api/productos                  │   │  ├─ syncProducts()             │
│  └─ /api/inventario                 │   │  ├─ syncInventory()            │
│  └─ /api/ventas                     │   │  ├─ syncRecentSales()          │
│  └─ /api/compras                    │   │  └─ syncRecentPurchases()      │
│                                     │   │             ↓                   │
│  ngrok (Exposición)                 │   │  PostgreSQL Database            │
│  https://abc123.ngrok.io            │   │  ├─ Products (stock updated)   │
└──────────────────────┬──────────────┘   │  ├─ SiicarSale                  │
                       │               │  ├─ SiicarPurchase               │
                       │               │  └─ SiicarSyncLog                │
                       └───────────────┼──────────────────────────────────┘
                                       │
                                  http/https
```

---

## 📂 Archivos Creados (9 archivos)

### Core (Lógica)
- **`lib/siicar-bridge.ts`** - Cliente que conecta el bridge local  
  - Métodos: `fetchProducts()`, `fetchInventory()`, `fetchRecentSales()`, `fetchRecentPurchases()`, `healthCheck()`
  
- **`lib/siicar-sync.ts`** - Servicio de sincronización  
  - Sincroniza cada tipo de dato y maneja errores
  - Crea logs de cada operación
  - Upsert automático de productos

### APIs
- **`app/api/siicar/sync/route.ts`** - Endpoint manual de sincronización  
  - POST para ejecutar sync bajo demanda
  - GET para health check
  
- **`app/api/cron/siicar-sync/route.ts`** - Función cron Vercel  
  - Ejecuta automáticamente cada 5 minutos
  - Validación con CRON_SECRET

### Local Bridge
- **`siicar-local-bridge.js`** - Servidor Node.js local  
  - Debe correr en la máquina con SIICAR
  - Expone HTTP API con 5 endpoints
  - Reemplazar funciones stub con lógica real

### Utilidades
- **`siicar-utils.js`** - Herramientas para setup  
  - Generar claves secretas
  - Testear conexiones
  - Usar ngrok
  
### Configuración
- **`vercel.json`** - Config cron para Vercel  
  - Define: `*/5 * * * *` = cada 5 minutos
  
- **`.env.example`** - Template de variables actualizado  
  - `SIICAR_LOCAL_URL`
  - `SIICAR_LOCAL_KEY`
  - `CRON_SECRET`

### Documentación  
- **`SIICAR-INTEGRATION.md`** - Guía completa (como referencia)
  - Instalación paso a paso
  - Troubleshooting completo
  - Seguridad y monitoreo
  
- **`SIICAR-SETUP.md`** - Checklist práctico (usa este)
  - Pasos ordenados para implementar
  - Código de ejemplo para cada tipo de SIICAR
  - Testing y debugging

### Base de Datos
- **`prisma/schema.prisma`** - Schema extendido  
  - Tabla `Product` con campos SIICAR
  - `SiicarProductSync` - mapeo productos
  - `SiicarSale` + `SiicarSaleItem` - ventas
  - `SiicarPurchase` + `SiicarPurchaseItem` - compras
  - `SiicarSyncLog` - auditoria

---

## 🔄 Flujo de Funcionamiento

### 1️⃣ Configuración Inicial (Una sola vez)

```bash
# 1. Editar .env.local con:
SIICAR_LOCAL_URL=http://localhost:9500
SIICAR_LOCAL_KEY=algo-secreto
CRON_SECRET=otra-cosa-secreta

# 2. Editar siicar-local-bridge.js con tu conexión real
# (Reemplazar funciones stub)

# 3. Ejecutar migración Prisma
npx prisma migrate dev --name add_siicar_sync_tables

# 4. Iniciar bridge local
node siicar-local-bridge.js
```

### 2️⃣ Sincronización en Vivo

**Automática (cada 5 minutos en Vercel):**
```
✓ 10:00 AM - Cron ejecuta
✓ 10:05 AM - Datos actualizados
✓ 10:10 AM - Nuevo sync
✓ 10:15 AM - ... y así cada 5 min
```

**Manual (desde admin):**
```
Usuario ADMIN ejecuta: POST /api/siicar/sync
→ Sincronización immediata
```

### 3️⃣ Datos Disponibles en tu Sitio

```
GET /productos → Stock actualizado cada 5 min
GET /api/orders → Historial de ventas
GET /admin → Dashboard con logs de sync
```

---

## 🔌 Integración SIICAR (Customization)

El archivo `siicar-local-bridge.js` contiene stub functions. **Reemplázalas con tu conexión real:**

**Si SIICAR usa SQL Server:**
```javascript
const sql = require('mssql');
async function getSiicarProducts() {
  // Tu código real de SQL Server
}
```

**Si SIICAR usa MySQL:**
```javascript
const mysql = require('mysql2/promise');
async function getSiicarProducts() {
  // Tu código real de MySQL
}
```

**Si SIICAR tiene API:**
```javascript
async function getSiicarProducts() {
  const res = await fetch('https://siicar-api/productos');
  return res.json();
}
```

**Si SIICAR son archivos:**
```javascript
const fs = require('fs');
async function getSiicarProducts() {
  return JSON.parse(fs.readFileSync('SIICAR/productos.json'));
}
```

---

## 📊 Datos Sincronizados (4 tipos)

| Tipo | Desde | Hacia | Frecuencia | ¿Qué? |
|------|-------|-------|-----------|-------|
| **Productos** | SIICAR `/api/productos` | `Products` table | C/5 min | nombre, sku, precio, categoría |
| **Inventario** | SIICAR `/api/inventario` | `Products.stock` | C/5 min | cantidad disponible |
| **Ventas** | SIICAR `/api/ventas` | `SiicarSale` table | C/5 min | últimas transacciones |
| **Compras** | SIICAR `/api/compras` | `SiicarPurchase` table | C/5 min | compras a proveedores |

---

## 🌍 Exposición de SIICAR (Local → Internet)

Para que Vercel acceda a SIICAR local:

**Opción A: ngrok** (Desarrollo, recomendado)
```bash
ngrok http 9500
# → https://abc123.ngrok.io/api/health
```

**Opción B: Port Forwarding del Router**
- Mapear puerto 9500 interno → externo
- Usar IP pública

**Opción C: VPN Segura**  
- Cloudflare Tunnel, WireGuard, etc.

---

## ✅ Checklist Implementación

- [x] Código creado (9 archivos)
- [x] Schema Prisma extendido
- [x] Funciones cron configuradas
- [x] Documentación completa
- [ ] **TODO PARA TI:** Editar `siicar-local-bridge.js` con conexión real
- [ ] **TODO PARA TI:** Ejecutar migración Prisma
- [ ] **TODO PARA TI:** Variables de entorno en Vercel
- [ ] **TODO PARA TI:** Testear localmente
- [ ] **TODO PARA TI:** Desplegar a Vercel

---

## 🚀 Próximos Pasos

1. **Lee:** `SIICAR-SETUP.md` (guía paso-a-paso)
2. **Edita:** `siicar-local-bridge.js` con tu conexión SIICAR
3. **Corre:** `node siicar-utils.js secrets` (generar claves)
4. **Testa:** `node siicar-utils.js test-siicar`
5. **Deploy:** Push a GitHub → Vercel

---

## 📞 Documentación de Referencia

- 📖 **SIICAR-INTEGRATION.md** - Referencia técnica completa
- 📋 **SIICAR-SETUP.md** - Pasos prácticos (este es el que necesitas)
- 💻 **Code Files** - Bien documentados con comentarios

---

## 🎉 ¡Listo!

Tu sistema está preparado para sincronizar SIICAR **automáticamente cada 5 minutos**. Solo necesitas:

1. Conectar SIICAR (editar bridge)
2. Exponer a internet (ngrok)
3. Configurar en Vercel
4. ¡Deploying!

**Soporte:** La arquitectura es completamente extensible. Para agregar más datos o cambiar frecuencia, solo edita los archivos de `lib/siicar-sync.ts`.

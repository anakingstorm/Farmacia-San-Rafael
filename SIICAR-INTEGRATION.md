# Integración SIICAR - Guía de Instalación

## 📋 Resumen

Este proyecto está configurado para sincronizar datos desde **SIICAR** (software POS local) cada 5 minutos. La arquitectura consta de:

1. **Bridge API Local** - Servidor Node.js que expone SIICAR a través de HTTP
2. **Sincronización en Vercel** - Función cron que ejecuta cada 5 minutos
3. **Base de Datos** - PostgreSQL con tablas de sincronización

---

## 🚀 Instalación

### Paso 1: Configurar SIICAR Bridge Localmente

El archivo `siicar-local-bridge.js` debe ejecutarse en la máquina donde está instalado SIICAR.

#### Requisitos:
- Node.js 16+
- Acceso a SIICAR (API, base de datos o archivos)

#### Instrucciones:

1. **Editar el archivo** `siicar-local-bridge.js`:
   - Reemplaza las funciones stub (`getSiicarProducts`, `getSiicarInventory`, etc.) con la lógica real de conexión a SIICAR
   - Opciones comunes:
     - **Si SIICAR usa SQL Server (MSSQL)**: Instala `npm install mssql`
     - **Si SIICAR usa MySQL**: Instala `npm install mysql2`
     - **Si SIICAR usa archivos**: Lee con `fs.readFileSync()`
     - **Si SIICAR tiene API**: Usa `fetch()` o `axios`

2. **Instalar dependencias** (si aplica):
   ```bash
   npm install mssql  # Para SQL Server
   # o
   npm install mysql2  # Para MySQL
   ```

3. **Configurar variables de entorno** en tu máquina local:
   ```bash
   # En Windows PowerShell:
   $env:SIICAR_PORT = "9500"
   $env:SIICAR_API_KEY = "tu-clave-secreta"
   $env:SIICAR_DB_PATH = "C:\path\to\siicar\db.mdf"  # Si aplica
   ```

4. **Ejecutar el bridge**:
   ```bash
   node siicar-local-bridge.js
   ```

   Deberías ver:
   ```
   ╔════════════════════════════════════════════╗
   ║  SIICAR Bridge Server Running              ║
   ║  URL: http://localhost:9500                ║
   ║  API Key: ✓ Configured                     ║
   ╚════════════════════════════════════════════╝
   ```

5. **Verificar conexión**:
   ```bash
   curl http://localhost:9500/api/health
   ```

---

### Paso 2: Exponer el Bridge a la Red

Para que Vercel pueda conectar con SIICAR local, necesitas exponer el puerto:

#### Opción A: Usar ngrok (Recomendado para desarrollo)
```bash
# Descargar ngrok: https://ngrok.com/download
ngrok http 9500
```

Esto te dará una URL como: `https://abc123.ngrok.io`

#### Opción B: Port Forwarding en Router
En tu router, redirige puerto 9500 a la IP interna de tu máquina local.

#### Opción C: VPN/Tunnel Personalizado
Implementa tu propio túnel seguro.

---

### Paso 3: Configurar Variables de Entorno en Vercel

Accede a tu proyecto en Vercel y configura en **Settings > Environment Variables**:

```
SIICAR_LOCAL_URL=https://abc123.ngrok.io
SIICAR_LOCAL_KEY=tu-clave-secreta
CRON_SECRET=tu-clave-secreta-cron
```

**Importante**: Si SIICAR está en desarrollo, usa ngrok. Para producción, implementa un tunnel seguro.

---

### Paso 4: Crear Migración Prisma

Ejecuta la migración para crear las tablas de sincronización:

```bash
npx prisma migrate dev --name add_siicar_tables
```

Esto creará:
- `SiicarProductSync`
- `SiicarSale`
- `SiicarSaleItem`
- `SiicarPurchase`
- `SiicarPurchaseItem`
- `SiicarSyncLog`

---

## 🔄 ¿Cómo Funciona la Sincronización?

### Flujo Automático (Vercel Cron)

Cada 5 minutos:

```
Vercel Cron (*/5 * * * *)
  ↓
GET /api/cron/siicar-sync (con autenticación CRON_SECRET)
  ↓
siicarSyncService.syncAll()
  ├─ syncProducts()        → Actualiza productos/categorías
  ├─ syncInventory()       → Actualiza stock
  ├─ syncRecentSales()     → Importa ventas últimos 5 min
  └─ syncRecentPurchases() → Importa compras últimos 5 min
  ↓
Base de datos PostgreSQL
  ↓
Disponible en tu sitio web
```

### Sincronización Manual

Para sincronizar manualmente desde tu administrador:

```bash
curl -X POST http://localhost:3000/api/siicar/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token" \
  -d '{"type": "all"}'
```

O especificar tipo:
```bash
curl -X POST http://localhost:3000/api/siicar/sync \
  -d '{"type": "products"}'

curl -X POST http://localhost:3000/api/siicar/sync \
  -d '{"type": "inventory"}'

curl -X POST http://localhost:3000/api/siicar/sync \
  -d '{"type": "sales", "minutosAtras": 10}'
```

---

## 📊 Datos Sincronizados

### 1. Productos (`/api/api/productos`)
```json
{
  "sku": "MED-001",
  "nombre": "Paracetamol 500mg",
  "precio": 5000,        // en centavos
  "stock": 150,
  "categoria": "Analgésicos",
  "detalles": { "presentacion": "Caja x 30" }
}
```

**Actualiza**: Tabla `Product` en BD

---

### 2. Inventario (`/api/inventario`)
```json
{
  "sku": "MED-001",
  "cantidad": 150,
  "ultimaActualizacion": "2024-01-15T10:30:00Z"
}
```

**Actualiza**: Campo `stock` en tabla `Product`

---

### 3. Ventas (`/api/ventas`)
```json
{
  "id": "VENTA-2024-001",
  "fecha": "2024-01-15T10:30:00Z",
  "items": [
    { "sku": "MED-001", "cantidad": 2, "precio": 5000 }
  ],
  "total": 10000
}
```

**Crea**: Registros en `SiicarSale` y `SiicarSaleItem`

---

### 4. Compras (`/api/compras`)
```json
{
  "id": "COMPRA-2024-001",
  "fecha": "2024-01-15T09:00:00Z",
  "proveedor": "Distribuidora XYZ",
  "items": [
    { "sku": "MED-001", "cantidad": 100, "costo": 3000 }
  ],
  "total": 300000
}
```

**Crea**: Registros en `SiicarPurchase` y `SiicarPurchaseItem`

---

## 🔍 Monitoreo

### Ver Logs de Sincronización

En la BD, consulta la tabla `SiicarSyncLog`:

```sql
SELECT * FROM "SiicarSyncLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

Campos:
- `tipo`: PRODUCTS, INVENTORY, SALES, PURCHASES
- `status`: SUCCESS, PARTIAL, FAILED
- `itemsProcessed`: Cantidad sincronizada
- `itemsFailed`: Errores
- `duration`: Milisegundos tomados
- `error`: Mensaje de error (si aplica)

---

### Verificar Conexión con SIICAR

```bash
curl http://localhost:3000/api/siicar/sync?check=health
```

Respuesta:
```json
{
  "siicar": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🛠️ Troubleshooting

### Error: "EADDRINUSE: address already in use :::9500"
El puerto 9500 ya está en uso.

**Solución**:
```bash
# Cambiar puerto
$env:SIICAR_PORT = "9501"
node siicar-local-bridge.js

# O matar el proceso
netstat -ano | findstr :9500
taskkill /PID <PID> /F
```

### Error: "Cannot connect to SIICAR"
El bridge no está corriendo o no es accesible.

**Solución**:
1. Verifica que `siicar-local-bridge.js` esté corriendo
2. Verifica firewall permite puerto 9500
3. Si usas ngrok, verifica que siga activo
4. Revisa que `SIICAR_LOCAL_URL` sea correcta en Vercel

### Error: "Socket hang up"
Timeout de conexión.

**Solución**:
- Aumenta timeout en `siicar-bridge.ts` (línea `this.timeout = 10000`)
- Verifica velocidad de red
- Verifica que SIICAR esté respondiendo

### Datos no se sincronizan
Verifica:
1. ¿Vercel cron está activo? (Settings > Crons)
2. ¿SIICAR bridge está corriendo?
3. ¿Variables de entorno son correctas?
4. ¿Base de datos está accesible desde Vercel?

---

## 📚 Estructura de Archivos

```
├── siicar-local-bridge.js         ← Servidor bridge (corre localmente)
├── lib/
│   ├── siicar-bridge.ts           ← Cliente para conectar bridge
│   └── siicar-sync.ts             ← Lógica de sincronización
├── app/api/
│   ├── cron/
│   │   └── siicar-sync/route.ts   ← Función cron Vercel
│   └── siicar/
│       ├── sync/route.ts          ← API manual de sincronización
│       └── test/route.ts          ← Test de SIICAR
├── prisma/
│   └── schema.prisma              ← Schema con modelos SIICAR
└── vercel.json                    ← Config cron para Vercel
```

---

## 🔐 Seguridad

### En Desarrollo
- Usa claves simples para testing
- ngrok proporciona URL pública

### En Producción
- **Implementa autenticación fuerte** en SIICAR bridge
- **Usa HTTPS** (vercel.json ya redirige)
- **Protege API keys** en Vercel Environment Variables
- **Limita acceso** por IP si es posible
- **Audita logs** regularmente
- **Encripta datos sensibles** en tránsito

---

## 📞 Soporte

Para problemas específicos con SIICAR:
1. Revisa la documentación de SIICAR
2. Verifica que tengas acceso a datos (BD, API, archivos)
3. Contacta al proveedor de SIICAR

Para problemas con Vercel:
- Documentación: https://vercel.com/docs
- Soporte: https://vercel.com/support

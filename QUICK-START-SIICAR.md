# ⚡ SIICAR Sync - Quick Start (5 MINUTOS)

## Antes de Empezar
✓ Node.js + npm instalados  
✓ Proyecto Next.js corriendo  
✓ PostgreSQL conectada  
✓ Acceso a SIICAR local  

---

## 🔧 Paso 1: Configuración (2 min)

### 1.1 Generar Claves
```bash
cd c:\Users\anaki\Farmacia-San-Rafael
node siicar-utils.js secrets
```

Copiar output:
```
CRON_SECRET=abc123...
SIICAR_LOCAL_KEY=xyz789...
```

### 1.2 Crear .env.local
```bash
Copy-Item .env.example .env.local
```

Editar `.env.local` y pegar:
```
SIICAR_LOCAL_URL=http://localhost:9500
SIICAR_LOCAL_KEY=xyz789...
CRON_SECRET=abc123...
```

---

## 🔌 Paso 2: Conectar SIICAR (1 min)

Editar `siicar-local-bridge.js` líneas 50-80.

**Si usas SQL Server:**
```javascript
// Reemplazar getSiicarProducts() con:
async function getSiicarProducts() {
  const pool = new sql.ConnectionPool({
    server: 'TU-SERVIDOR',
    database: 'SIICAR',
    authentication: { type: 'windows' }
  });
  await pool.connect();
  const result = await pool.request().query('SELECT * FROM Productos');
  return result.recordset;
}
```

**Si usas MySQL:**
```javascript
async function getSiicarProducts() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'siicar',
    password: 'pass',
    database: 'siicar_db'
  });
  const [rows] = await conn.execute('SELECT * FROM productos');
  return rows;
}
```

**Si SIICAR es API:**
```javascript
async function getSiicarProducts() {
  const r = await fetch('https://siicar.local/api/productos');
  return r.json();
}
```

---

## ✅ Paso 3: Testear Local (1 min)

Terminal 1 - Inicia bridge:
```bash
node siicar-local-bridge.js
```

Deberías ver:
```
╔════════════════════════════════════════════╗
║  SIICAR Bridge Server Running              ║
║  URL: http://localhost:9500                ║
╚════════════════════════════════════════════╝
```

Terminal 2 - Test rápido:
```bash
node siicar-utils.js test-siicar
```

Respuesta esperada:
```
✅ SIICAR está conectado
   Endpoints disponibles:
   - GET  /api/health
   - GET  /api/productos
   - GET  /api/inventario
```

---

## 🗄️ Paso 4: Migrar BD (1 min)

```bash
npx prisma migrate dev --name add_siicar_sync_tables
```

Responde `Yes` cuando pregunte si crear migration.

Verifica que pase sin errores ✓

---

## 🌐 Paso 5: Exponer a Internet (ngrok)

**Descarga ngrok:** https://ngrok.com/download

**Ejecuta en otra terminal:**
```bash
ngrok http 9500
```

Copiar la URL que genera:
```
https://abc123def456.ngrok.io
```

**Actualizar .env.local:**
```
SIICAR_LOCAL_URL=https://abc123def456.ngrok.io
```

---

## 🚀 Paso 6: Deploy a Vercel (5 min)

### 6.1 Push a GitHub
```bash
git add .
git commit -m "Add SIICAR sync integration"
git push
```

### 6.2 Vercel Environment Variables

En: https://vercel.com → tu proyecto → Settings → Environment Variables

Agregar:
```
SIICAR_LOCAL_URL = https://abc123def456.ngrok.io
SIICAR_LOCAL_KEY = xyz789...
CRON_SECRET = abc123...
DATABASE_URL = (ya existe)
```

### 6.3 Verificar Cron

Settings → Crons → Verifica que esté `/api/cron/siicar-sync` con `*/5 * * * *`

---

## 📊 Verificar que Funciona

### En 5 minutos:

1. Entra al admin
2. Mira los productos
3. Los precios/stock están actualizados → ✅ FUNCIONA

### En la BD:

```sql
SELECT * FROM "SiicarSyncLog" 
ORDER BY "createdAt" DESC LIMIT 1;
```

Si ves:
- `status: "SUCCESS"` → ✅ Todo bien
- `itemsProcessed > 0` → ✅ Datos sincronizados

---

## 🆘 Si Algo Falla

| Error | Solución |
|-------|----------|
| `Cannot connect to SIICAR` | ¿`siicar-local-bridge.js` corre? |
| `Functions are fake` | Editar `siicar-local-bridge.js` con conexión real |
| Port 9500 ocupado | Cambiar `SIICAR_PORT=9501` |
| ngrok no va | `ngrok http 9500` y copiar URL |
| Vercel cron no ejecuta | Revisar `CRON_SECRET` coincida |

---

## 📚 Documentación Completa

- 📖 **SIICAR-SETUP.md** - Guía detallada  
- 📖 **SIICAR-INTEGRATION.md** - Referencia técnica  
- 📖 **SIICAR-RESUMEN.md** - Arquitectura ejecutiva  

---

## 🎯 Resumen Final

✅ Bridge local expone SIICAR  
✅ Vercel sincroniza cada 5 minutos  
✅ Base de datos actualizada  
✅ ¡Tu sitio web ve datos en vivo!  

**Tiempo total:** ~15-20 minutos

---

**¿Preguntas?** Revisa `SIICAR-SETUP.md` sección "Troubleshooting"

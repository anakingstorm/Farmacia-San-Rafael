# Farmacia San Rafael - E-commerce

Proyecto base con Next.js 14 (App Router), TypeScript, Prisma, NextAuth, TailwindCSS y Vitest.

## Funcionalidades iniciales
- Listado de productos y categorías (APIs REST básicas)
- Autenticación con credenciales (email + contraseña) mediante NextAuth + Prisma Adapter
- Creación de órdenes con items
- Esquema Prisma listo (User, Category, Product, Order, OrderItem, NextAuth tables)
- Stub de integración con SIICAR (`/api/siicar/test`)
- Layout básico con Tailwind

## Requisitos previos

## Variables de entorno
Copia `.env.example` a `.env` y ajusta:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
SIICAR_BASE_URL=
SIICAR_API_KEY=
```

## Deploy / Hosting

Dev local usa SQLite. Para producción, usa Postgres gestionado y un hosting tipo Vercel.

Opción Vercel (recomendada):
- Conecta el repo y configura Variables en Project Settings:
	- NEXTAUTH_URL=https://<tu-app>.vercel.app
	- NEXTAUTH_SECRET=<genera uno>
	- DATABASE_URL=postgresql://usuario:pass@host:port/db
	- SIICAR_BASE_URL, SIICAR_API_KEY
- Build & deploy automático.

Base de datos:
- Cambia a Postgres en producción. Puedes usar `prisma/schema.postgres.prisma` como referencia.
- Ajusta `prisma/schema.prisma` (provider postgresql) y corre migraciones.

Migración a Postgres (resumen):
1. Actualiza `datasource db { provider = "postgresql" }` en `prisma/schema.prisma` y `.env` con la nueva `DATABASE_URL`.
2. `cmd /c npm run prisma:migrate`
3. `cmd /c npm run db:seed`

SIICAR:
- Definir SIICAR_BASE_URL y SIICAR_API_KEY en entorno de prod.
- Endpoint: POST /api/siicar/sale { orderId }

## Instalación
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Próximos pasos sugeridos
- Añadir páginas de detalle de producto y categoría
- Implementar carrito (contexto + localStorage)
- Integrar endpoints reales de SIICAR (crear servicio en `lib/siicar.ts`)
- Añadir roles y panel admin
- Validaciones adicionales y tests

## Tests
```bash
npm run test
```

## Licencia
Uso interno.

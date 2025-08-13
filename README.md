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
- Node.js 18+
- Base de datos PostgreSQL (puedes cambiar provider en `schema.prisma`)

## Variables de entorno
Copia `.env.example` a `.env` y ajusta:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
SIICAR_BASE_URL=
SIICAR_API_KEY=
```

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

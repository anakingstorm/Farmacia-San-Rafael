import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { isAdminOwnerSession } from '../../../../lib/auth/permissions';
// Load xlsx dynamically at runtime if available. It's optional to allow `npm install` without it.

// Ajusta estas claves a los headers reales del Excel de SICAR
const COLUMN_MAP = {
  sku: ['Clave', 'Codigo', 'Código', 'SKU'],
  name: ['Descripcion', 'Descripción', 'Nombre', 'Articulo'],
  price: ['Precio', 'PrecioVenta', 'Precio Venta', 'PrecioPublico'],
  stock: ['Existencia', 'Stock', 'Cantidad'],
};

function pickColumn(row: Record<string, any>, candidates: string[]): any {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toCents(value: any): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminOwnerSession(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Falta el archivo (campo "file")' }, { status: 400 });
  }

  // Necesitamos una categoría por defecto para productos importados sin categoría en SICAR
  let defaultCategory = await prisma.category.findUnique({ where: { slug: 'sin-categoria' } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: 'Sin categoría', slug: 'sin-categoria' },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const XLSX = await import('xlsx').catch(() => null);
  if (!XLSX) {
    return NextResponse.json({ error: 'Módulo "xlsx" no está instalado. Instala con: npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz (recomendado) o npm install xlsx' }, { status: 500 });
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'El archivo no contiene filas de datos' }, { status: 400 });
  }

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSku = pickColumn(row, COLUMN_MAP.sku);
    const rawName = pickColumn(row, COLUMN_MAP.name);
    const rawPrice = pickColumn(row, COLUMN_MAP.price);
    const rawStock = pickColumn(row, COLUMN_MAP.stock);

    if (!rawName || rawPrice === undefined) {
      results.skipped++;
      results.errors.push(`Fila ${i + 2}: falta nombre o precio, se omitió`);
      continue;
    }

    const sku = rawSku ? String(rawSku).trim() : null;
    const name = String(rawName).trim();
    const priceCents = toCents(rawPrice);
    const stock = rawStock !== undefined ? parseInt(String(rawStock), 10) || 0 : 0;
    const slug = slugify(sku || name);

    try {
      const existing = sku
        ? await prisma.product.findUnique({ where: { sku } })
        : await prisma.product.findUnique({ where: { slug } });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { name, priceCents, stock, sku: sku ?? existing.sku },
        });
        results.updated++;
      } else {
        await prisma.product.create({
          data: { name, slug, sku, priceCents, stock, categoryId: defaultCategory.id },
        });
        results.created++;
      }
    } catch (e: any) {
      results.skipped++;
      results.errors.push(`Fila ${i + 2} (${name}): ${e.message}`);
    }
  }

  return NextResponse.json(results);
}

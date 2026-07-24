import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/config';
import { isAdminOwnerSession } from '../../../../lib/auth/permissions';
// Load xlsx dynamically at runtime if available. It's optional to allow `npm install` without it.

const COLUMN_SYNONYMS = {
  sku: ['clave', 'codigo', 'código', 'sku', 'articulo', 'artículo', 'codigo articulo', 'código articulo', 'codigo producto', 'código producto'],
  name: ['descripcion', 'descripción', 'nombre', 'articulo', 'artículo', 'producto', 'detalle'],
  price: ['precio', 'precio venta', 'precioventa', 'precio publico', 'preciopublico', 'p venta', 'p. venta', 'pv', 'venta'],
  stock: ['existencia', 'stock', 'cantidad', 'inventario', 'disponible', 'existencias'],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function compactHeader(value: unknown): string {
  return normalizeHeader(value).replace(/[^a-z0-9]/g, '');
}

function matchHeader(headers: string[], candidates: string[]): number {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    normalized: normalizeHeader(header),
    compact: compactHeader(header)
  }));

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);
    const compactCandidate = compactHeader(candidate);
    const index = normalizedHeaders.findIndex((header) =>
      header.normalized === normalizedCandidate ||
      header.compact === compactCandidate ||
      header.normalized.includes(normalizedCandidate) ||
      normalizedCandidate.includes(header.normalized)
    );
    if (index !== -1) {
      return index;
    }
  }

  return -1;
}

function buildColumnMap(headers: string[]) {
  return {
    sku: matchHeader(headers, COLUMN_SYNONYMS.sku),
    name: matchHeader(headers, COLUMN_SYNONYMS.name),
    price: matchHeader(headers, COLUMN_SYNONYMS.price),
    stock: matchHeader(headers, COLUMN_SYNONYMS.stock),
  };
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
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]/g, '').replace(/,/g, '.'));
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
  const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });

  if (grid.length === 0) {
    return NextResponse.json({ error: 'El archivo no contiene filas de datos' }, { status: 400 });
  }

  let headerRowIndex = -1;
  let columnMap = { sku: -1, name: -1, price: -1, stock: -1 };

  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    const row = grid[i].map((cell) => normalizeHeader(cell));
    const candidateMap = buildColumnMap(row);
    const matches = [candidateMap.sku, candidateMap.name, candidateMap.price, candidateMap.stock].filter((index) => index !== -1).length;

    if (matches >= 2) {
      headerRowIndex = i;
      columnMap = candidateMap;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return NextResponse.json({
      error: 'No pude detectar la fila de encabezados del Excel de SIICAR.',
      hint: 'Busca una fila con columnas tipo SKU/Clave, Nombre/Descripción y Precio. Si quieres, te adapto el importador al encabezado exacto.',
    }, { status: 400 });
  }

  const rows = grid.slice(headerRowIndex + 1);

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSku = columnMap.sku !== -1 ? row[columnMap.sku] : undefined;
    const rawName = columnMap.name !== -1 ? row[columnMap.name] : undefined;
    const rawPrice = columnMap.price !== -1 ? row[columnMap.price] : undefined;
    const rawStock = columnMap.stock !== -1 ? row[columnMap.stock] : undefined;

    if (!rawName || rawPrice === undefined) {
      results.skipped++;
      results.errors.push(`Fila ${headerRowIndex + i + 2}: falta nombre o precio, se omitió`);
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
      results.errors.push(`Fila ${headerRowIndex + i + 2} (${name}): ${e.message}`);
    }
  }

  return NextResponse.json(results);
}

/**
 * HU-026 Audit Fix — Data Migration (usando @prisma/client)
 * Mapea: ENTRADA → COMPRA, SALIDA → VENTA
 * Ejecutar con:
 *   DATABASE_URL=mysql://... node prisma/seeds/migrate-kardex-types.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const before = await prisma.kardexEntry.groupBy({
    by: ['type'],
    _count: { id: true },
  });
  console.log('Estado ANTES:');
  console.table(before.map(r => ({ type: r.type, count: r._count.id })));

  const r1 = await prisma.$executeRaw`UPDATE KardexEntry SET type = 'COMPRA' WHERE type = 'ENTRADA'`;
  console.log(`✓ ENTRADA → COMPRA: ${r1} filas`);

  const r2 = await prisma.$executeRaw`UPDATE KardexEntry SET type = 'VENTA' WHERE type = 'SALIDA'`;
  console.log(`✓ SALIDA  → VENTA:  ${r2} filas`);

  const after = await prisma.kardexEntry.groupBy({
    by: ['type'],
    _count: { id: true },
  });
  console.log('Estado DESPUÉS:');
  console.table(after.map(r => ({ type: r.type, count: r._count.id })));

  const bad = after.filter(r => r.type === 'ENTRADA' || r.type === 'SALIDA');
  if (bad.length > 0) {
    console.error('ERROR: aún hay filas con tipos deprecados:', bad);
    process.exit(1);
  }
  console.log('✅ Migración de datos completada.');
}

run()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

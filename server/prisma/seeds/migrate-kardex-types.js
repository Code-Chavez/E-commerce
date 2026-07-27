/**
 * HU-026 Audit Fix — Data Migration Script
 * Mapea los valores deprecados del enum KardexType a los definitivos:
 *   ENTRADA → COMPRA  (ingreso de mercadería era el caso dominante)
 *   SALIDA  → VENTA   (salida por venta era el caso dominante)
 *
 * IMPORTANTE: Ejecutar DESPUÉS de hu026_phase1_add_fields y ANTES de hu026_phase2_remove_deprecated_types.
 * Uso: node server/prisma/seeds/migrate-kardex-types.js
 */

const mysql = require('mysql2/promise');

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL no definida. Ejemplo:');
    console.error('  DATABASE_URL=mysql://user:pass@127.0.0.1:3307/db node migrate-kardex-types.js');
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  try {
    const [before] = await conn.execute(
      "SELECT type, COUNT(*) as cnt FROM KardexEntry GROUP BY type"
    );
    console.log('Estado ANTES de la migración:');
    console.table(before);

    const [r1] = await conn.execute(
      "UPDATE KardexEntry SET type = 'COMPRA' WHERE type = 'ENTRADA'"
    );
    console.log(`✓ ENTRADA → COMPRA: ${r1.affectedRows} filas actualizadas`);

    const [r2] = await conn.execute(
      "UPDATE KardexEntry SET type = 'VENTA' WHERE type = 'SALIDA'"
    );
    console.log(`✓ SALIDA  → VENTA:  ${r2.affectedRows} filas actualizadas`);

    const [after] = await conn.execute(
      "SELECT type, COUNT(*) as cnt FROM KardexEntry GROUP BY type"
    );
    console.log('Estado DESPUÉS de la migración:');
    console.table(after);

    const remaining = after.filter(r => r.type === 'ENTRADA' || r.type === 'SALIDA');
    if (remaining.length > 0) {
      console.error('ERROR: Aún existen filas con tipos deprecados:', remaining);
      process.exit(1);
    }

    console.log('✅ Migración de datos completada correctamente.');
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});

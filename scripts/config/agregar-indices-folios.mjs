/**
 * Script para agregar índices en folios de entradas y salidas
 * Fecha: 2025-11-07
 * Objetivo: Optimizar búsquedas y ordenamiento por folio
 * 
 * IMPORTANTE: Respaldo ya creado en:
 * C:\UA-ISSSTE\backups\suminix_antes_indices_folios_20251107_140818.backup
 */

import { prisma } from './lib/prisma.js';

async function agregarIndicesFolios() {
  console.log('========================================================================');
  console.log('AGREGANDO ÍNDICES EN FOLIOS - Entradas y Salidas');
  console.log('========================================================================\n');

  try {
    console.log('✓ Respaldo de seguridad ya creado');
    console.log('  Archivo: C:\\UA-ISSSTE\\backups\\suminix_antes_indices_folios_20251107_140818.backup\n');

    // 1. Índice en folio de entradas_inventario
    console.log('1/4: Creando índice en entradas_inventario.folio...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "entradas_inventario_folio_idx" 
      ON "entradas_inventario"("folio")
    `);
    console.log('    ✓ Índice creado exitosamente\n');

    // 2. Índice compuesto serie-folio de entradas_inventario
    console.log('2/4: Creando índice compuesto en entradas_inventario (serie, folio)...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "entradas_inventario_serie_folio_idx" 
      ON "entradas_inventario"("serie", "folio")
    `);
    console.log('    ✓ Índice creado exitosamente\n');

    // 3. Índice en folio de salidas_inventario
    console.log('3/4: Creando índice en salidas_inventario.folio...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "salidas_inventario_folio_idx" 
      ON "salidas_inventario"("folio")
    `);
    console.log('    ✓ Índice creado exitosamente\n');

    // 4. Índice compuesto serie-folio de salidas_inventario
    console.log('4/4: Creando índice compuesto en salidas_inventario (serie, folio)...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "salidas_inventario_serie_folio_idx" 
      ON "salidas_inventario"("serie", "folio")
    `);
    console.log('    ✓ Índice creado exitosamente\n');

    // Verificar índices creados
    console.log('Verificando índices creados...\n');
    const indices = await prisma.$queryRawUnsafe(`
      SELECT 
        tablename, 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('entradas_inventario', 'salidas_inventario')
        AND indexname LIKE '%folio%'
      ORDER BY tablename, indexname
    `);

    console.log('Índices en folio encontrados:');
    console.table(indices);

    console.log('\n========================================================================');
    console.log('ÍNDICES AGREGADOS EXITOSAMENTE');
    console.log('========================================================================');
    console.log('\nBeneficios:');
    console.log('  ✓ Búsquedas por folio más rápidas');
    console.log('  ✓ Ordenamiento por folio optimizado');
    console.log('  ✓ Mejor rendimiento con millones de registros');
    console.log('\nSiguientes pasos:');
    console.log('  1. Probar paginación en /dashboard/salidas');
    console.log('  2. Probar paginación en /dashboard/entradas');
    console.log('  3. Verificar ordenamiento por folio');
    console.log('  4. Probar búsqueda por folio\n');

  } catch (error) {
    console.error('\n❌ ERROR al agregar índices:');
    console.error(error);
    console.error('\nPara restaurar el respaldo:');
    console.error('  pg_restore -U postgres -d suminix -c "C:\\UA-ISSSTE\\backups\\suminix_antes_indices_folios_20251107_140818.backup"');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
agregarIndicesFolios();

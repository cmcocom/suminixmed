import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarEntradas() {
  try {
    console.log('=== BUSCANDO ENTRADAS RECIENTES DEL PRODUCTO 121 ===\n');

    // Buscar todas las entradas del producto 121 en noviembre 2025
    const entradas = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.folio,
        e.fecha_entrada,
        e.estado,
        pe.cantidad,
        pe.precio,
        i.clave,
        i.nombre
      FROM entradas_inventario e
      JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
      JOIN "Inventario" i ON i.id = pe.inventario_id
      WHERE i.clave = '121'
        AND e.fecha_entrada >= '2025-11-01 00:00:00'::timestamp
        AND e.fecha_entrada <= '2025-11-30 23:59:59'::timestamp
      ORDER BY e.fecha_entrada DESC
    `;
    
    if (entradas.length > 0) {
      console.log(`✅ Encontradas ${entradas.length} entradas en noviembre 2025:`);
      console.table(entradas);
      const totalEntradas = entradas.reduce((sum, e) => sum + Number(e.cantidad), 0);
      console.log(`\n📊 Total entradas noviembre: ${totalEntradas} unidades`);
    } else {
      console.log('❌ No hay entradas del producto 121 en noviembre 2025');
    }

    // Buscar si hay una entrada con 2800 unidades
    console.log('\n=== BUSCANDO ENTRADA DE 2800 UNIDADES ===\n');
    const entrada2800 = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.folio,
        e.fecha_entrada,
        e.estado,
        pe.cantidad,
        pe.precio,
        i.clave,
        i.nombre
      FROM entradas_inventario e
      JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
      JOIN "Inventario" i ON i.id = pe.inventario_id
      WHERE pe.cantidad = 2800
        AND e.fecha_entrada >= '2025-11-01 00:00:00'::timestamp
        AND e.fecha_entrada <= '2025-11-30 23:59:59'::timestamp
      ORDER BY e.fecha_entrada DESC
    `;
    
    if (entrada2800.length > 0) {
      console.log(`✅ Encontradas ${entrada2800.length} entradas de 2800 unidades:`);
      console.table(entrada2800);
    } else {
      console.log('❌ No hay entradas de 2800 unidades en noviembre 2025');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarEntradas();

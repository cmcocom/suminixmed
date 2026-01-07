import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarEntradas() {
  try {
    console.log('=== VERIFICANDO ENTRADAS DEL 21 DE NOVIEMBRE ===\n');

    // Todas las entradas del 21 de noviembre
    const todasEntradas = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.folio,
        e.fecha_entrada,
        e.estado,
        pe.cantidad,
        i.clave,
        i.nombre,
        i.id as inventario_id
      FROM entradas_inventario e
      JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
      JOIN "Inventario" i ON i.id = pe.inventario_id
      WHERE e.fecha_entrada >= '2025-11-21 00:00:00'::timestamp
        AND e.fecha_entrada <= '2025-11-21 23:59:59'::timestamp
      ORDER BY pe.cantidad DESC
      LIMIT 20
    `;
    
    if (todasEntradas.length > 0) {
      console.log(`✅ Entradas del 21/nov/2025 (top 20 por cantidad):`);
      console.table(todasEntradas);
    } else {
      console.log('❌ No hay entradas el 21/nov/2025');
    }

    // Verificar si hay entrada de 2800 cerca de esa fecha
    console.log('\n=== BUSCANDO ENTRADA DE 2800 UNIDADES (nov 2025) ===\n');
    const entrada2800 = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.folio,
        e.fecha_entrada,
        e.estado,
        pe.cantidad,
        i.clave,
        i.nombre
      FROM entradas_inventario e
      JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
      JOIN "Inventario" i ON i.id = pe.inventario_id
      WHERE pe.cantidad = 2800
        AND e.fecha_entrada >= '2025-11-01 00:00:00'::timestamp
      ORDER BY e.fecha_entrada DESC
    `;
    
    if (entrada2800.length > 0) {
      console.log(`✅ Entradas de 2800 unidades:`);
      console.table(entrada2800);
    } else {
      console.log('❌ No hay entradas de 2800 unidades en nov 2025');
      
      // Buscar cantidades cercanas a 2800
      console.log('\n=== BUSCANDO CANTIDADES CERCANAS (2700-2900) ===\n');
      const cercanas = await prisma.$queryRaw`
        SELECT 
          e.id,
          e.folio,
          e.fecha_entrada,
          pe.cantidad,
          i.clave,
          i.nombre
        FROM entradas_inventario e
        JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
        JOIN "Inventario" i ON i.id = pe.inventario_id
        WHERE pe.cantidad BETWEEN 2700 AND 2900
          AND e.fecha_entrada >= '2025-11-01 00:00:00'::timestamp
        ORDER BY e.fecha_entrada DESC
      `;
      
      if (cercanas.length > 0) {
        console.table(cercanas);
      } else {
        console.log('No hay entradas con cantidades cercanas');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarEntradas();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function probar() {
  try {
    console.log('=== PROBANDO QUERY CORREGIDA ===\n');

    const fechaInicio = '2025-11-21T00:00:00.000Z';
    const fechaFin = '2025-11-23T23:59:59.999Z';

    console.log(`Rango: ${fechaInicio} a ${fechaFin}\n`);

    // Query corregida con COALESCE
    const query = `
      SELECT 
        i.id,
        i.clave,
        i.nombre as descripcion,
        i.cantidad as existencias,
        COALESCE(
          (SELECT SUM(pe.cantidad) 
           FROM partidas_entrada_inventario pe
           JOIN entradas_inventario e ON e.id = pe.entrada_id
           WHERE pe.inventario_id = i.id
           AND COALESCE(e.fecha_entrada, e.fecha_creacion) BETWEEN $1::timestamp AND $2::timestamp
          ), 0
        ) as total_entradas,
        COALESCE(
          (SELECT SUM(ps.cantidad)
           FROM partidas_salida_inventario ps
           JOIN salidas_inventario s ON s.id = ps.salida_id
           WHERE ps.inventario_id = i.id
           AND COALESCE(s.fecha_salida, s.fecha_creacion) BETWEEN $1::timestamp AND $2::timestamp
          ), 0
        ) as total_salidas
      FROM "Inventario" i
      WHERE i.clave = '121'
    `;

    const resultado = await prisma.$queryRawUnsafe(query, fechaInicio, fechaFin);

    console.log('✅ Resultado:');
    console.table(resultado);

    if (resultado.length > 0) {
      const producto = resultado[0];
      console.log('\n📊 RESUMEN:');
      console.log(`Producto: ${producto.clave} - ${producto.descripcion}`);
      console.log(`Entradas: ${producto.total_entradas} unidades`);
      console.log(`Salidas: ${producto.total_salidas} unidades`);
      console.log(`Existencias actuales: ${producto.existencias} unidades`);

      if (Number(producto.total_entradas) === 2800) {
        console.log('\n✅ ¡CORRECCIÓN EXITOSA! Ahora detecta las 2800 unidades de entrada');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

probar();

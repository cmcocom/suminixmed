import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO PRODUCTO 121 ===\n');

    // 1. Buscar el producto
    const producto = await prisma.inventario.findFirst({
      where: { clave: '121' },
      select: { id: true, clave: true, nombre: true, cantidad: true }
    });

    if (!producto) {
      console.log('❌ Producto 121 no encontrado');
      return;
    }

    console.log('✅ Producto encontrado:');
    console.table(producto);

    // 2. Entradas del 21 de noviembre
    console.log('\n=== ENTRADAS del 21/nov/2025 ===');
    const entradas = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.folio,
        e.fecha_entrada,
        pe.cantidad,
        pe.precio,
        i.clave,
        i.nombre
      FROM entradas_inventario e
      JOIN partidas_entrada_inventario pe ON pe.entrada_id = e.id
      JOIN "Inventario" i ON i.id = pe.inventario_id
      WHERE i.clave = '121'
        AND e.fecha_entrada >= '2025-11-21 00:00:00'::timestamp
        AND e.fecha_entrada <= '2025-11-21 23:59:59'::timestamp
      ORDER BY e.fecha_entrada
    `;
    
    if (entradas.length > 0) {
      console.table(entradas);
      const totalEntradas = entradas.reduce((sum, e) => sum + Number(e.cantidad), 0);
      console.log(`\n📊 Total entradas: ${totalEntradas} unidades`);
    } else {
      console.log('Sin entradas en esta fecha');
    }

    // 3. Salidas del 21 de noviembre
    console.log('\n=== SALIDAS del 21/nov/2025 ===');
    const salidas = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.folio,
        s.fecha_salida,
        ps.cantidad,
        ps.precio,
        i.clave,
        i.nombre
      FROM salidas_inventario s
      JOIN partidas_salida_inventario ps ON ps.salida_id = s.id
      JOIN "Inventario" i ON i.id = ps.inventario_id
      WHERE i.clave = '121'
        AND s.fecha_salida >= '2025-11-21 00:00:00'::timestamp
        AND s.fecha_salida <= '2025-11-21 23:59:59'::timestamp
      ORDER BY s.fecha_salida
    `;
    
    if (salidas.length > 0) {
      console.table(salidas);
      const totalSalidas = salidas.reduce((sum, s) => sum + Number(s.cantidad), 0);
      console.log(`\n📊 Total salidas: ${totalSalidas} unidades`);
    } else {
      console.log('Sin salidas en esta fecha');
    }

    // 4. Probar la query del reporte con fechas específicas
    console.log('\n=== QUERY DEL REPORTE (21-23 nov) ===');
    const fechaInicio = '2025-11-21T00:00:00.000Z';
    const fechaFin = '2025-11-23T23:59:59.999Z';
    
    const queryReporte = await prisma.$queryRaw`
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
           AND e.fecha_entrada BETWEEN ${fechaInicio}::timestamp AND ${fechaFin}::timestamp
          ), 0
        ) as total_entradas,
        COALESCE(
          (SELECT SUM(ps.cantidad)
           FROM partidas_salida_inventario ps
           JOIN salidas_inventario s ON s.id = ps.salida_id
           WHERE ps.inventario_id = i.id
           AND s.fecha_salida BETWEEN ${fechaInicio}::timestamp AND ${fechaFin}::timestamp
          ), 0
        ) as total_salidas
      FROM "Inventario" i
      WHERE i.clave = '121'
    `;
    
    console.table(queryReporte);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();

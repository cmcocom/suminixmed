// Script de diagnóstico para el reporte de salidas por cliente
// Archivo: test-reporte-salidas.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReporteSalidasCliente() {
  console.log('=== Diagnóstico del Reporte de Salidas por Cliente ===\n');

  try {
    // 1. Estadísticas generales
    console.log('1. ESTADÍSTICAS GENERALES:');
    const stats = await prisma.$queryRaw`
      SELECT 
          COUNT(*) as total_salidas,
          COUNT(DISTINCT s.cliente_id) as total_clientes,
          COUNT(DISTINCT p.inventario_id) as total_productos,
          COUNT(DISTINCT i.categoria_id) as total_categorias,
          MIN(s.fecha_creacion) as fecha_mas_antigua,
          MAX(s.fecha_creacion) as fecha_mas_reciente,
          SUM(p.cantidad) as total_unidades_salidas
      FROM partidas_salida_inventario p
      JOIN salidas_inventario s ON p.salida_id = s.id
      JOIN "Inventario" i ON p.inventario_id = i.id
      WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
    `;
    console.log('Stats generales:', stats[0]);

    // 2. Test del query agrupado por cliente (período completo)
    console.log('\n2. TEST QUERY AGRUPADO POR CLIENTE (período completo):');
    const startTime = Date.now();
    
    const queryCliente = `
      SELECT
          s.cliente_id AS cliente_id,
          COALESCE(c.nombre, 'Sin cliente') AS cliente_nombre,
          i.clave AS producto_clave,
          i.nombre AS producto_nombre,
          COALESCE(um.nombre, um.clave, 'UND') AS unidad_medida,
          SUM(p.cantidad) AS cantidad_total
      FROM partidas_salida_inventario p
      JOIN salidas_inventario s ON p.salida_id = s.id
      JOIN "Inventario" i ON p.inventario_id = i.id
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN unidades_medida um ON i.unidad_medida_id = um.id
      WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
        AND s.fecha_creacion BETWEEN $1::timestamp AND $2::timestamp
      GROUP BY s.cliente_id, c.nombre, i.clave, i.nombre, um.nombre, um.clave
      ORDER BY s.cliente_id
    `;

    const fechaInicio = '2025-01-01T00:00:00.000Z';
    const fechaFin = '2025-12-31T23:59:59.000Z';

    const resultadosCliente = await prisma.$queryRawUnsafe(queryCliente, fechaInicio, fechaFin);
    const endTime = Date.now();
    
    console.log(`Registros devueltos: ${resultadosCliente.length}`);
    console.log(`Tiempo de ejecución: ${endTime - startTime}ms`);

    // 3. Test del query agrupado por categoría
    console.log('\n3. TEST QUERY AGRUPADO POR CATEGORÍA:');
    const startTime2 = Date.now();
    
    const queryCategoria = `
      SELECT
          COALESCE(i.categoria_id, 'sin_categoria') AS categoria_id,
          COALESCE(cat.nombre, 'Sin Categoría') AS categoria_nombre,
          i.clave AS producto_clave,
          i.nombre AS producto_nombre,
          COALESCE(um.nombre, um.clave, 'UND') AS unidad_medida,
          SUM(p.cantidad) AS cantidad_total
      FROM partidas_salida_inventario p
      JOIN salidas_inventario s ON p.salida_id = s.id
      JOIN "Inventario" i ON p.inventario_id = i.id
      LEFT JOIN categorias cat ON i.categoria_id = cat.id
      LEFT JOIN unidades_medida um ON i.unidad_medida_id = um.id
      WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
        AND s.fecha_creacion BETWEEN $1::timestamp AND $2::timestamp
      GROUP BY i.categoria_id, cat.nombre, i.clave, i.nombre, um.nombre, um.clave
      ORDER BY i.categoria_id
    `;

    const resultadosCategoria = await prisma.$queryRawUnsafe(queryCategoria, fechaInicio, fechaFin);
    const endTime2 = Date.now();
    
    console.log(`Registros devueltos: ${resultadosCategoria.length}`);
    console.log(`Tiempo de ejecución: ${endTime2 - startTime2}ms`);

    // 4. Comparar con datos de salidas sin agrupar
    console.log('\n4. COMPARACIÓN CON DATOS SIN AGRUPAR:');
    const startTime3 = Date.now();
    
    const datosCompletos = await prisma.$queryRaw`
      SELECT COUNT(*) as total_registros_sin_agrupar
      FROM partidas_salida_inventario p
      JOIN salidas_inventario s ON p.salida_id = s.id
      JOIN "Inventario" i ON p.inventario_id = i.id
      WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
        AND s.fecha_creacion BETWEEN ${fechaInicio}::timestamp AND ${fechaFin}::timestamp
    `;
    const endTime3 = Date.now();
    
    console.log(`Total registros sin agrupar: ${datosCompletos[0].total_registros_sin_agrupar}`);
    console.log(`Tiempo de ejecución: ${endTime3 - startTime3}ms`);

    // 5. Análisis por mes
    console.log('\n5. ANÁLISIS POR MES (últimos 3 meses):');
    const analisisMensual = await prisma.$queryRaw`
      SELECT 
          DATE_TRUNC('month', s.fecha_creacion) as mes,
          COUNT(*) as total_registros,
          COUNT(DISTINCT s.cliente_id) as clientes_unicos,
          COUNT(DISTINCT p.inventario_id) as productos_unicos
      FROM partidas_salida_inventario p
      JOIN salidas_inventario s ON p.salida_id = s.id
      JOIN "Inventario" i ON p.inventario_id = i.id
      WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
        AND s.fecha_creacion >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
      GROUP BY DATE_TRUNC('month', s.fecha_creacion)
      ORDER BY mes DESC
    `;
    console.log('Análisis mensual:', analisisMensual);

    // 6. Test con límite pequeño para verificar funcionalidad
    console.log('\n6. TEST CON LÍMITE PEQUEÑO:');
    const testLimitado = await prisma.$queryRawUnsafe(`${queryCliente} LIMIT 10`, fechaInicio, fechaFin);
    console.log(`Primeros 10 registros:`, testLimitado);

    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');

  } catch (error) {
    console.error('ERROR durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReporteSalidasCliente();
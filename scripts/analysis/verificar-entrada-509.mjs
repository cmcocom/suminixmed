import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO ENTRADA 509 ===\n');

    // Buscar entrada con folio 509
    const entrada = await prisma.entradas_inventario.findFirst({
      where: { folio: '509' },
      include: {
        partidas_entrada_inventario: {
          include: {
            Inventario: {
              select: { id: true, clave: true, nombre: true }
            }
          }
        }
      }
    });

    if (!entrada) {
      console.log('❌ Entrada con folio 509 no encontrada');
      return;
    }

    console.log('✅ Entrada encontrada:');
    console.log(`ID: ${entrada.id}`);
    console.log(`Folio: ${entrada.folio}`);
    console.log(`Fecha Entrada: ${entrada.fecha_entrada}`);
    console.log(`Motivo: ${entrada.motivo}`);
    console.log(`Total: $${entrada.total}`);
    console.log(`Estado: ${entrada.estado}`);
    console.log(`\n📦 Partidas (${entrada.partidas_entrada_inventario.length}):`);
    
    const partidasConClave121 = entrada.partidas_entrada_inventario.filter(
      p => p.Inventario.clave === '121'
    );

    if (partidasConClave121.length > 0) {
      console.log('\n🎯 PRODUCTO 121 ENCONTRADO:');
      partidasConClave121.forEach(p => {
        console.log(`  - Clave: ${p.Inventario.clave}`);
        console.log(`  - Nombre: ${p.Inventario.nombre}`);
        console.log(`  - Cantidad: ${p.cantidad} unidades`);
        console.log(`  - Precio: $${p.precio}`);
        console.log(`  - Inventario ID: ${p.inventario_id}`);
      });
    } else {
      console.log('\n❌ No se encontró producto con clave 121 en esta entrada');
    }

    console.log('\n📋 Todas las partidas:');
    console.table(entrada.partidas_entrada_inventario.map(p => ({
      clave: p.Inventario.clave,
      nombre: p.Inventario.nombre.substring(0, 40),
      cantidad: p.cantidad,
      precio: Number(p.precio),
      inventario_id: p.inventario_id
    })));

    // Verificar con la query del reporte
    console.log('\n=== VERIFICAR CON QUERY DEL REPORTE ===');
    const fechaEntrada = entrada.fecha_entrada;
    const fechaInicio = new Date(fechaEntrada);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaEntrada);
    fechaFin.setHours(23, 59, 59, 999);

    console.log(`Rango de fechas: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

    // Probar la query del reporte para productos en esta entrada
    const productosIds = entrada.partidas_entrada_inventario.map(p => p.inventario_id);
    
    const queryReporte = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.clave,
        i.nombre as descripcion,
        COALESCE(
          (SELECT SUM(pe.cantidad) 
           FROM partidas_entrada_inventario pe
           JOIN entradas_inventario e ON e.id = pe.entrada_id
           WHERE pe.inventario_id = i.id
           AND e.fecha_entrada BETWEEN ${fechaInicio.toISOString()}::timestamp AND ${fechaFin.toISOString()}::timestamp
          ), 0
        ) as total_entradas
      FROM "Inventario" i
      WHERE i.id = ANY(${productosIds})
      ORDER BY i.clave
    `;

    console.log('\n📊 Resultado de query del reporte:');
    console.table(queryReporte);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();

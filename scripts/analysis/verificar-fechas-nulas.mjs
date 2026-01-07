import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO FECHAS NULAS ===\n');

    // Contar entradas con fecha_entrada NULL
    const entradasNulas = await prisma.entradas_inventario.count({
      where: { fecha_entrada: null }
    });

    const entradasTotal = await prisma.entradas_inventario.count();

    console.log('📥 ENTRADAS:');
    console.log(`  Total: ${entradasTotal}`);
    console.log(`  Con fecha_entrada NULL: ${entradasNulas} (${((entradasNulas/entradasTotal)*100).toFixed(1)}%)`);
    console.log(`  Con fecha válida: ${entradasTotal - entradasNulas}`);

    // Contar salidas con fecha_salida NULL
    const salidasNulas = await prisma.salidas_inventario.count({
      where: { fecha_salida: null }
    });

    const salidasTotal = await prisma.salidas_inventario.count();

    console.log('\n📤 SALIDAS:');
    console.log(`  Total: ${salidasTotal}`);
    console.log(`  Con fecha_salida NULL: ${salidasNulas} (${((salidasNulas/salidasTotal)*100).toFixed(1)}%)`);
    console.log(`  Con fecha válida: ${salidasTotal - salidasNulas}`);

    // Mostrar algunas entradas recientes con fecha NULL
    console.log('\n=== ÚLTIMAS 5 ENTRADAS CON FECHA NULL ===');
    const ultimasEntradas = await prisma.entradas_inventario.findMany({
      where: { fecha_entrada: null },
      select: {
        id: true,
        folio: true,
        fecha_creacion: true,
        motivo: true,
        total: true,
        partidas_entrada_inventario: {
          select: {
            cantidad: true
          }
        }
      },
      orderBy: { fecha_creacion: 'desc' },
      take: 5
    });

    console.table(ultimasEntradas.map(e => ({
      folio: e.folio,
      fecha_creacion: e.fecha_creacion?.toISOString().split('T')[0],
      motivo: e.motivo,
      total: Number(e.total),
      partidas: e.partidas_entrada_inventario.length,
      unidades: e.partidas_entrada_inventario.reduce((sum, p) => sum + p.cantidad, 0)
    })));

    console.log('\n💡 SOLUCIÓN:');
    console.log('Para que el reporte funcione correctamente, las opciones son:');
    console.log('1. Usar fecha_creacion cuando fecha_entrada sea NULL');
    console.log('2. Actualizar las entradas/salidas para que tengan fecha_entrada/fecha_salida');
    console.log('3. Agregar un filtro adicional para incluir registros sin fecha');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();

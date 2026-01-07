import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  try {
    console.log('\n=== Test de integración: Consumo de lote (scripts/integration/test-lotes.mjs) ===\n');

    // 1) Buscar un lote disponible
    const lote = await p.partidas_entrada_inventario.findFirst({
      where: { cantidad_disponible: { gt: 0 } },
      orderBy: [
        { fecha_vencimiento: 'asc' },
        { createdAt: 'asc' }
      ],
      select: { id: true, numero_lote: true, fecha_vencimiento: true, cantidad_disponible: true, inventario_id: true }
    });

    if (!lote) {
      console.error('No se encontró ningún lote con cantidad_disponible > 0. Abortando test.');
      process.exit(2);
    }

    console.log('Lote escogido para la prueba:');
    console.log(JSON.stringify(lote, null, 2));

    // 2) Escoger un tipo de salida válido
    const tipo = await p.tipos_salida.findFirst({ select: { id: true } });
    if (!tipo) {
      console.error('No existe tipo de salida. Crea al menos un registro en tipos_salida.');
      process.exit(3);
    }

    // 3) Escoger un usuario válido
    const user = await p.User.findFirst({ select: { id: true } });
    if (!user) {
      console.error('No existe usuario en la tabla User. Crea al menos un usuario para la prueba.');
      process.exit(4);
    }

    const CANTIDAD = Math.min(1, lote.cantidad_disponible);

    console.log(`Intentando crear salida de prueba consumiendo cantidad: ${CANTIDAD}`);

    // 4) Ejecutar transacción: crear salida, decrementar lote, crear partida_salida, actualizar inventario
    const result = await p.$transaction(async (tx) => {
      const salida = await tx.salidas_inventario.create({
        data: {
          id: `test_salida_${Date.now()}`,
          motivo: 'Prueba automatizada lote (integration test)',
          observaciones: 'Script de integración',
          total: 0,
          estado: 'COMPLETADA',
          user_id: user.id,
          tipo_salida_id: tipo.id,
          cliente_id: null,
          serie: '',
          folio: `int-test-${Date.now()}`,
          fecha_creacion: new Date(),
          updatedAt: new Date()
        }
      });

      await tx.partidas_entrada_inventario.update({ where: { id: lote.id }, data: { cantidad_disponible: { decrement: CANTIDAD }, updatedAt: new Date() } });

      // obtener inventario para actualizar stock
      const invent = await tx.inventario.findUnique({ where: { id: lote.inventario_id }, select: { cantidad: true } });
      if (!invent) throw new Error('Inventario no encontrado durante test');

      const partida = await tx.partidas_salida_inventario.create({
        data: {
          id: `test_partida_${Date.now()}`,
          salida_id: salida.id,
          inventario_id: lote.inventario_id,
          cantidad: CANTIDAD,
          precio: 0,
          orden: 0,
          lote_entrada_id: lote.id,
          numero_lote: lote.numero_lote,
          fecha_vencimiento_lote: lote.fecha_vencimiento,
          updatedAt: new Date()
        }
      });

      await tx.inventario.update({ where: { id: lote.inventario_id }, data: { cantidad: { decrement: CANTIDAD }, updatedAt: new Date() } });

      return { salida, partida };
    });

    console.log('\nResultado de la transacción (salida + partida):');
    console.log(JSON.stringify(result, null, 2));

    // 5) Verificar efectos
    const loteAfter = await p.partidas_entrada_inventario.findUnique({ where: { id: lote.id }, select: { cantidad_disponible: true } });
    const inventAfter = await p.inventario.findUnique({ where: { id: lote.inventario_id }, select: { cantidad: true } });

    console.log('\nVerificaciones posteriores:');
    console.log('Lote after:', JSON.stringify(loteAfter, null, 2));
    console.log('Inventario after:', JSON.stringify(inventAfter, null, 2));

    console.log('\nTest completado con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR durante el test:', err);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
}

run();

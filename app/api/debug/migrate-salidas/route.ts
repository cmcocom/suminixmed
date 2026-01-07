import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 Iniciando migración de datos de salidas...');

    // Paso 1: Obtener tipos de salida disponibles
    const tipos = await prisma.tipos_salida.findMany({
      where: { activo: true },
    });

    console.log(`📋 Tipos de salida disponibles: ${tipos.length}`);
    tipos.forEach((tipo) => {
      console.log(`  - ${tipo.nombre} (${tipo.id})`);
    });

    // Paso 2: Obtener salidas sin tipo_salida_id
    const salidasSinTipo = await prisma.salidas_inventario.findMany({
      where: {
        OR: [{ tipo_salida_id: null }, { tipo_salida_id: '' }],
      },
      select: {
        id: true,
        motivo: true,
        tipo_salida_id: true,
      },
    });

    console.log(`🚨 Salidas sin tipo_salida_id: ${salidasSinTipo.length}`);

    // Paso 3: Obtener un tipo por defecto
    const tipoDefecto =
      tipos.find(
        (t) =>
          t.nombre.toLowerCase().includes('venta') ||
          t.nombre.toLowerCase().includes('salida') ||
          t.codigo.toLowerCase().includes('venta')
      ) || tipos[0]; // Si no encuentra, usa el primero

    if (!tipoDefecto) {
      throw new Error('No hay tipos de salida disponibles');
    }

    console.log(`🎯 Tipo por defecto seleccionado: ${tipoDefecto.nombre} (${tipoDefecto.id})`);

    // Paso 4: Actualizar salidas
    let actualizadas = 0;
    const updates = [];

    for (const salida of salidasSinTipo) {
      try {
        await prisma.salidas_inventario.update({
          where: { id: salida.id },
          data: {
            tipo_salida_id: tipoDefecto.id,
            // Limpiar el motivo si contiene datos concatenados
            motivo:
              salida.motivo.includes('-') && salida.motivo.includes('Cliente:')
                ? `Salida migrada`
                : salida.motivo,
          },
        });

        updates.push({
          id: salida.id,
          motivoAnterior: salida.motivo,
          tipoAsignado: tipoDefecto.nombre,
        });

        actualizadas++;
        console.log(`✅ Actualizada salida ${salida.id}`);
      } catch (error) {
        console.error(`❌ Error actualizando ${salida.id}:`, error);
      }
    }

    console.log(
      `🎉 Migración completada: ${actualizadas}/${salidasSinTipo.length} salidas actualizadas`
    );

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${actualizadas} salidas actualizadas`,
      tipoDefecto: tipoDefecto.nombre,
      updates,
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json(
      {
        error:
          'Error en migración: ' + (error instanceof Error ? error.message : 'Error desconocido'),
      },
      { status: 500 }
    );
  }
}

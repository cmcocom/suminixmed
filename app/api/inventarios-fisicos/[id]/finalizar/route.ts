/**
 * @fileoverview API para finalizar inventario físico y aplicar ajustes
 * @description POST - Finaliza inventario y aplica todos los ajustes al inventario principal
 * @date 2025-10-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST - Finalizar inventario y aplicar ajustes
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verificar que el inventario existe y está EN_PROCESO
    const inventario = await prisma.inventarios_fisicos.findUnique({
      where: { id },
      include: {
        inventarios_fisicos_detalle: {
          include: {
            Inventario: true,
          },
        },
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    if (inventario.estado !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: 'Solo se pueden finalizar inventarios EN_PROCESO' },
        { status: 400 }
      );
    }

    // Verificar que todos los productos tengan cantidad contada
    const detallesSinContar = inventario.inventarios_fisicos_detalle.filter(
      (d) => d.cantidad_contada === null
    );

    if (detallesSinContar.length > 0) {
      return NextResponse.json(
        {
          error: 'Existen productos sin contar',
          detalles: {
            total: inventario.inventarios_fisicos_detalle.length,
            sin_contar: detallesSinContar.length,
            porcentaje_completado: Math.round(
              ((inventario.inventarios_fisicos_detalle.length - detallesSinContar.length) /
                inventario.inventarios_fisicos_detalle.length) *
                100
            ),
          },
        },
        { status: 400 }
      );
    }

    // Aplicar ajustes usando transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const ajustesRealizados = [];
      const entradasCreadas = [];
      const salidasCreadas = [];

      // Procesar cada detalle con diferencia
      for (const detalle of inventario.inventarios_fisicos_detalle) {
        if (detalle.diferencia !== 0 && detalle.diferencia !== null && !detalle.ajustado) {
          // Actualizar cantidad en inventario principal
          await tx.inventario.update({
            where: { id: detalle.producto_id },
            data: {
              cantidad: detalle.cantidad_contada!,
              updatedAt: new Date(),
            },
          });

          // Crear entrada o salida según la diferencia
          if (detalle.diferencia > 0) {
            // Sobra producto - crear entrada
            const entrada = await tx.entradas_inventario.create({
              data: {
                id: `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                motivo: `Ajuste por inventario físico: ${inventario.nombre}`,
                observaciones: `Diferencia: +${detalle.diferencia} unidades`,
                total: 0,
                estado: 'COMPLETADA',
                user_id: session.user.id,
                almacen_id: inventario.almacen_id,
                updatedAt: new Date(),
              },
            });
            entradasCreadas.push(entrada);
          } else {
            // Falta producto - crear salida
            const salida = await tx.salidas_inventario.create({
              data: {
                id: `SAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                motivo: `Ajuste por inventario físico: ${inventario.nombre}`,
                observaciones: `Diferencia: ${detalle.diferencia} unidades`,
                total: 0,
                estado: 'COMPLETADA',
                user_id: session.user.id,
                almacen_id: inventario.almacen_id,
                updatedAt: new Date(),
              },
            });
            salidasCreadas.push(salida);
          }

          // Marcar detalle como ajustado
          await tx.inventarios_fisicos_detalle.update({
            where: { id: detalle.id },
            data: { ajustado: true },
          });

          ajustesRealizados.push({
            producto_id: detalle.producto_id,
            producto_nombre: detalle.Inventario.descripcion,
            cantidad_sistema: detalle.cantidad_sistema,
            cantidad_contada: detalle.cantidad_contada,
            diferencia: detalle.diferencia,
          });
        }
      }

      // Actualizar estado del inventario
      const inventarioFinalizado = await tx.inventarios_fisicos.update({
        where: { id },
        data: {
          estado: 'FINALIZADO',
          fecha_finalizacion: new Date(),
        },
      });

      return {
        inventario: inventarioFinalizado,
        ajustes_realizados: ajustesRealizados,
        resumen: {
          total_productos: inventario.inventarios_fisicos_detalle.length,
          productos_con_diferencia: ajustesRealizados.length,
          entradas_creadas: entradasCreadas.length,
          salidas_creadas: salidasCreadas.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Inventario finalizado y ajustes aplicados correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al finalizar inventario' }, { status: 500 });
  }
}

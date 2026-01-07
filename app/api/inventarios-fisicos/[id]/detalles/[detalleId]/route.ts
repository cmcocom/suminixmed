/**
 * @fileoverview API para actualizar detalle de inventario físico
 * @description PUT - Actualizar cantidad contada de un producto
 * @date 2025-10-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
    detalleId: string;
  }>;
};

// PUT - Actualizar cantidad contada
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, detalleId } = await context.params;
    const body = await request.json();
    const { cantidad_contada, observaciones } = body;

    // Validar cantidad
    if (cantidad_contada === null || cantidad_contada === undefined) {
      return NextResponse.json({ error: 'Cantidad contada es requerida' }, { status: 400 });
    }

    if (cantidad_contada < 0) {
      return NextResponse.json({ error: 'Cantidad no puede ser negativa' }, { status: 400 });
    }

    // Verificar que el inventario existe y está EN_PROCESO
    const inventario = await prisma.inventarios_fisicos.findUnique({
      where: { id },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    if (inventario.estado !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: 'Solo se pueden editar inventarios EN_PROCESO' },
        { status: 400 }
      );
    }

    // Obtener el detalle actual
    const detalleActual = await prisma.inventarios_fisicos_detalle.findUnique({
      where: { id: detalleId },
    });

    if (!detalleActual) {
      return NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 });
    }

    // Calcular diferencia
    const diferencia = cantidad_contada - detalleActual.cantidad_sistema;

    // Actualizar detalle
    const detalleActualizado = await prisma.inventarios_fisicos_detalle.update({
      where: { id: detalleId },
      data: {
        cantidad_contada,
        diferencia,
        observaciones: observaciones || null,
        updatedAt: new Date(),
      },
      include: {
        Inventario: {
          select: {
            id: true,
            descripcion: true,
            cantidad: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: detalleActualizado,
      message: 'Cantidad actualizada correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar detalle' }, { status: 500 });
  }
}

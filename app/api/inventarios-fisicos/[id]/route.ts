/**
 * @fileoverview API de Inventario Físico Individual
 * @description Endpoints para operaciones sobre un inventario específico
 * @date 2025-10-07
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Obtener un inventario específico
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const inventario = await prisma.inventarios_fisicos.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
        almacenes: {
          select: { id: true, descripcion: true },
        },
        inventarios_fisicos_detalle: {
          include: {
            Inventario: {
              select: {
                id: true,
                descripcion: true,
                categoria: true,
              },
            },
          },
        },
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: inventario });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

// DELETE - Eliminar inventario
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const inventario = await prisma.inventarios_fisicos.findUnique({
      where: { id },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    if (inventario.estado !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar inventarios en proceso' },
        { status: 400 }
      );
    }

    await prisma.inventarios_fisicos.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Inventario eliminado correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar inventario' }, { status: 500 });
  }
}

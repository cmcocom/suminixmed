/**
 * @fileoverview API de Detalles de Inventario Físico
 * @description Endpoints para gestión de detalles de productos
 * @date 2025-10-07
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Obtener detalles del inventario
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const detalles = await prisma.inventarios_fisicos_detalle.findMany({
      where: { inventario_fisico_id: id },
      include: {
        Inventario: {
          select: {
            id: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: detalles });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener detalles' }, { status: 500 });
  }
}

// POST - Crear detalles (bulk)
export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { detalles } = body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json({ error: 'Detalles requeridos' }, { status: 400 });
    }

    // Crear detalles en lote
    const result = await prisma.inventarios_fisicos_detalle.createMany({
      data: detalles,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `${result.count} detalles creados exitosamente`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear detalles' }, { status: 500 });
  }
}

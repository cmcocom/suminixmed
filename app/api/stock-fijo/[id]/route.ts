import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener producto de stock fijo específico
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fondoFijo = await prisma.ffijo.findUnique({
      where: { id_fondo: id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Inventario: {
          select: {
            id: true,
            descripcion: true,
            categoria: true,
            precio: true,
            estado: true,
          },
        },
      },
    });

    if (!fondoFijo) {
      return NextResponse.json(
        { success: false, error: 'Fondo fijo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fondoFijo,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un fondo fijo
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { cantidad_asignada, cantidad_disponible, cantidad_minima } = await request.json();

    // Validaciones
    if (cantidad_asignada === undefined) {
      return NextResponse.json(
        { success: false, error: 'El campo cantidad_asignada es requerido' },
        { status: 400 }
      );
    }

    if (typeof cantidad_asignada !== 'number' || cantidad_asignada < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La cantidad asignada debe ser un número positivo',
        },
        { status: 400 }
      );
    }

    // Verificar que el fondo fijo existe
    const fondoExiste = await prisma.ffijo.findUnique({
      where: { id_fondo: id },
    });

    if (!fondoExiste) {
      return NextResponse.json(
        { success: false, error: 'Fondo fijo no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el fondo fijo
    const fondoActualizado = await prisma.ffijo.update({
      where: { id_fondo: id },
      data: {
        cantidad_asignada,
        cantidad_disponible:
          cantidad_disponible !== undefined ? cantidad_disponible : cantidad_asignada,
        cantidad_minima:
          cantidad_minima !== undefined ? cantidad_minima : fondoExiste.cantidad_minima,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Inventario: {
          select: {
            id: true,
            descripcion: true,
            categoria: true,
            precio: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: fondoActualizado,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un fondo fijo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar que el fondo fijo existe
    const fondoExiste = await prisma.ffijo.findUnique({
      where: { id_fondo: id },
      include: {
        User: { select: { name: true } },
        Inventario: { select: { descripcion: true } },
      },
    });

    if (!fondoExiste) {
      return NextResponse.json(
        { success: false, error: 'Fondo fijo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el fondo fijo
    await prisma.ffijo.delete({
      where: { id_fondo: id },
    });

    return NextResponse.json({
      success: true,
      message: `Fondo fijo eliminado: ${fondoExiste.User.name} - ${fondoExiste.Inventario.descripcion}`,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Fondo fijo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

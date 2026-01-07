import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { codigo, nombre, descripcion, activo, orden, requiere_cliente, requiere_referencia } =
      body;

    // Await params en Next.js 15
    const { id } = await params;

    const tipo = await prisma.tipos_salida.update({
      where: {
        id, // Ya es string, no necesita parseInt
      },
      data: {
        codigo,
        nombre,
        descripcion,
        activo,
        orden,
        requiere_cliente,
        requiere_referencia,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tipo,
    });
  } catch (error) {
    console.error('Error al actualizar tipo de salida:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar tipo de salida',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Await params en Next.js 15
    const { id } = await params;

    await prisma.tipos_salida.delete({
      where: {
        id, // Ya es string, no necesita parseInt
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tipo de salida eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar tipo de salida:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar tipo de salida',
      },
      { status: 500 }
    );
  }
}

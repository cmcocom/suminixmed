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
    const { codigo, nombre, descripcion, activo, orden } = body;
    const { id } = await params;

    const tipo = await prisma.tipos_entrada.update({
      where: {
        id: id,
      },
      data: {
        codigo,
        nombre,
        descripcion,
        activo,
        orden,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tipo,
    });
  } catch (error) {
    console.error('Error al actualizar tipo de entrada:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar tipo de entrada',
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

    const { id } = await params;

    await prisma.tipos_entrada.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tipo de entrada eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar tipo de entrada:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar tipo de entrada',
      },
      { status: 500 }
    );
  }
}

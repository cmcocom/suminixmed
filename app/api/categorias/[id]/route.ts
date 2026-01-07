import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener una categoría específica
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const categoria = await prisma.categorias.findUnique({
      where: { id },
    });

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar categoría
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, descripcion, activo } = await request.json();

    // Verificar que la categoría existe
    const existingCategoria = await prisma.categorias.findUnique({
      where: { id },
    });

    if (!existingCategoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista en otra categoría
    if (nombre.trim() !== existingCategoria.nombre) {
      const duplicateCategoria = await prisma.categorias.findUnique({
        where: { nombre: nombre.trim() },
      });

      if (duplicateCategoria) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con este nombre' },
          { status: 400 }
        );
      }
    }

    const categoria = await prisma.categorias.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: activo !== undefined ? activo : existingCategoria.activo,
      },
    });

    return NextResponse.json({
      success: true,
      data: categoria,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar categoría (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la categoría existe
    const existingCategoria = await prisma.categorias.findUnique({
      where: { id },
    });

    if (!existingCategoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    // Verificar si hay productos usando esta categoría
    const productosUsandoCategoria = await prisma.inventario.count({
      where: { categoria_id: id },
    });

    if (productosUsandoCategoria > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la categoría porque ${productosUsandoCategoria} producto(s) la están usando`,
        },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inactivo
    const categoria = await prisma.categorias.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      data: categoria,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

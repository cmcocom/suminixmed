import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Obtener todas las categorías
export async function GET() {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const categorias = await prisma.categorias.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, descripcion } = await request.json();

    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista
    const existingCategoria = await prisma.categorias.findUnique({
      where: { nombre: nombre.trim() },
    });

    if (existingCategoria) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con este nombre' },
        { status: 400 }
      );
    }

    const categoria = await prisma.categorias.create({
      data: {
        id: `categoria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: categoria,
      message: 'Categoría creada exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

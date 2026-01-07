import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET: Obtener todos los fondos fijos o filtrar por usuario/producto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');
    const productoId = searchParams.get('productoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ffijoWhereInput = {};
    if (usuarioId) where.id_departamento = usuarioId;
    if (productoId) where.id_producto = productoId;

    const [fondosFijos, total] = await Promise.all([
      prisma.ffijo.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ffijo.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: fondosFijos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo fondo fijo
export async function POST(request: NextRequest) {
  try {
    const {
      id_departamento,
      id_producto,
      cantidad_asignada,
      cantidad_disponible,
      cantidad_minima,
    } = await request.json();

    // Validaciones
    if (!id_departamento || !id_producto || cantidad_asignada === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: id_departamento, id_producto, cantidad_asignada',
        },
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

    // Verificar que el usuario y producto existen
    const [usuario, producto] = await Promise.all([
      prisma.user.findUnique({ where: { id: id_departamento } }),
      prisma.inventario.findUnique({ where: { id: id_producto } }),
    ]);

    if (!usuario) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Crear el fondo fijo
    const nuevoFondo = await prisma.ffijo.create({
      data: {
        id_fondo: `ffijo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        id_departamento,
        id_producto,
        cantidad_asignada,
        cantidad_disponible: cantidad_disponible || cantidad_asignada,
        cantidad_minima: cantidad_minima || 0,
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
            categoria: true,
            precio: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevoFondo,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Error de unicidad (usuario-producto ya existe)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un fondo fijo para este usuario y producto',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

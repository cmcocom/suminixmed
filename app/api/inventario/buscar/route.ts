import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const searchMode = searchParams.get('mode') || 'clave'; // 'clave' o 'descripcion'

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        productos: [],
      });
    }

    // Construir la condición WHERE según el modo de búsqueda
    let whereClause;

    if (searchMode === 'descripcion') {
      // Búsqueda por descripción (contiene)
      whereClause = {
        descripcion: {
          contains: query,
          mode: 'insensitive' as const,
        },
      };
    } else {
      // Búsqueda por clave exacta (equals) - busca en clave o clave2
      whereClause = {
        OR: [
          {
            clave: {
              equals: query,
              mode: 'insensitive' as const,
            },
          },
          {
            clave2: {
              equals: query,
              mode: 'insensitive' as const,
            },
          },
        ],
      };
    }

    // Buscar productos según el modo
    const productos = await prisma.inventario.findMany({
      where: whereClause,
      select: {
        id: true,
        clave: true,
        clave2: true,
        descripcion: true,
        precio: true,
        cantidad: true,
        estado: true,
      },
      take: 20,
      orderBy: {
        descripcion: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      productos: productos.map((p) => ({
        id: p.id,
        clave: p.clave || p.clave2,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        cantidad: p.cantidad,
      })),
    });
  } catch (error) {
    console.error('Error buscando productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

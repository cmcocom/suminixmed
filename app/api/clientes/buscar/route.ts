import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clientes/buscar
 * Busca clientes por clave o nombre
 *
 * Query params:
 * - q: término de búsqueda (mínimo 2 caracteres)
 * - limit: número máximo de resultados (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const limitParam = searchParams.get('limit');

    // Validar que se proporcione un término de búsqueda
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere un término de búsqueda de al menos 2 caracteres',
        },
        { status: 400 }
      );
    }

    // Validar y limitar el número de resultados
    const limit = Math.min(parseInt(limitParam || '20', 10), 50);

    // Buscar clientes por clave o nombre (case-insensitive)
    // Filtramos solo clientes activos
    const clientes = await prisma.clientes.findMany({
      where: {
        activo: true,
        OR: [
          {
            clave: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            nombre: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        nombre: true,
        empresa: true,
        rfc: true,
        email: true,
        telefono: true,
        activo: true,
        clave: true,
        medico_tratante: true,
        especialidad: true,
        localidad: true,
        estado: true,
        pais: true,
      },
      take: limit,
      orderBy: [
        // Priorizar coincidencias exactas en clave
        { clave: 'asc' },
        // Luego ordenar por nombre
        { nombre: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      clientes,
      count: clientes.length,
    });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar clientes',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';

// GET - Obtener salidas agrupadas por cliente con paginación
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const clienteId = searchParams.get('clienteId');
    const categoriaId = searchParams.get('categoriaId');

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500); // Máximo 500 por página

    // Construir filtros
    const filtros: any = {};

    // Filtro de fecha - Usar fecha_creacion y zona horaria México (CST, UTC-6)
    const filtroFecha = crearFiltroFechasMexico(fechaInicio, fechaFin);
    if (filtroFecha) {
      filtros.fecha_creacion = filtroFecha;
    }

    // Filtro de cliente (opcional) - cliente_id es STRING en la DB
    if (clienteId) {
      filtros.cliente_id = clienteId;
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener total de registros con filtros
    const total = await prisma.salidas_inventario.count({
      where: filtros,
    });

    // Si hay filtro de categoría, necesitamos usar una query más compleja
    let salidas;
    if (categoriaId) {
      // Query con filtro de categoría: necesitamos filtrar por partidas
      salidas = await prisma.salidas_inventario.findMany({
        where: {
          ...filtros,
          partidas_salida_inventario: {
            some: {
              Inventario: {
                categoria_id: categoriaId,
              },
            },
          },
        },
        select: {
          id: true,
          folio: true,
          serie: true,
          fecha_creacion: true,
          cliente_id: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              clave: true,
            },
          },
          partidas_salida_inventario: {
            where: {
              Inventario: {
                categoria_id: categoriaId,
              },
            },
            select: {
              cantidad: true,
              Inventario: {
                select: {
                  clave: true,
                  nombre: true,
                  descripcion: true,
                  categoria_id: true,
                  unidades_medida: {
                    select: {
                      clave: true,
                      nombre: true,
                    },
                  },
                  categorias: {
                    select: {
                      nombre: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              orden: 'asc',
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
        skip,
        take: limit,
      });
    } else {
      // Query sin filtro de categoría (más eficiente)
      salidas = await prisma.salidas_inventario.findMany({
        where: filtros,
        select: {
          id: true,
          folio: true,
          serie: true,
          fecha_creacion: true,
          cliente_id: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              clave: true,
            },
          },
          partidas_salida_inventario: {
            select: {
              cantidad: true,
              Inventario: {
                select: {
                  clave: true,
                  nombre: true,
                  descripcion: true,
                  categoria_id: true,
                  unidades_medida: {
                    select: {
                      clave: true,
                      nombre: true,
                    },
                  },
                  categorias: {
                    select: {
                      nombre: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              orden: 'asc',
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
        skip,
        take: limit,
      });
    }

    // Transformar datos al formato requerido
    const resultado = salidas.map((salida) => ({
      folio: salida.folio || salida.serie || 'S/F',
      fecha: salida.fecha_creacion.toISOString(),
      cliente_id: salida.cliente_id,
      cliente_nombre: salida.clientes?.nombre || 'Sin cliente',
      partidas: salida.partidas_salida_inventario.map((partida) => ({
        producto_clave: partida.Inventario?.clave || 'S/C',
        producto_nombre:
          partida.Inventario?.nombre || partida.Inventario?.descripcion || 'Producto',
        unidad_medida:
          partida.Inventario?.unidades_medida?.nombre ||
          partida.Inventario?.unidades_medida?.clave ||
          'UND',
        cantidad: partida.cantidad || 0,
        producto_categoria_id: partida.Inventario?.categoria_id || null,
        producto_categoria_nombre: partida.Inventario?.categorias?.nombre || 'Sin Categoría',
      })),
    }));

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: resultado,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener salidas por cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener salidas', details: error.message },
      { status: 500 }
    );
  }
}

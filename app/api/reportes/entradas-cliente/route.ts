import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener entradas agrupadas por proveedor con paginación
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
    const proveedorId = searchParams.get('clienteId'); // Mantengo clienteId para compatibilidad con frontend
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

    // Filtro de proveedor (opcional) - proveedor_id es STRING en la DB
    if (proveedorId) {
      filtros.proveedor_id = proveedorId;
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener total de registros con filtros
    const total = await prisma.entradas_inventario.count({
      where: filtros,
    });

    // Si hay filtro de categoría, necesitamos usar una query más compleja
    let entradas;
    if (categoriaId) {
      // Query con filtro de categoría: necesitamos filtrar por partidas
      entradas = await prisma.entradas_inventario.findMany({
        where: {
          ...filtros,
          partidas_entrada_inventario: {
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
          proveedor_id: true,
          proveedores: {
            select: {
              id: true,
              nombre: true,
              rfc: true,
            },
          },
          partidas_entrada_inventario: {
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
      entradas = await prisma.entradas_inventario.findMany({
        where: filtros,
        select: {
          id: true,
          folio: true,
          serie: true,
          fecha_creacion: true,
          proveedor_id: true,
          proveedores: {
            select: {
              id: true,
              nombre: true,
              rfc: true,
            },
          },
          partidas_entrada_inventario: {
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
    const resultado = entradas.map((entrada) => ({
      folio: entrada.folio || entrada.serie || 'S/F',
      fecha: entrada.fecha_creacion.toISOString(),
      cliente_id: entrada.proveedor_id, // Mapeo para compatibilidad con frontend
      cliente_nombre: entrada.proveedores?.nombre || 'Sin proveedor',
      partidas: entrada.partidas_entrada_inventario.map((partida) => ({
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
    console.error('Error al obtener entradas por proveedor:', error);
    return NextResponse.json(
      { error: 'Error al obtener entradas', details: error.message },
      { status: 500 }
    );
  }
}

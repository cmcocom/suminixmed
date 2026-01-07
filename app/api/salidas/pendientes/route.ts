import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el usuario en la base de datos con sus roles RBAC
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        rbac_user_roles: {
          select: {
            rbac_roles: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Extraer los nombres de roles del usuario
    const userRoles = usuario.rbac_user_roles.map((ur) => ur.rbac_roles.name);

    // Solo permitir a usuarios no operadores acceder al surtido
    // Si el usuario solo tiene el rol OPERADOR, no puede acceder
    if (userRoles.length === 1 && userRoles.includes('OPERADOR')) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder al surtido' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const tipoSalida = searchParams.get('tipo_salida');
    const limite = parseInt(searchParams.get('limite') || '50');
    const pagina = parseInt(searchParams.get('pagina') || '1');

    // Construir filtros
    let filtros = {
      estado_surtido: {
        in: ['PENDIENTE', 'pendiente_surtido'],
      },
      // Solo mostrar solicitudes de tipo 'vale' y 'pendiente' que requieren surtido
      tipo_salida: {
        in: ['vale', 'pendiente'],
      } as { in: string[] } | string,
    };

    // Filtrar por tipo específico si se proporciona
    if (tipoSalida && ['vale', 'pendiente'].includes(tipoSalida)) {
      filtros = {
        ...filtros,
        tipo_salida: tipoSalida,
      };
    }

    // Obtener solicitudes pendientes con información relacionada
    const solicitudes = await prisma.salidas_inventario.findMany({
      where: filtros,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        partidas_salida_inventario: {
          include: {
            Inventario: {
              select: {
                id: true,
                descripcion: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          fecha_creacion: 'desc',
        },
        {
          tipo_salida: 'desc', // Priorizar 'pendiente' sobre 'vale'
        },
      ],
      skip: (pagina - 1) * limite,
      take: limite,
    });

    // Obtener total para paginación
    const total = await prisma.salidas_inventario.count({
      where: filtros,
    });

    // Calcular totales por tipo
    const totalesPorTipo = await prisma.salidas_inventario.groupBy({
      by: ['tipo_salida'],
      where: {
        estado_surtido: {
          in: ['PENDIENTE', 'pendiente_surtido'],
        },
        tipo_salida: {
          in: ['vale', 'pendiente'],
        },
      },
      _count: {
        id: true,
      },
    });

    const resumen = {
      total: total,
      vale: totalesPorTipo.find((t) => t.tipo_salida === 'vale')?._count.id || 0,
      pendiente: totalesPorTipo.find((t) => t.tipo_salida === 'pendiente')?._count.id || 0,
      pagina: pagina,
      limite: limite,
      totalPaginas: Math.ceil(total / limite),
    };

    return NextResponse.json({
      success: true,
      solicitudes: solicitudes,
      resumen: resumen,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

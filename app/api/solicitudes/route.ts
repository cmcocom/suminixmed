import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SalidaValidacionService } from '@/lib/services/salida-validacion.service';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener solicitudes de salida con validación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    // Construir filtros (any para permitir diferentes tipos de valores)
    const whereClause: any = {};

    if (userId) {
      whereClause.user_id = userId;
    }

    if (status) {
      whereClause.estatus = status;
    }

    const solicitudes = await prisma.salidas_inventario.findMany({
      where: whereClause,
      include: {
        partidas_salida_inventario: {
          include: {
            Inventario: {
              select: {
                descripcion: true,
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    });

    // Transformar la respuesta
    const solicitudesTransformadas = solicitudes.map((solicitud) => ({
      id: solicitud.id,
      motivo: solicitud.motivo,
      observaciones: solicitud.observaciones,
      fecha_creacion: solicitud.fecha_creacion,
      fecha_actualizacion: solicitud.updatedAt,
      usuario: solicitud.User,
      partidas:
        solicitud.partidas_salida_inventario?.map((partida) => ({
          id: partida.id,
          inventarioId: partida.inventario_id,
          nombreProducto: partida.Inventario?.descripcion,
          cantidad: partida.cantidad,
          precio: partida.precio,
          orden: partida.orden,
        })) || [],
    }));
    return NextResponse.json({
      success: true,
      data: solicitudesTransformadas,
      total: solicitudesTransformadas.length,
    });
  } catch (error) {
    console.error('[API SOLICITUDES GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud con validación de stock fijo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { motivo, observaciones, partidas } = requestBody;

    // Validaciones básicas
    if (!motivo || !partidas || partidas.length === 0) {
      return NextResponse.json(
        { error: 'Motivo y partidas son campos requeridos' },
        { status: 400 }
      );
    }

    // Transformar partidas al formato esperado por SalidaValidacionService
    const solicitudData = {
      motivo,
      observaciones: observaciones || '',
      user_id: session.user.id,
      partidas: partidas.map(
        (partida: { inventarioId: string; cantidad: number; precio?: number }) => ({
          id_producto: partida.inventarioId.toString(),
          cantidad: partida.cantidad,
          precio: partida.precio || 0,
        })
      ),
    };
    // Usar el servicio de validación para procesar la solicitud
    const resultado = await SalidaValidacionService.procesarSolicitudSalida(solicitudData);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: resultado.error || 'Error en la validación de la solicitud',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Solicitud procesada exitosamente',
      data: {
        solicitudes_generadas: resultado.solicitudes_generadas,
        validaciones: resultado.validaciones,
        resumen: {
          total_productos: resultado.validaciones.length,
          productos_completos: resultado.validaciones.filter((v) => v.resultado === 'completo')
            .length,
          productos_con_exceso: resultado.validaciones.filter((v) => v.resultado === 'exceso')
            .length,
          productos_pendientes: resultado.validaciones.filter((v) => v.resultado === 'pendiente')
            .length,
          productos_sin_fondo: resultado.validaciones.filter((v) => v.resultado === 'sin_fondo')
            .length,
        },
      },
    });
  } catch (error) {
    console.error('[API SOLICITUDES POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const solicitudId = resolvedParams.id;

    // Buscar el usuario en la base de datos
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
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

    // Solo permitir a usuarios no operadores marcar como surtido
    const isOperador = usuario.rbac_user_roles.some(
      (userRole) => userRole.rbac_roles.name === 'OPERADOR'
    );

    if (isOperador) {
      return NextResponse.json(
        { error: 'No tienes permisos para marcar como surtido' },
        { status: 403 }
      );
    }

    if (!solicitudId) {
      return NextResponse.json({ error: 'ID de solicitud requerido' }, { status: 400 });
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { observaciones = '' } = body;

    // Verificar que la solicitud existe y está pendiente de surtido
    const solicitud = await prisma.salidas_inventario.findUnique({
      where: { id: solicitudId },
      include: {
        partidas_salida_inventario: {
          include: {
            Inventario: true,
          },
        },
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (!['PENDIENTE', 'pendiente_surtido'].includes(solicitud.estado_surtido)) {
      return NextResponse.json({ error: 'La solicitud ya ha sido procesada' }, { status: 400 });
    }

    // Solo permitir marcar como surtido solicitudes tipo 'vale' y 'pendiente'
    if (!['vale', 'pendiente'].includes(solicitud.tipo_salida)) {
      return NextResponse.json(
        { error: 'Solo se pueden marcar como surtidas las solicitudes de tipo vale o pendiente' },
        { status: 400 }
      );
    }

    // Actualizar la solicitud como surtida
    const solicitudActualizada = await prisma.salidas_inventario.update({
      where: { id: solicitudId },
      data: {
        estado_surtido: 'SURTIDO',
        observaciones: observaciones
          ? `${solicitud.observaciones}\n\n--- SURTIDO ---\nSurtido por: ${usuario.name || usuario.email}\nFecha: ${new Date().toLocaleString('es-ES')}\nObservaciones: ${observaciones}`
          : `${solicitud.observaciones}\n\n--- SURTIDO ---\nSurtido por: ${usuario.name || usuario.email}\nFecha: ${new Date().toLocaleString('es-ES')}`,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
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
    });

    // Log de auditoría
    await prisma.audit_log.create({
      data: {
        table_name: 'salidas_inventario',
        record_id: solicitudId,
        action: 'SURTIDO',
        old_values: {
          estado_surtido: solicitud.estado_surtido,
        },
        new_values: {
          estado_surtido: 'SURTIDO',
          surtido_por: usuario.name || usuario.email,
          observaciones_surtido: observaciones,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud marcada como surtida exitosamente',
      solicitud: solicitudActualizada,
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

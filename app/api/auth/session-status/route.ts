import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todas las sesiones activas del usuario
    const activeSessions = await prisma.active_sessions.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    // Limpiar sesiones expiradas (más de 10 minutos sin actividad)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const expiredSessions = await prisma.active_sessions.deleteMany({
      where: {
        lastActivity: {
          lt: tenMinutesAgo,
        },
      },
    });

    // Contar sesiones activas totales en el sistema
    const totalActiveSessions = await prisma.active_sessions.count();

    // Obtener límite de usuarios de la entidad
    const entidad = await prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: {
        licencia_usuarios_max: true,
        tiempo_sesion_minutos: true,
      },
    });

    return NextResponse.json({
      userSessions: activeSessions,
      totalActiveSessions,
      maxUsers: entidad?.licencia_usuarios_max || 0,
      sessionTimeout: entidad?.tiempo_sesion_minutos || 30,
      expiredSessionsRemoved: expiredSessions.count,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

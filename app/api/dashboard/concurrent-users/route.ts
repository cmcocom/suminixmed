import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getActiveSessions } from '@/lib/sessionTracker';

interface ConcurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  sessionCount: number;
  lastActivity: string;
  tabIds: string[];
}

// GET /api/dashboard/concurrent-users - Obtener usuarios con sesiones concurrentes
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 50); // Máximo 50
    const offset = (page - 1) * limit;

    // IMPORTANTE: Limpiar sesiones expiradas ANTES de obtener las activas
    // Esto asegura que usuarios desconectados se eliminen de la lista
    await getActiveSessions(); // Esta función ya limpia automáticamente

    // Obtener todas las sesiones activas (ya limpias)
    const allSessions = await getActiveSessions();

    // Agrupar sesiones por usuario
    const userSessionsMap = new Map();

    allSessions.forEach((sessionData) => {
      const userId = sessionData.userId;
      if (!userSessionsMap.has(userId)) {
        userSessionsMap.set(userId, {
          id: userId,
          name: sessionData.User.name,
          email: sessionData.User.email,
          image: sessionData.User.image,
          sessions: [],
          tabIds: [],
          lastActivity: sessionData.lastActivity,
        });
      }

      const userSession = userSessionsMap.get(userId);
      userSession.sessions.push(sessionData);
      userSession.tabIds.push(sessionData.tabId);

      // Actualizar última actividad si es más reciente
      if (sessionData.lastActivity > userSession.lastActivity) {
        userSession.lastActivity = sessionData.lastActivity;
      }
    });

    // Convertir a array y agregar información adicional
    const concurrentUsers: ConcurrentUser[] = Array.from(userSessionsMap.values()).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      sessionCount: user.sessions.length,
      lastActivity: user.lastActivity.toISOString(),
      tabIds: user.tabIds,
    }));

    // Ordenar por última actividad
    concurrentUsers.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    // Paginación
    const total = concurrentUsers.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedUsers = concurrentUsers.slice(offset, offset + limit);

    // Obtener información de licencias desde la base de datos
    const { prisma } = await import('@/lib/prisma');
    const entidadActiva = await prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: {
        licencia_usuarios_max: true,
        tiempo_sesion_minutos: true,
      },
    });

    const maxConcurrentUsers = entidadActiva?.licencia_usuarios_max || 5;
    const sessionTimeoutMinutes = entidadActiva?.tiempo_sesion_minutos || 30;
    const currentConcurrentUsers = concurrentUsers.length;
    const availableSlots = Math.max(0, maxConcurrentUsers - currentConcurrentUsers);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        currentConcurrentUsers,
        maxConcurrentUsers,
        availableSlots,
        sessionTimeoutMinutes,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

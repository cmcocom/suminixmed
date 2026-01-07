import { randomUUID } from 'node:crypto';
import { logger } from './logger';
import { prisma } from './prisma';

async function notifySessionChange(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  userId: string,
  tabId: string | null = null
) {
  try {
    const payload = JSON.stringify({ operation, userId, tabId, timestamp: Date.now() });
    await prisma.$executeRaw`SELECT pg_notify('session_change', ${payload})`;
  } catch (error) {
    // Error no crítico, notificación SSE falló
    logger.debug('[SESSION] Notificación SSE falló:', error instanceof Error ? error.message : 'Error desconocido');
  }
}

async function getSessionTimeoutMinutesDefault(): Promise<number> {
  try {
    // Usar configuración de entidad activa si existe; fallback 35 minutos
    const entidad = await prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: { tiempo_sesion_minutos: true },
    });
    return entidad?.tiempo_sesion_minutos ?? 35;
  } catch {
    return 35;
  }
}

/**
 * Registra o actualiza una sesión activa para un usuario
 * @param userId ID del usuario
 * @param tabId ID de la pestaña/ventana del navegador
 */
export async function registerActiveSession(userId: string, tabId: string = 'default') {
  try {
    await prisma.active_sessions.upsert({
      where: {
        userId_tabId: {
          userId,
          tabId,
        },
      },
      update: {
        lastActivity: new Date(),
      },
      create: {
        id: randomUUID(),
        userId,
        tabId,
        lastActivity: new Date(),
        updatedAt: new Date(),
      },
    });

    await notifySessionChange('UPDATE', userId, tabId);
    return { success: true };
  } catch (error: unknown) {
    // Normalizar error para inspección sin imprimir objeto completo (evitar overlay ruidoso)
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStr = String(error); // Para casos donde el stack trace contiene info útil
    const lower = errMsg.toLowerCase();
    const lowerStr = errStr.toLowerCase();

    // Detectar errores de límite concurrente desde múltiples fuentes
    const isConcurrentLimit =
      errMsg.includes('CONCURRENT_LIMIT_EXCEEDED') ||
      lower.includes('límite máximo de usuarios concurrentes') ||
      lower.includes('usuarios concurrentes') ||
      lowerStr.includes('p0001') ||
      (lowerStr.includes('__turbopack__') && lowerStr.includes('upsert')) ||
      (lowerStr.includes('invalid') && lowerStr.includes('activesession.upsert')) ||
      (lowerStr.includes('connectorerror') && lowerStr.includes('límite'));

    if (isConcurrentLimit) {
      // Extraer mensaje limpio si viene del trigger de BD
      let cleanMessage =
        'Se alcanzó el límite de usuarios conectados simultáneamente. Intenta más tarde.';

      // Buscar mensaje específico del trigger en el error
      const regex = /Límite máximo de usuarios concurrentes \((\d+)\), actuales: (\d+)/i;
      const match = regex.exec(errStr);
      if (match) {
        const [, max, current] = match;
        cleanMessage = `Límite máximo de usuarios concurrentes (${max}), actuales: ${current}`;
      }

      return {
        success: false,
        error: 'CONCURRENT_LIMIT_EXCEEDED',
        message: cleanMessage,
      };
    }

    return {
      success: false,
      error: 'SESSION_REGISTRATION_ERROR',
      message: 'Error registrando sesión activa',
    };
  }
}

/**
 * Actualiza la actividad de una sesión existente
 * @param userId ID del usuario
 * @param tabId ID de la pestaña
 */
export async function updateSessionActivity(userId: string, tabId: string = 'default') {
  try {
    await prisma.active_sessions.updateMany({
      where: {
        userId,
        tabId,
      },
      data: {
        lastActivity: new Date(),
      },
    });
    await notifySessionChange('UPDATE', userId, tabId);
    return true;
  } catch (error) {
    logger.debug('[SESSION] Error actualizando actividad:', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Elimina una sesión activa
 * @param userId ID del usuario
 * @param tabId ID de la pestaña
 */
export async function removeActiveSession(userId: string, tabId: string = 'default') {
  try {
    const res = await prisma.active_sessions.deleteMany({
      where: {
        userId,
        tabId,
      },
    });
    if (res.count > 0) {
      await notifySessionChange('DELETE', userId, tabId);
    }
    return true;
  } catch (error) {
    logger.debug('[SESSION] Error eliminando sesión:', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Limpia sesiones expiradas (5 minutos o más de inactividad)
 * OPTIMIZADO: Async para no bloquear
 */
export async function cleanExpiredSessions(): Promise<number> {
  try {
    const minutes = await getSessionTimeoutMinutesDefault();
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    // Ejecutar eliminación y retornar el conteo
    const deleted = await prisma.active_sessions.deleteMany({
      where: {
        lastActivity: { lte: cutoff },
      },
    });
    
    if (deleted.count > 0) {
      await notifySessionChange('DELETE', '*', null);
    }

    return deleted.count;
  } catch (error) {
    logger.debug('[SESSION] Error limpiando sesiones expiradas:', error instanceof Error ? error.message : 'Error desconocido');
    return 0;
  }
}

/**
 * Elimina todas las sesiones de un usuario específico
 */
export async function removeAllUserSessions(userId: string) {
  try {
    const deleted = await prisma.active_sessions.deleteMany({
      where: {
        userId,
      },
    });
    if (deleted.count > 0) {
      await notifySessionChange('DELETE', userId, null);
    }
    return deleted.count;
  } catch (error) {
    logger.debug('[SESSION] Error eliminando sesiones de usuario:', error instanceof Error ? error.message : 'Error desconocido');
    return 0;
  }
}

/**
 * Obtiene todas las sesiones activas con información del usuario
 */
export async function getActiveSessions() {
  try {
    // Primero limpiar sesiones expiradas
    await cleanExpiredSessions();

    // Obtener sesiones activas
    const sessions = await prisma.active_sessions.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return sessions;
  } catch (error) {
    logger.debug('[SESSION] Error obteniendo sesiones activas:', error instanceof Error ? error.message : 'Error desconocido');
    return [];
  }
}

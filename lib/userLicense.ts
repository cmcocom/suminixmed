import { prisma } from './prisma';

// TEMPORALMENTE COMENTADO - Interfaz para validación de sesiones concurrentes
/*
interface ValidationResult {
  canLogin: boolean;
  message: string;
  code: string;
  userHasSession?: boolean;
  maxConcurrentUsers?: number;
  currentConcurrentUsers?: number;
  availableSlots?: number;
}
*/

// CACHE para get_license_stats (5 segundos)
let licenseStatsCache: {
  data: Array<{
    max_concurrent_users: number;
    current_concurrent_users: bigint;
    available_slots: number;
    is_within_limit: boolean;
  }> | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 5000; // 5 segundos

/**
 * Valida si un usuario puede iniciar sesión usando validación de base de datos
 * OPTIMIZADO: Combina queries y usa cache
 */
export async function validateUserLogin(userId: string) {
  try {
    // OPTIMIZACIÓN: Single query con toda la info necesaria
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        activo: true,
        active_sessions: {
          where: {
            lastActivity: {
              gte: new Date(Date.now() - 35 * 60 * 1000),
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        canLogin: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      };
    }

    if (!user.activo) {
      return {
        canLogin: false,
        message: 'Tu cuenta está desactivada. Contacta al administrador para reactivarla.',
        code: 'USER_INACTIVE',
      };
    }

    // CACHE restaurado - usar cache normal
    const now = Date.now();
    let stats;

    if (licenseStatsCache.data && now - licenseStatsCache.timestamp < CACHE_TTL) {
      stats = licenseStatsCache.data[0];
    } else {
      const licenseStats = (await prisma.$queryRaw`SELECT * FROM get_license_stats()`) as Array<{
        max_concurrent_users: number;
        current_concurrent_users: bigint;
        available_slots: number;
        is_within_limit: boolean;
      }>;
      licenseStatsCache = { data: licenseStats, timestamp: now };
      stats = licenseStats[0];
    }

    // Si no hay entidades activas configuradas, permitir acceso ilimitado
    if (stats?.max_concurrent_users === null) {
      // Sin límite configurado
    } else if (stats && !stats.is_within_limit) {
      // Si el usuario NO tiene sesión activa y se excede el límite, denegar login
      if (user.active_sessions.length === 0) {
        return {
          canLogin: false,
          message: `Se alcanzó el límite de usuarios conectados simultáneamente. Intenta más tarde.`,
          code: 'CONCURRENT_LIMIT_EXCEEDED',
        };
      }
    }

    return {
      canLogin: true,
      message: 'Login autorizado',
      user: user,
      code: 'SUCCESS',
    };
  } catch (error) {
    return {
      canLogin: false,
      message: 'Error interno del sistema. Intenta nuevamente.',
      code: 'SYSTEM_ERROR',
    };
  }
}

/**
 * Obtiene información sobre la licencia de sesiones concurrentes usando función de base de datos
 * @returns {Promise<{maxConcurrentUsers: number, currentConcurrentUsers: number, availableSlots: number, totalActiveUsers: number}>}
 */
export async function getUserLicenseInfo() {
  try {
    // Usar función de base de datos get_license_stats() (NO get_license_info)
    const licenseResult = (await prisma.$queryRaw`
      SELECT * FROM get_license_stats();
    `) as Array<{
      max_concurrent_users: number;
      current_concurrent_users: bigint;
      available_slots: number;
      is_within_limit: boolean;
    }>;

    const licenseStats = licenseResult[0];

    if (!licenseStats) {
      return {
        maxConcurrentUsers: 0,
        currentConcurrentUsers: 0,
        availableSlots: 0,
        totalActiveUsers: 0,
      };
    }

    // Obtener timeout de sesión desde entidad activa
    const entidad = await prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: { tiempo_sesion_minutos: true },
    });

    return {
      maxConcurrentUsers: licenseStats.max_concurrent_users,
      currentConcurrentUsers: Number(licenseStats.current_concurrent_users),
      availableSlots: licenseStats.available_slots,
      totalActiveUsers: Number(licenseStats.current_concurrent_users),
      sessionTimeoutMinutes: entidad?.tiempo_sesion_minutos || 30,
    };
  } catch (error) {
    return {
      maxConcurrentUsers: 0,
      currentConcurrentUsers: 0,
      availableSlots: 0,
      totalActiveUsers: 0,
    };
  }
}

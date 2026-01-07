/**
 * 🔧 MEJORA: Sistema de Tracking de Cierres de Sesión
 *
 * Este servicio registra y analiza las razones de cierre de sesión
 * para identificar false positives y mejorar la experiencia del usuario.
 *
 * Funcionalidades:
 * - Registrar razones de cierre en BD
 * - Analizar patrones de false positives
 * - Generar reportes de uso
 * - Detectar comportamientos anómalos
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import SessionFingerprintGenerator from '@/lib/session-fingerprint';

/**
 * Tipos de razón de cierre de sesión
 */
export enum SessionCloseReason {
  MANUAL = 'manual', // Usuario cerró sesión manualmente
  INACTIVITY = 'inactivity', // Sesión expiró por inactividad
  OTHER_DEVICE = 'other_device', // Nueva sesión en otro dispositivo
  SYSTEM_RESTART = 'system_restart', // Reinicio del sistema detectado
  NETWORK_ERROR = 'network_error', // Error de red/conexión
  FORCED = 'forced', // Cierre forzado por administrador
  UNKNOWN = 'unknown', // Razón desconocida
}

/**
 * Datos contextuales adicionales para el cierre
 */
interface SessionCloseContext {
  inactivityMinutes?: number; // Minutos de inactividad antes del cierre
  lastHeartbeat?: Date; // Último heartbeat recibido
  userInitiated?: boolean; // Si fue iniciado por el usuario
  errorMessage?: string; // Mensaje de error si aplica
  browserCrash?: boolean; // Si se detectó crash del navegador
  rapidReconnect?: boolean; // Si hubo reconexión rápida (< 1 min)
}

/**
 * Datos completos para registrar cierre de sesión
 */
interface SessionCloseData {
  sessionId?: string; // ID de la sesión activa (puede ser null)
  userId: string; // Usuario (requerido)
  tabId?: string; // ID de la pestaña
  reason: SessionCloseReason; // Razón principal
  subReason?: string; // Razón específica adicional
  context?: SessionCloseContext; // Datos contextuales
  userAgent?: string; // User agent del navegador
  ipAddress?: string; // IP del cliente
  deviceFingerprint?: string; // Fingerprint del dispositivo
}

/**
 * Servicio principal de tracking de cierres
 */
export class SessionCloseTracker {
  /**
   * Registra un cierre de sesión en la base de datos
   */
  static async recordSessionClose(data: SessionCloseData): Promise<void> {
    try {
      // Generar fingerprint si no se proporciona
      let fingerprint = data.deviceFingerprint;
      if (!fingerprint && typeof window !== 'undefined') {
        try {
          fingerprint = await SessionFingerprintGenerator.generateFingerprint();
        } catch (error) {
          logger.warn('[SESSION-CLOSE] Error generando fingerprint', { error });
        }
      }

      // Crear registro en BD
      await prisma.session_close_reasons.create({
        data: {
          session_id: data.sessionId || null,
          user_id: data.userId,
          tab_id: data.tabId || null,
          reason: data.reason,
          sub_reason: data.subReason || null,
          device_fingerprint: fingerprint || null,
          user_agent: data.userAgent || null,
          ip_address: data.ipAddress || null,
          timestamp: new Date(),
          is_false_positive: false, // Por defecto no es false positive
          notes: data.context ? JSON.stringify(data.context) : null,
        },
      });

      logger.debug(`✅ [SESSION-CLOSE] Registrado cierre: ${data.reason}`, {
        userId: data.userId,
        reason: data.reason,
        sessionId: data.sessionId,
      });
    } catch (error) {
      // Detectar error de columna inexistente (P2022) y dar instrucción clara
      const errCode = (error as any)?.code;
      if (errCode === 'P2022') {
        logger.error(
          '[SESSION-CLOSE] Error registrando cierre de sesión - columna no existe en BD (P2022). Asegúrese de que el esquema Prisma y la base de datos estén sincronizados. Ejecutar: `npx prisma generate` y aplicar migraciones: `npx prisma migrate deploy`',
          { error, userId: data.userId, reason: data.reason }
        );
        return;
      }

      logger.error('[SESSION-CLOSE] Error registrando cierre de sesión', error, {
        userId: data.userId,
        reason: data.reason,
      });
    }
  }

  /**
   * 🔧 MEJORA: Registra cierre manual desde el modal de logout
   */
  static async recordManualLogout(userId: string, tabId?: string): Promise<void> {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    await this.recordSessionClose({
      userId,
      tabId,
      reason: SessionCloseReason.MANUAL,
      subReason: 'user_clicked_logout',
      context: {
        userInitiated: true,
        rapidReconnect: false,
      },
      userAgent,
    });
  }

  /**
   * 🔧 MEJORA: Registra cierre por inactividad
   */
  static async recordInactivityLogout(
    userId: string,
    inactivityMinutes: number,
    sessionId?: string
  ): Promise<void> {
    await this.recordSessionClose({
      userId,
      sessionId,
      reason: SessionCloseReason.INACTIVITY,
      subReason: `inactive_${inactivityMinutes}_minutes`,
      context: {
        inactivityMinutes,
        userInitiated: false,
      },
    });
  }

  /**
   * 🔧 MEJORA: Registra cierre por otra sesión (con análisis de false positive)
   */
  static async recordOtherDeviceLogout(
    userId: string,
    sessionId?: string,
    tabId?: string
  ): Promise<void> {
    let fingerprint: string | undefined;
    let isLikelyFalsePositive = false;

    // Analizar si puede ser false positive
    try {
      fingerprint = await SessionFingerprintGenerator.generateFingerprint();

      // Verificar si es reconexión rápida del mismo dispositivo
      const wasRecentManualLogout = SessionFingerprintGenerator.wasRecentManualLogout(60000); // 1 minuto
      const isSameDevice = await SessionFingerprintGenerator.isSameDevice();
      const isRecentFingerprint = SessionFingerprintGenerator.isFingerprintRecent(300000); // 5 minutos

      isLikelyFalsePositive = wasRecentManualLogout || (isSameDevice && isRecentFingerprint);
    } catch (error) {
      logger.warn('[SESSION-CLOSE] Error analizando false positive', { error });
    }

    await this.recordSessionClose({
      userId,
      sessionId,
      tabId,
      reason: isLikelyFalsePositive
        ? SessionCloseReason.SYSTEM_RESTART
        : SessionCloseReason.OTHER_DEVICE,
      subReason: isLikelyFalsePositive ? 'probable_reconnection' : 'genuine_other_device',
      context: {
        rapidReconnect: isLikelyFalsePositive,
        userInitiated: false,
      },
      deviceFingerprint: fingerprint,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });

    // Si es probable false positive, loguear para análisis
    if (isLikelyFalsePositive) {
      logger.info('🔍 [SESSION-CLOSE] Posible false positive detectado', {
        userId,
        sessionId,
        reason: 'Reconexión rápida del mismo dispositivo detectada',
      });
    }
  }

  /**
   * 🔧 MEJORA: Análisis de patrones de false positives
   */
  static async analyzeFalsePositives(userId?: string, days: number = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const whereClause = {
        timestamp: { gte: since },
        reason: { in: [SessionCloseReason.OTHER_DEVICE, SessionCloseReason.SYSTEM_RESTART] },
        ...(userId && { user_id: userId }),
      };

      const recentCloses = await prisma.session_close_reasons.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        include: {
          User: {
            select: {
              clave: true,
              name: true,
            },
          },
        },
      });

      // Analizar patrones
      const analysis = {
        totalCloses: recentCloses.length,
        probableFalsePositives: recentCloses.filter(
          (close: any) =>
            close.sub_reason?.includes('probable_reconnection') ||
            close.reason === SessionCloseReason.SYSTEM_RESTART
        ).length,
        genuineOtherDevice: recentCloses.filter(
          (close: any) =>
            close.reason === SessionCloseReason.OTHER_DEVICE &&
            close.sub_reason === 'genuine_other_device'
        ).length,
        byUser: {} as Record<string, number>,
      };

      // Contar por usuario
      recentCloses.forEach((close: any) => {
        const userKey = close.User?.clave || close.user_id;
        analysis.byUser[userKey] = (analysis.byUser[userKey] || 0) + 1;
      });

      logger.info('📊 [SESSION-CLOSE] Análisis de false positives', {
        period: `${days} días`,
        analysis,
        falsePositiveRate:
          analysis.totalCloses > 0
            ? `${Math.round((analysis.probableFalsePositives / analysis.totalCloses) * 100)}%`
            : '0%',
      });

      return analysis;
    } catch (error) {
      const errCode = (error as any)?.code;
      if (errCode === 'P2022') {
        logger.error(
          '[SESSION-CLOSE] Error analizando false positives - columna no existe en BD (P2022). Verificar esquema y ejecutar `npx prisma generate` / `npx prisma migrate deploy`.',
          { error }
        );
        return null;
      }

      logger.error('[SESSION-CLOSE] Error analizando false positives', error);
      return null;
    }
  }

  /**
   * 🔧 MEJORA: Marcar manualmente como false positive
   */
  static async markAsFalsePositive(closeId: string, notes?: string): Promise<void> {
    try {
      await prisma.session_close_reasons.update({
        where: { id: closeId },
        data: {
          is_false_positive: true,
          notes: notes || 'Marcado manualmente como false positive',
        },
      });

      logger.info('✅ [SESSION-CLOSE] Marcado como false positive', { closeId, notes });
    } catch (error) {
      const errCode = (error as any)?.code;
      if (errCode === 'P2022') {
        logger.error(
          '[SESSION-CLOSE] Error marcando false positive - columna no existe en BD (P2022). Verificar esquema y generar cliente Prisma: `npx prisma generate`.',
          { error, closeId }
        );
        return;
      }

      logger.error('[SESSION-CLOSE] Error marcando false positive', error, { closeId });
    }
  }

  /**
   * 🔧 MEJORA: Obtener estadísticas de cierre por usuario
   */
  static async getUserCloseStats(userId: string, days: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const closes = await prisma.session_close_reasons.findMany({
        where: {
          user_id: userId,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
      });

      const stats = {
        total: closes.length,
        byReason: {} as Record<string, number>,
        falsePositives: closes.filter((c: any) => c.is_false_positive).length,
        mostRecentClose: closes[0]?.timestamp || null,
      };

      closes.forEach((close: any) => {
        stats.byReason[close.reason] = (stats.byReason[close.reason] || 0) + 1;
      });

      return stats;
    } catch (error) {
      const errCode = (error as any)?.code;
      if (errCode === 'P2022') {
        logger.error(
          '[SESSION-CLOSE] Error obteniendo estadísticas de usuario - columna no existe en BD (P2022). Ejecutar `npx prisma generate` / `npx prisma migrate deploy`.',
          { error, userId }
        );
        return null;
      }

      logger.error('[SESSION-CLOSE] Error obteniendo estadísticas de usuario', error, { userId });
      return null;
    }
  }
}

/**
 * 🔧 MEJORA: Hook para usar el tracking en componentes React
 */
export function useSessionCloseTracking() {
  const recordManualLogout = async (userId: string, tabId?: string) => {
    await SessionCloseTracker.recordManualLogout(userId, tabId);
  };

  const recordOtherDeviceLogout = async (userId: string, sessionId?: string, tabId?: string) => {
    await SessionCloseTracker.recordOtherDeviceLogout(userId, sessionId, tabId);
  };

  const markAsFalsePositive = async (closeId: string, notes?: string) => {
    await SessionCloseTracker.markAsFalsePositive(closeId, notes);
  };

  return {
    recordManualLogout,
    recordOtherDeviceLogout,
    markAsFalsePositive,
  };
}

/**
 * 🔧 MEJORA: Obtiene el mensaje contextual apropiado para mostrar en login
 */
export async function getContextualLoginMessage(userId?: string): Promise<string | null> {
  if (!userId) return null;

  try {
    // Buscar el cierre más reciente del usuario (últimas 24 horas)
    const recentClose = await prisma.session_close_reasons.findFirst({
      where: {
        user_id: userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!recentClose) return null;

    // Determinar mensaje basado en la razón del cierre
    const minutesSinceClose = Math.round(
      (Date.now() - recentClose.timestamp.getTime()) / (1000 * 60)
    );

    // Solo mostrar mensaje si fue reciente (menos de 30 minutos)
    if (minutesSinceClose > 30) return null;

    switch (recentClose.reason) {
      case SessionCloseReason.MANUAL:
        // No mostrar mensaje para cierres manuales
        return null;

      case SessionCloseReason.INACTIVITY:
        return 'session_expired';

      case SessionCloseReason.OTHER_DEVICE:
        if (recentClose.sub_reason === 'probable_reconnection') {
          return 'session_system_restart';
        }
        return 'session_closed_other_device';

      case SessionCloseReason.SYSTEM_RESTART:
        return 'session_system_restart';

      case SessionCloseReason.NETWORK_ERROR:
        return 'session_network_error';

      case SessionCloseReason.FORCED:
        return 'session_forced_logout';

      default:
        return null;
    }
  } catch (error) {
    logger.warn('[SESSION-CLOSE] Error obteniendo mensaje contextual', { error, userId });
    return null;
  }
}

export default SessionCloseTracker;

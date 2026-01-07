/**
 * 🔧 MEJORA: Tipos compartidos para el sistema de tracking de cierres
 *
 * Este archivo contiene solo tipos e interfaces sin dependencias de servidor
 * para poder ser usado tanto en cliente como servidor sin importar Prisma.
 */

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
export interface SessionCloseContext {
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
export interface SessionCloseData {
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
 * Funciones helper para el cliente (sin dependencias de servidor)
 */
export class SessionCloseClientHelper {
  /**
   * 🔧 MEJORA: Registra cierre manual (solo hace fetch al servidor)
   */
  static async recordManualLogout(userId: string, tabId?: string): Promise<void> {
    try {
      await fetch('/api/session/close-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'manual-logout',
          userId,
          tabId,
          reason: SessionCloseReason.MANUAL,
          subReason: 'user_clicked_logout',
          context: {
            userInitiated: true,
            rapidReconnect: false,
          },
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });
    } catch (error) {
      console.warn('[SESSION-CLOSE-CLIENT] Error registrando logout manual:', error);
      // No bloquear el proceso si hay error
    }
  }

  /**
   * 🔧 MEJORA: Registra cierre por otro dispositivo (solo hace fetch al servidor)
   */
  static async recordOtherDeviceLogout(
    userId: string,
    sessionId?: string,
    tabId?: string
  ): Promise<void> {
    try {
      await fetch('/api/session/close-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'other-device-logout',
          userId,
          sessionId,
          tabId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });
    } catch (error) {
      console.warn('[SESSION-CLOSE-CLIENT] Error registrando logout por otro dispositivo:', error);
      // No bloquear el proceso si hay error
    }
  }
}

export default SessionCloseClientHelper;

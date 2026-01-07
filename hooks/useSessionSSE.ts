import { logger } from '@/lib/logger';
import { SessionCloseClientHelper } from '@/lib/session-close-client';
import SessionFingerprintGenerator from '@/lib/session-fingerprint';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SessionNotification {
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string;
  tabId: string;
  timestamp: number;
}

/**
 * 🔧 MEJORA: Verificar múltiples indicadores de cierre manual
 */
async function checkMultipleLogoutIndicators(): Promise<boolean> {
  // 1. Verificar sessionStorage (método original mejorado)
  try {
    const manualLogout = sessionStorage.getItem('manual-logout');
    if (manualLogout) {
      const logoutTime = parseInt(manualLogout, 10);
      // 🔧 MEJORA: Ampliar ventana de 2s a 10s
      if (Date.now() - logoutTime < 10000) {
        logger.debug('✅ [SSE] Logout manual detectado por sessionStorage');
        sessionStorage.removeItem('manual-logout');
        return true;
      }
      sessionStorage.removeItem('manual-logout'); // Limpiar si es muy viejo
    }
  } catch (error) {
    logger.warn('[SSE] Error verificando sessionStorage', { error });
  }

  // 2. 🔧 MEJORA: Verificar localStorage como backup
  try {
    const lastManualLogout = localStorage.getItem('last-manual-logout');
    if (lastManualLogout) {
      const logoutTime = parseInt(lastManualLogout, 10);
      // Ventana más amplia para localStorage (1 minuto)
      if (Date.now() - logoutTime < 60000) {
        logger.debug('✅ [SSE] Logout manual detectado por localStorage');
        localStorage.removeItem('last-manual-logout');
        return true;
      }
      localStorage.removeItem('last-manual-logout'); // Limpiar si es muy viejo
    }
  } catch (error) {
    logger.warn('[SSE] Error verificando localStorage', { error });
  }

  return false;
}

/**
 * 🔧 MEJORA: Verificar si es reconexión del mismo dispositivo
 */
async function checkSameDeviceReconnect(): Promise<boolean> {
  try {
    // Verificar si el fingerprint guardado es reciente (último minuto)
    const isRecentFingerprint = SessionFingerprintGenerator.isFingerprintRecent(60000); // 1 minuto
    if (!isRecentFingerprint) {
      return false;
    }

    // Verificar si es el mismo dispositivo
    const isSameDevice = await SessionFingerprintGenerator.isSameDevice();
    if (isSameDevice) {
      logger.debug('✅ [SSE] Reconexión del mismo dispositivo detectada');
      return true;
    }
  } catch (error) {
    logger.warn('[SSE] Error verificando fingerprint de dispositivo', { error });
  }

  return false;
}

export function useSessionSSE() {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  // Ventana de supresión por pestaña para evitar cerrar la pestaña recién autenticada
  const suppressUntilRef = useRef<number>(0);

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      logger.debug('🔌 [SSE] Desconectando del stream de eventos');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleSessionInvalidated = useCallback(async () => {
    // 🔧 MEJORA: Verificación múltiple de indicadores de cierre manual
    const isManualLogout = await checkMultipleLogoutIndicators();

    // 🔧 MEJORA: Verificar si es reconexión del mismo dispositivo
    const isSameDeviceReconnect = await checkSameDeviceReconnect();

    // Solo mostrar notificación si es genuinamente otra sesión
    const shouldShowNotification = !isManualLogout && !isSameDeviceReconnect;

    // 🔧 MEJORA: Registrar cierre por otro dispositivo en BD para tracking
    const userId = (session?.user as any)?.id;
    if (userId) {
      try {
        const sessionId = sessionStorage.getItem('session-id') || undefined;
        const tabId = sessionStorage.getItem('tab-id') || undefined;
        await SessionCloseClientHelper.recordOtherDeviceLogout(userId, sessionId, tabId);
      } catch (trackingError) {
        logger.warn('[SSE] Error registrando tracking de cierre', { error: trackingError });
        // No bloquear el proceso si hay error en tracking
      }
    }

    if (shouldShowNotification) {
      logger.warn('🚨 [SSE] Sesión invalidada por otro navegador - cerrando automáticamente');

      if (isClient && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Sesión cerrada', {
          body: 'Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo.',
          icon: '/favicon.ico',
        });
      }
    } else {
      const reason = isManualLogout ? 'manual' : 'reconexión del mismo dispositivo';
      logger.debug(`✅ [SSE] Cierre detectado como ${reason} - sin notificación`);
    }

    // Desconectar SSE para evitar loops
    disconnect();

    // Intentar signOut rápidamente, pero no bloquear el redirect
    try {
      await Promise.race([
        signOut({ redirect: false }),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);
    } catch {
      // ignorar
    }

    // Redirigir según el tipo de cierre
    if (isManualLogout) {
      window.location.replace('/login');
    } else if (isSameDeviceReconnect) {
      // Reconexión del mismo dispositivo - mensaje neutral
      window.location.replace('/login?message=session_reconnect');
    } else {
      window.location.replace('/login?message=session_closed_other_browser');
    }
  }, [isClient, disconnect, session?.user]);

  const connectToSSE = useCallback(() => {
    // Solo conectar si estamos en el cliente y hay sesión
    if (!isClient || !session?.user?.email) return;

    // Obtener ID del usuario de forma segura

    const userId = (session.user as any)?.id;
    if (!userId) return;

    logger.debug('🔌 [SSE] Conectando a stream de eventos de sesión...');

    try {
      // Evitar crear múltiples EventSource si ya existe uno
      if (eventSourceRef.current) {
        logger.debug('🔌 [SSE] EventSource ya existe, omitiendo nueva conexión');
        return;
      }
      const eventSource = new EventSource('/api/sse/session-events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        logger.debug('✅ [SSE] Conectado al stream de eventos');
        reconnectAttemptsRef.current = 0;
      };

      // Batching/coalescing de eventos entrantes para evitar ruidos repetidos
      const pendingEventsRef = { current: new Map<string, SessionNotification>() } as {
        current: Map<string, SessionNotification>;
      };
      let batchTimer: number | null = null;

      const scheduleBatchProcess = () => {
        if (batchTimer !== null) return;
        batchTimer = window.setTimeout(() => {
          try {
            const events = Array.from(pendingEventsRef.current.values());
            pendingEventsRef.current.clear();
            logger.debug('[SSE] Procesando lote de eventos:', { count: events.length });
            for (const notification of events) {
              // Ignorar heartbeats (siempre deberían filtrarse antes)
              if ((notification as any).type === 'heartbeat') continue;

              if (notification.operation === 'DELETE' && notification.userId === userId) {
                // Si estamos dentro de la ventana de supresión posterior a login, ignorar
                if (Date.now() < suppressUntilRef.current) {
                  logger.debug('⏭️ [SSE] Ignorando DELETE por limpieza post-login');
                  continue;
                }

                logger.debug('🔄 [SSE] Sesión eliminada para nuestro usuario - validando...');
                void handleSessionInvalidated();
                // No necesitamos procesar más notificaciones de este lote tras invalidación
                break;
              }
            }
          } catch (e) {
            logger.error('❌ [SSE] Error procesando lote de eventos:', e);
          } finally {
            batchTimer = null;
          }
        }, 200); // agrupar eventos dentro de 200ms
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Ignorar heartbeats
          if (data.type === 'heartbeat') {
            return;
          }

          // Encolar la última notificación por clave única (userId:tabId:operation)
          const notification: SessionNotification = data;
          const key = `${notification.operation}:${notification.userId}:${notification.tabId}`;
          pendingEventsRef.current.set(key, notification);
          scheduleBatchProcess();
        } catch (error) {
          logger.error('❌ [SSE] Error parseando evento:', error);
        }
      };

      eventSource.onerror = () => {
        // El EventSource.onerror no proporciona detalles útiles, solo indica que la conexión falló
        const currentState = eventSource.readyState;
        const stateText =
          currentState === EventSource.CONNECTING
            ? 'Reconectando'
            : currentState === EventSource.CLOSED
              ? 'Cerrada'
              : 'Abierta';

        // Solo loguear si no estamos en proceso de reconexión normal
        if (currentState === EventSource.CLOSED) {
          logger.warn(`⚠️ [SSE] Conexión cerrada (estado: ${stateText})`);
        }

        eventSource.close();

        // Intentar reconectar con backoff exponencial
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          logger.debug(
            `🔄 [SSE] Reintentando conexión en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectToSSE();
          }, delay);
        } else {
          // Cambiar a warning en lugar de error para no alarmar
          logger.warn('⚠️ [SSE] Máximo de intentos de reconexión alcanzado. Continuando sin SSE.');
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('❌ [SSE] Error creando EventSource:', errorMessage);

      // Si hay error al crear el EventSource, intentar reconectar después de un delay
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = 5000; // 5 segundos para errores de creación
        logger.debug(`🔄 [SSE] Reintentando después de error de creación en ${delay}ms...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectToSSE();
        }, delay);
      }
    }
  }, [isClient, session?.user, handleSessionInvalidated]);

  useEffect(() => {
    // Solo ejecutar si estamos en el cliente
    if (!isClient) return;

    if (session?.user?.email) {
      // Activar supresión solo si esta pestaña acaba de iniciar sesión
      try {
        const ts = sessionStorage.getItem('just-logged-in');
        if (ts) {
          const t = parseInt(ts, 10) || Date.now();
          // 4s para cubrir limpieza y propagación
          suppressUntilRef.current = t + 4000;
          // limpiar bandera para no afectar futuro
          sessionStorage.removeItem('just-logged-in');
        }
      } catch {}
      // Solicitar permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      connectToSSE();
    } else {
      disconnect();
    }

    // Cleanup al desmontar
    return () => {
      disconnect();
    };
  }, [isClient, session?.user?.email, connectToSSE, disconnect]);

  // Limpiar al cambiar de pestaña o cerrar
  useEffect(() => {
    // Solo ejecutar si estamos en el cliente
    if (!isClient) return;

    const handleBeforeUnload = () => {
      disconnect();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect();
      } else if (session?.user?.email) {
        connectToSSE();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, session?.user?.email, connectToSSE, disconnect]);

  return {
    isConnected: isClient && eventSourceRef.current?.readyState === EventSource.OPEN,
    disconnect,
  };
}

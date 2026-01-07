'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import apiFetch from '@/lib/fetcher';

/**
 * Hook para gestionar el tracking de sesiones activas
 */
export function useSessionTracker() {
  const { data: session } = useSession();
  const tabIdRef = useRef<string | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!(session?.user as any)?.id) return;

    // Generar un ID único para esta pestaña
    if (!tabIdRef.current) {
      tabIdRef.current = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const userId = (session?.user as any)?.id;
    const tabId = tabIdRef.current;

    // Función para registrar/actualizar sesión
    const updateSession = async () => {
      try {
        const response = await apiFetch('/api/auth/update-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tabId,
            action: 'update',
          }),
        });

        if (response.status === 409) {
          // Conflicto por límite de concurrencia u otro bloqueo de sesión
          window.location.replace('/login?message=concurrent_limit_exceeded');
          return;
        }

        if (response.ok) {
          // Notificar a otras pestañas sobre la actualización
          localStorage.setItem('session-updated', `${userId}-${tabId}-${Date.now()}`);
        }
      } catch (error) {
        logger.error('Error actualizando sesión:', error);
      }
    };

    // Función para eliminar sesión
    const removeSession = async () => {
      try {
        await apiFetch('/api/auth/update-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tabId,
            action: 'remove',
          }),
        });

        // Notificar a otras pestañas sobre el cambio
        localStorage.setItem('session-removed', `${userId}-${tabId}-${Date.now()}`);
      } catch (error) {
        logger.error('Error eliminando sesión:', error);
      }
    };

    // Registrar sesión inicial
    updateSession();

    // Actualizar cada 1 minuto (más frecuente para mejor detección)
    intervalRef.current = setInterval(updateSession, 1 * 60 * 1000);

    // Cleanup al cerrar pestaña
    const handleBeforeUnload = () => {
      // Usar navigator.sendBeacon para mayor confiabilidad en el cierre
      const data = JSON.stringify({
        userId,
        tabId,
        action: 'remove',
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/auth/update-session', data);
      } else {
        // Fallback para navegadores que no soportan sendBeacon
        apiFetch('/api/auth/update-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
          keepalive: true,
        }).catch((err) => logger.error('Error sendBeacon fallback:', err));
      }

      // Notificar inmediatamente a otras pestañas
      localStorage.setItem('session-removed', `${userId}-${tabId}-${Date.now()}`);
    };

    // Cleanup cuando la pestaña pierde el foco por mucho tiempo
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Al volver a la pestaña, actualizar sesión
        updateSession();
      }
    };

    // Detectar cuando el usuario se va y vuelve
    const handleFocus = () => {
      updateSession();
    };

    const handleBlur = () => {
      // Solo actualizamos, no removemos en blur
      // La limpieza se hace por timeout
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      // Remover sesión al desmontar el componente
      removeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session?.user as any)?.id]);

  return {
    tabId: tabIdRef.current,
    isTracking: !!(session?.user as any)?.id,
  };
}

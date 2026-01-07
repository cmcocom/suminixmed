/**
 * Hook para detectar cuando una sesión se ha cerrado desde otro dispositivo
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import apiFetch from '@/lib/fetcher';
import { useSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

interface UseSessionKickoutOptions {
  enabled?: boolean;
  checkInterval?: number;
  onSessionKicked?: () => void;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ExtendedSession {
  user?: ExtendedUser;
}

export function useSessionKickout(options: UseSessionKickoutOptions = {}) {
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enabled = true,
    checkInterval = 30000, // Verificar cada 30 segundos (reducido la frecuencia)
    onSessionKicked,
  } = options;

  const checkSessionValidity = useCallback(async () => {
    const extendedSession = session as ExtendedSession;
    if (!extendedSession?.user?.id) return;

    try {
      // Timeout reducido a 5 segundos para session-check
      const response = await apiFetch(
        '/api/auth/session-check',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: extendedSession.user.id,
            currentTime: Date.now(),
          }),
        },
        5000
      ); // Timeout de 5 segundos

      if (response.ok) {
        const data = await response.json();

        // Si hay timeout, ignorar (asumir sesión válida)
        if (data.timeout) {
          console.warn('[Session Check] Timeout en servidor - omitiendo validación');
          return;
        }

        // Si la sesión ya no es válida, cerrar sesión
        if (!data.isValid) {
          toast.error('Tu sesión ha sido cerrada porque iniciaste sesión desde otro dispositivo.', {
            duration: 8000,
            id: 'session-kicked', // Evitar duplicados
          });

          if (onSessionKicked) {
            onSessionKicked();
          }

          // Cerrar sesión después de un breve delay
          setTimeout(() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const target = origin ? `${origin}/login` : '/login';
            signOut({
              callbackUrl: target,
              redirect: true,
            });
          }, 2000);
        }
      } else if (response.status !== 401 && response.status !== 403) {
        // Solo loguear errores que no sean de autenticación
        console.warn('[Session Check] Error en validación:', response.status);
      }
    } catch (error) {
      // Manejar diferentes tipos de error
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.warn('[Session Check] Timeout - omitiendo validación (sesión asumida válida)');
        } else if (error.name === 'AbortError') {
          console.warn('[Session Check] Petición abortada');
        } else {
          console.warn('[Session Check] Error de red:', error.message);
        }
      }
      // No hacer nada - el sistema continuará funcionando sin esta validación
    }
  }, [session, onSessionKicked]);

  useEffect(() => {
    if (status === 'authenticated' && session && enabled) {
      // Retraso inicial de 5 segundos para permitir que se registre la sesión
      const initialDelay = setTimeout(() => {
        // Verificar inmediatamente después del retraso
        checkSessionValidity();

        // Iniciar verificación periódica
        intervalRef.current = setInterval(checkSessionValidity, checkInterval);
      }, 5000);

      return () => {
        clearTimeout(initialDelay);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, session, enabled, checkInterval, checkSessionValidity]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    checkSessionValidity,
  };
}

export default useSessionKickout;

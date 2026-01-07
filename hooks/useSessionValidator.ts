/**
 * Hook para validación periódica de sesión
 * Funciona independientemente del navegador usado
 */

import { useEffect, useRef } from 'react';
import apiFetch from '@/lib/fetcher';
import { useSession, signOut } from 'next-auth/react';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

interface SessionValidatorOptions {
  enabled?: boolean;
  checkInterval?: number; // Intervalo en milisegundos
  onSessionInvalid?: () => void;
}

export default function useSessionValidator(options: SessionValidatorOptions = {}) {
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const {
    enabled = true,
    checkInterval = 30000, // 30 segundos por defecto
    onSessionInvalid,
  } = options;

  useEffect(() => {
    if (!enabled || status !== 'authenticated' || !session?.user) {
      return;
    }

    const validateSession = async () => {
      try {
        // Evitar llamadas muy frecuentes
        const now = Date.now();
        if (now - lastCheckRef.current < checkInterval - 5000) {
          return;
        }
        lastCheckRef.current = now;

        // Verificar si la sesión sigue siendo válida en el servidor
        const response = await apiFetch('/api/auth/validate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: (session.user as any).id }),
        });

        if (!response.ok) {
          throw new Error('Error validating session');
        }

        const data = await response.json();

        if (!data.isValid) {
          console.log('🚫 [SESSION-VALIDATOR] Sesión invalidada desde otro navegador');

          // Limpiar el intervalo para evitar múltiples llamadas
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Notificar al usuario
          toast.error('Tu sesión ha sido cerrada porque se inició sesión desde otro navegador', {
            duration: 5000,
          });

          // Ejecutar callback personalizado si existe
          if (onSessionInvalid) {
            onSessionInvalid();
          }

          // Cerrar sesión después de un breve delay
          setTimeout(() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const target = origin
              ? `${origin}/login?message=session_closed_other_browser`
              : '/login?message=session_closed_other_browser';
            signOut({
              callbackUrl: target,
              redirect: true,
            });
          }, 2000);
        }
      } catch (error) {
        logger.error('Error validando sesión:', error);
        // En caso de error de red, no cerrar la sesión automáticamente
      }
    };

    // Ejecutar la primera validación después de un breve delay
    const initialDelay = setTimeout(validateSession, 5000);

    // Configurar intervalo de validación
    intervalRef.current = setInterval(validateSession, checkInterval);

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session, status, enabled, checkInterval, onSessionInvalid]);

  return {
    isValidating: intervalRef.current !== null,
  };
}

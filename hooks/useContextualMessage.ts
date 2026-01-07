/**
 * 🔧 MEJORA: Hook para obtener mensajes contextuales de cierre de sesión
 *
 * Este hook consulta la API para determinar si debe mostrar un mensaje
 * específico basado en la razón del último cierre de sesión del usuario.
 */

import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';

interface ContextualMessageResult {
  message: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para obtener mensaje contextual de cierre
 */
export function useContextualMessage(userId?: string): ContextualMessageResult {
  const [result, setResult] = useState<ContextualMessageResult>({
    message: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!userId || typeof window === 'undefined') {
      setResult({ message: null, isLoading: false, error: null });
      return;
    }

    let isMounted = true;

    const fetchMessage = async () => {
      setResult((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `/api/session/contextual-message?userId=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setResult({
            message: data.message || null,
            isLoading: false,
            error: null,
          });

          if (data.message) {
            logger.debug('[CONTEXTUAL-MESSAGE] Mensaje contextual obtenido', {
              userId,
              message: data.message,
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.warn('[CONTEXTUAL-MESSAGE] Error obteniendo mensaje', { error, userId });
          setResult({
            message: null,
            isLoading: false,
            error: 'Error cargando mensaje contextual',
          });
        }
      }
    };

    fetchMessage();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return result;
}

/**
 * Hook simplificado para página de login
 * Extrae automáticamente userId de localStorage si existe
 */
export function useLoginContextualMessage(): ContextualMessageResult {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Solo ejecutar en el cliente para evitar errores de hidratación
    if (typeof window === 'undefined') return;

    // Intentar obtener userId de intentos previos de login
    try {
      const lastLoginAttempt = localStorage.getItem('last-login-attempt');
      const sessionFingerprint = localStorage.getItem('session-fingerprint');

      // Si hay un fingerprint reciente, intentar obtener el último userId
      // (esto es para casos donde el usuario se reconecta después de crash)
      if (lastLoginAttempt || sessionFingerprint) {
        const stored = localStorage.getItem('last-user-id');
        if (stored && stored !== 'undefined') {
          setUserId(stored);
        }
      }
    } catch (error) {
      logger.warn('[CONTEXTUAL-MESSAGE] Error obteniendo userId de localStorage', { error });
    }
  }, []);

  return useContextualMessage(userId);
}

export default useContextualMessage;

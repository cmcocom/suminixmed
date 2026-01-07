'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

export default function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const [_errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Manejar errores de NextAuth del lado del cliente
    const handleNextAuthError = (event: PromiseRejectionEvent) => {
      const errorMessage = event?.reason?.toString?.() || '';

      // 🔒 Detectar errores específicos de NextAuth
      if (
        errorMessage.includes('CLIENT_FETCH_ERROR') ||
        errorMessage.includes('Cannot convert undefined or null to object')
      ) {
        event.preventDefault();
        console.error('[AUTH ERROR] Error de sesión detectado:', errorMessage);

        setErrorCount((prev) => {
          const newCount = prev + 1;

          // Si hay múltiples errores consecutivos, forzar cierre de sesión
          if (newCount >= 3) {
            console.error('[AUTH ERROR] Múltiples errores detectados, forzando cierre de sesión');
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const target = origin
              ? `${origin}/login?error=sesion-invalida`
              : '/login?error=sesion-invalida';
            signOut({
              callbackUrl: target,
              redirect: true,
            });
            return 0; // Reset counter
          }

          // Primer o segundo error: intentar recargar
          if (newCount < 3) {
            console.warn('[AUTH ERROR] Intentando recuperar sesión (intento ' + newCount + '/3)');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }

          return newCount;
        });
      }
    };

    // Manejar errores globales de JavaScript
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event?.message || '';

      if (
        errorMessage.includes('Cannot convert undefined or null to object') ||
        errorMessage.includes('next-auth')
      ) {
        console.error('[AUTH ERROR] Error global relacionado con autenticación:', errorMessage);
        event.preventDefault();
      }
    };

    // Escuchar errores no manejados
    window.addEventListener('unhandledrejection', handleNextAuthError);
    window.addEventListener('error', handleGlobalError);

    // Reset del contador después de 30 segundos sin errores
    const resetTimer = setInterval(() => {
      setErrorCount(0);
    }, 30000);

    return () => {
      window.removeEventListener('unhandledrejection', handleNextAuthError);
      window.removeEventListener('error', handleGlobalError);
      clearInterval(resetTimer);
    };
  }, []);

  return <>{children}</>;
}

'use client';

import { api } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useSessionKickout from '../../hooks/useSessionKickout';
import useSessionManagement from '../../hooks/useSessionManagement';
import { useSessionSSE } from '../../hooks/useSessionSSE';
import SessionCommunicator from '../../lib/sessionCommunicator';

// Context para manejar la actualización de la imagen del usuario
const UserImageContext = createContext<{
  currentUserImage: string | null;
  updateUserImage: (newImagePath: string) => void;
} | null>(null);

export const useUserImage = () => {
  const context = useContext(UserImageContext);
  if (!context) {
    throw new Error('useUserImage must be used within UserImageProvider');
  }
  return context;
};

interface UserImageProviderProps {
  children: React.ReactNode;
}

export const UserImageProvider: React.FC<UserImageProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number>(30 * 60 * 1000); // Default: 30 minutos

  // Obtener configuración de timeout de sesión desde la entidad activa
  useEffect(() => {
    const fetchSessionTimeout = async () => {
      if (status === 'authenticated') {
        try {
          const response = await api.get('/api/entidades/active');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.tiempo_sesion_minutos) {
              const timeoutMs = result.data.tiempo_sesion_minutos * 60 * 1000;
              logger.info(
                `⏱️ [SESSION CONFIG] Timeout configurado: ${result.data.tiempo_sesion_minutos} minutos (${timeoutMs}ms)`
              );
              setSessionTimeout(timeoutMs);
            }
          }
        } catch (error) {
          logger.warn(
            '⚠️ Error obteniendo configuración de sesión, usando default (30 min):',
            error as any
          );
        }
      }
    };

    fetchSessionTimeout();
  }, [status]);

  // Helper function para signOut consistente
  const handleSignOut = useCallback(
    async (message: string) => {
      try {
        // Verificar si aún hay sesión activa antes de intentar signOut

        const response = await api.get('/api/auth/session', { method: 'GET' });

        // Si hay sesión activa, hacer signOut; si no, saltar directo al redirect
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData?.user) {
            logger.debug('🔄 [CONTEXT] Sesión aún activa, ejecutando signOut...');
            await signOut({ redirect: false });
          } else {
            logger.debug('🔄 [CONTEXT] Sesión ya invalidada, redirigiendo directamente...');
          }
        } else {
          logger.debug('🔄 [CONTEXT] No se pudo verificar sesión, redirigiendo directamente...');
        }
      } catch (error) {
        logger.warn(
          '⚠️ [CONTEXT] Error verificando sesión, probablemente ya invalidada:',
          error as any
        );
        // No es un error crítico, la sesión probablemente ya está invalidada
      }

      // Siempre redirigir al final, independientemente del estado de signOut
      setTimeout(() => {
        router.push(`/login?message=${message}`);
      }, 100);
    },
    [router]
  );

  // Configurar comunicación entre ventanas para sesiones múltiples
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const communicator = SessionCommunicator.getInstance();

      const handleSessionTermination = (data: { userId: string; message: string }) => {
        if (data.userId === (session.user as any).id) {
          toast.error(data.message, { duration: 5000 });

          setTimeout(() => {
            handleSignOut('session_terminated');
          }, 2000);
        }
      };

      const handleForceLogoutIncoming = (data: { userId: string }) => {
        if (data.userId === (session.user as any).id) {
          toast.error(
            'Tu sesión será cerrada porque se está iniciando una nueva sesión desde otro dispositivo',
            {
              duration: 4000,
            }
          );

          setTimeout(() => {
            handleSignOut('session_terminated_by_new_login');
          }, 1500);
        }
      };

      const handleNewSessionStarting = (data: { userId: string }) => {
        if (data.userId === (session.user as any).id) {
          logger.warn('🚫 Nueva sesión detectada, preparando cierre...');
        }
      };

      communicator.on('session-terminated', handleSessionTermination);
      communicator.on('force-logout-incoming', handleForceLogoutIncoming);
      communicator.on('new-session-starting', handleNewSessionStarting);

      return () => {
        communicator.off('session-terminated', handleSessionTermination);
        communicator.off('force-logout-incoming', handleForceLogoutIncoming);
        communicator.off('new-session-starting', handleNewSessionStarting);
      };
    }
    return;
  }, [session, status, handleSignOut]);

  // Configurar notificaciones en tiempo real de sesiones (funciona entre navegadores diferentes)
  const { isConnected, disconnect: disconnectSSE } = useSessionSSE();

  // Log del estado de conexión SSE solo cuando cambia
  useEffect(() => {
    // no guardamos prev entre renders fuera del effect ya que el hook se re-ejecuta con deps
    if (status === 'authenticated') {
      logger.debug(`📡 [SSE] Estado de conexión: ${isConnected ? 'Conectado' : 'Desconectado'}`);
    }
  }, [isConnected, status]);

  // Exponer función para desconectar SSE antes de logout manual (útil para componentes hijos)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Exponer función global para que LogoutModal pueda desconectar SSE antes del logout
      (window as unknown as { disconnectSSE?: () => void }).disconnectSSE = disconnectSSE;
    }
  }, [disconnectSSE]);

  // Configurar gestión de sesiones optimizada
  useSessionManagement({
    enabled: status === 'authenticated',
    idleTimeout: sessionTimeout, // Timeout dinámico desde la base de datos
    heartbeatInterval: 2 * 60 * 1000, // 2 minutos
    warningTime: 5 * 60 * 1000, // Advertencia 5 minutos antes
    enableNotifications: true,
    onSessionWarning: () => {
      logger.warn('⚠️ Advertencia: Sesión próxima a expirar');
    },
    onActivityResume: () => {
      logger.debug('✅ Actividad del usuario reanudada');
    },
    onSessionEnd: () => {
      logger.info('🔐 Sesión terminada por inactividad');
    },
  });

  // Configurar detección de sesiones múltiples
  useSessionKickout({
    enabled: status === 'authenticated',
    checkInterval: 30000, // Verificar cada 30 segundos
    onSessionKicked: () => {
      logger.warn('🚫 Sesión cerrada desde otro dispositivo');
    },
  });

  // Sincronizar la imagen del estado con la imagen de la sesión SOLO en la carga inicial
  // NO sincronizar después de actualizaciones manuales para evitar que la imagen antigua sobreescriba la nueva
  useEffect(() => {
    if (session?.user?.image && currentUserImage === null) {
      // Solo establecer si currentUserImage está vacío (carga inicial)
      setCurrentUserImage(session.user.image);
    }
  }, [session?.user?.image, currentUserImage]);

  const updateUserImage = (newImagePath: string) => {
    logger.debug('🔄 [UserImageContext] Actualizando imagen de usuario:', newImagePath);
    setCurrentUserImage(newImagePath);
  };

  return (
    <UserImageContext.Provider value={{ currentUserImage, updateUserImage }}>
      {children}
    </UserImageContext.Provider>
  );
};

/**
 * Hook personalizado para gestión de sesiones
 * Proporciona una interfaz limpia para usar el SessionManager
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import SessionManager from '../lib/session-manager.service';

interface UseSessionManagementOptions {
  enabled?: boolean;
  idleTimeout?: number;
  heartbeatInterval?: number;
  warningTime?: number;
  enableNotifications?: boolean;
  onSessionEnd?: () => void;
  onSessionWarning?: () => void;
  onActivityResume?: () => void;
}

export function useSessionManagement(options: UseSessionManagementOptions = {}) {
  const { data: session, status } = useSession();
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const callbacksRef = useRef({
    onSessionEnd: options.onSessionEnd,
    onSessionWarning: options.onSessionWarning,
    onActivityResume: options.onActivityResume,
  });

  // Actualizar callbacks ref cuando cambien las props
  useEffect(() => {
    callbacksRef.current = {
      onSessionEnd: options.onSessionEnd,
      onSessionWarning: options.onSessionWarning,
      onActivityResume: options.onActivityResume,
    };
  }, [options.onSessionEnd, options.onSessionWarning, options.onActivityResume]);

  // Callbacks estables
  const handleIdle = useCallback(() => {
    if (callbacksRef.current.onSessionEnd) {
      callbacksRef.current.onSessionEnd();
    }
  }, []);

  const handleWarning = useCallback(() => {
    if (callbacksRef.current.onSessionWarning) {
      callbacksRef.current.onSessionWarning();
    }
  }, []);

  const handleActive = useCallback(() => {
    if (callbacksRef.current.onActivityResume) {
      callbacksRef.current.onActivityResume();
    }
  }, []);

  // Inicializar SessionManager
  useEffect(() => {
    if (status === 'authenticated' && session && options.enabled !== false) {
      if (!sessionManagerRef.current) {
        sessionManagerRef.current = SessionManager.getInstance();

        // Configurar el manager
        sessionManagerRef.current.configure({
          idleTimeout: options.idleTimeout,
          heartbeatInterval: options.heartbeatInterval,
          warningTime: options.warningTime,
          enableNotifications: options.enableNotifications,
        });

        // Agregar callbacks
        sessionManagerRef.current.addCallback('onIdle', handleIdle);
        sessionManagerRef.current.addCallback('onWarning', handleWarning);
        sessionManagerRef.current.addCallback('onActive', handleActive);

        // Iniciar monitoreo
        sessionManagerRef.current.startListening();
        sessionManagerRef.current.startHeartbeat();
      }
    }

    return () => {
      if (sessionManagerRef.current) {
        // Remover callbacks
        sessionManagerRef.current.removeCallback('onIdle', handleIdle);
        sessionManagerRef.current.removeCallback('onWarning', handleWarning);
        sessionManagerRef.current.removeCallback('onActive', handleActive);

        // Solo detener si no hay otros callbacks
        if (!sessionManagerRef.current.hasCallbacks()) {
          sessionManagerRef.current.stopListening();
          sessionManagerRef.current.stopHeartbeat();
        }
      }
    };
  }, [
    status,
    session,
    options.enabled,
    options.idleTimeout,
    options.heartbeatInterval,
    options.warningTime,
    options.enableNotifications,
    handleIdle,
    handleWarning,
    handleActive,
  ]);

  // Limpiar al desmontar o cambiar session
  useEffect(() => {
    return () => {
      if (sessionManagerRef.current && (!session || status !== 'authenticated')) {
        sessionManagerRef.current.removeCallback('onIdle', handleIdle);
        sessionManagerRef.current.removeCallback('onWarning', handleWarning);
        sessionManagerRef.current.removeCallback('onActive', handleActive);
        sessionManagerRef.current = null;
      }
    };
  }, [session, status, handleIdle, handleWarning, handleActive]);

  // Función para forzar logout
  const forceLogout = useCallback(() => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.forceLogout();
    }
  }, []);

  // Función para obtener estado de actividad
  const isSessionActive = useCallback(() => {
    return sessionManagerRef.current?.getIsActive() ?? false;
  }, []);

  // Función para obtener última actividad
  const getLastActivity = useCallback(() => {
    return sessionManagerRef.current?.getLastActivity() ?? Date.now();
  }, []);

  // Función para resetear timers manualmente
  const resetSessionTimers = useCallback(() => {
    if (sessionManagerRef.current) {
      // Simular actividad del usuario
      const event = new Event('mousedown');
      document.dispatchEvent(event);
    }
  }, []);

  return {
    isSessionActive,
    getLastActivity,
    forceLogout,
    resetSessionTimers,
    sessionManager: sessionManagerRef.current,
  };
}

export default useSessionManagement;

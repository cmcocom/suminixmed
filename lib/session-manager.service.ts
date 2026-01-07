/**
 * Servicio optimizado para gestión de sesiones
 * Centraliza toda la lógica de actividad del usuario y notificaciones
 */

'use client';

import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import apiFetch from '@/lib/fetcher';

interface SessionConfig {
  idleTimeout?: number;
  heartbeatInterval?: number;
  warningTime?: number;
  enableNotifications?: boolean;
  onIdle?: () => void;
  onActive?: () => void;
  onWarning?: () => void;
  onLogout?: () => void;
}

class SessionManager {
  private static instance: SessionManager;
  private isActive = true;
  private idleTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity = Date.now();
  private lastHeartbeatSent = 0;
  private isListening = false;
  private hasShownWarning = false;

  // Configuración por defecto
  private config: Required<SessionConfig> = {
    idleTimeout: 30 * 60 * 1000, // 30 minutos
    heartbeatInterval: 2 * 60 * 1000, // 2 minutos
    warningTime: 5 * 60 * 1000, // 5 minutos antes
    enableNotifications: true,
    onIdle: () => this.handleIdle(),
    onActive: () => this.handleActive(),
    onWarning: () => this.handleWarning(),
    onLogout: () => this.handleLogout(),
  };

  private callbacks = {
    onIdle: new Set<() => void>(),
    onActive: new Set<() => void>(),
    onWarning: new Set<() => void>(),
    onLogout: new Set<() => void>(),
  };

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Configurar el manager
  configure(newConfig: Partial<SessionConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.resetTimers();
  }

  // Agregar callbacks
  addCallback(event: keyof typeof this.callbacks, callback: () => void) {
    this.callbacks[event].add(callback);
  }

  removeCallback(event: keyof typeof this.callbacks, callback: () => void) {
    this.callbacks[event].delete(callback);
  }

  // Gestión de actividad
  private handleUserActivity = () => {
    const now = Date.now();
    this.lastActivity = now;

    if (!this.isActive) {
      this.isActive = true;
      this.hasShownWarning = false;
      this.triggerCallbacks('onActive');
    }

    this.resetTimers();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.isActive = false;
    } else {
      this.handleUserActivity();
    }
  };

  private handleBeforeUnload = () => {
    this.cleanup();
    const tabId = sessionStorage.getItem('tabId');
    if (tabId) {
      navigator.sendBeacon(
        '/api/auth/tab-close',
        JSON.stringify({
          tabId,
          timestamp: Date.now(),
        })
      );
    }
  };

  // Manejo de eventos del sistema
  private handleIdle() {
    this.isActive = false;
    this.triggerCallbacks('onIdle');
  }

  private handleActive() {
    if (this.config.enableNotifications && this.hasShownWarning) {
      // Limpiar la marca de tiempo del último aviso cuando se reactiva
      localStorage.removeItem('lastSessionWarning');
      toast.success('Sesión reactivada', {
        duration: 3000,
        id: 'session-reactivated', // ID único para evitar duplicados
      });
    }
    this.triggerCallbacks('onActive');
  }

  private handleWarning() {
    // ✅ REACTIVADO - Aviso de cierre de sesión (con protección anti-loop)
    if (!this.hasShownWarning && this.config.enableNotifications) {
      this.hasShownWarning = true;

      // Rate limiting: solo mostrar un aviso cada 30 segundos mínimo
      const lastWarningTime = localStorage.getItem('lastSessionWarning');
      const now = Date.now();
      if (lastWarningTime && now - parseInt(lastWarningTime) < 30000) {
        return;
      }

      localStorage.setItem('lastSessionWarning', now.toString());

      const warningMinutes = Math.floor(this.config.warningTime / 60000);
      toast.error(
        `Tu sesión expirará en ${warningMinutes} minuto${warningMinutes !== 1 ? 's' : ''} por inactividad. Realiza alguna acción para mantenerla activa.`,
        {
          duration: 10000,
          id: 'session-warning', // ID único para evitar duplicados
        }
      );
      this.triggerCallbacks('onWarning');
    }
  }

  private handleLogout() {
    // ✅ REACTIVADO - Notificación de cierre por inactividad (con protección anti-loop)
    if (this.config.enableNotifications) {
      // Evitar múltiples notificaciones de logout
      if (!this.hasShownWarning) {
        toast.error('Sesión cerrada por inactividad', {
          duration: 5000,
          id: 'session-logout', // ID único para evitar duplicados
        });
      }
    }
    this.triggerCallbacks('onLogout');
    this.forceLogout();
  }

  // Triggers
  private triggerCallbacks(event: keyof typeof this.callbacks) {
    this.callbacks[event].forEach((callback) => {
      try {
        callback();
      } catch (error) {
        void error;
      }
    });
  }

  // Gestión de timers
  private resetTimers() {
    this.clearTimers();

    const warningTime = this.config.idleTimeout - this.config.warningTime;
    const logoutTime = this.config.idleTimeout;

    // Timer para mostrar advertencia
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.config.onWarning();
      }, warningTime);
    }

    // Timer para logout automático
    this.idleTimer = setTimeout(() => {
      this.config.onIdle();
      setTimeout(() => {
        this.config.onLogout();
      }, this.config.warningTime);
    }, logoutTime);
  }

  private clearTimers() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  // Gestión de heartbeat
  startHeartbeat() {
    if (this.heartbeatTimer) return;

    // Primer heartbeat después de 5 segundos
    setTimeout(() => {
      if (this.isActive) {
        this.sendHeartbeat();
      }
    }, 5000);

    this.heartbeatTimer = setInterval(() => {
      if (this.isActive) {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async sendHeartbeat() {
    const now = Date.now();
    if (now - this.lastHeartbeatSent < 60000) {
      return; // Rate limiting
    }

    try {
      const tabId = sessionStorage.getItem('tabId');
      if (!tabId) return;

      const response = await apiFetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastActivity: this.lastActivity,
          tabId,
        }),
      });

      if (response.ok) {
        this.lastHeartbeatSent = now;
      } else if (response.status === 401) {
        this.stopHeartbeat();
        this.forceLogout();
      } else if (response.status === 409) {
        // Límite de usuarios concurrentes alcanzado u otro conflicto de sesión.
        // Cerrar sesión rápidamente con mensaje amigable.
        this.stopHeartbeat();
        this.cleanup();
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const target = origin
            ? `${origin}/login?message=concurrent_limit_exceeded`
            : '/login?message=concurrent_limit_exceeded';
          await signOut({ callbackUrl: target });
        } catch {
          // Fallback duro por si signOut falla
          window.location.replace('/login?message=concurrent_limit_exceeded');
        }
      }
    } catch (error) {
      void error;
      // Silenciar errores de heartbeat
    }
  }

  // Inicialización y limpieza
  startListening() {
    if (this.isListening) return;

    // Generar ID de pestaña único
    if (!sessionStorage.getItem('tabId')) {
      const tabId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('tabId', tabId);
    }

    // Eventos de actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    this.isListening = true;
    this.handleUserActivity(); // Inicializar como activo
  }

  stopListening() {
    if (!this.isListening) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.removeEventListener(event, this.handleUserActivity);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    this.cleanup();
    this.isListening = false;
  }

  private cleanup() {
    this.clearTimers();
    this.stopHeartbeat();
  }

  // Acciones públicas
  async forceLogout() {
    try {
      this.cleanup();

      const tabId = sessionStorage.getItem('tabId');
      if (tabId) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabId }),
        });
      }

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const target = origin ? `${origin}/login` : '/login';
        await signOut({ callbackUrl: target });
      } catch (e) {
        // If signOut fails for any reason, try a relative redirect as a last resort
        void e;
        window.location.replace('/login');
      }
    } catch (error) {
      void error;
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const target = origin ? `${origin}/login` : '/login';
        await signOut({ callbackUrl: target });
      } catch (e) {
        void e;
        window.location.replace('/login');
      }
    }
  }

  // Getters
  getIsActive() {
    return this.isActive;
  }

  getLastActivity() {
    return this.lastActivity;
  }

  getConfig() {
    return { ...this.config };
  }

  hasCallbacks() {
    return Object.values(this.callbacks).some((set) => set.size > 0);
  }

  // Destructor
  destroy() {
    this.stopListening();
    this.cleanup();
    Object.values(this.callbacks).forEach((set) => set.clear());
  }
}

export default SessionManager;

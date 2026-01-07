/**
 * Sistema de comunicación entre ventanas para el manejo de sesiones múltiples
 */

export class SessionCommunicator {
  private static instance: SessionCommunicator;

  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  private constructor() {
    if (typeof window !== 'undefined') {
      // Escuchar eventos de localStorage
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  static getInstance(): SessionCommunicator {
    if (!SessionCommunicator.instance) {
      SessionCommunicator.instance = new SessionCommunicator();
    }
    return SessionCommunicator.instance;
  }

  /**
   * Enviar mensaje a todas las ventanas/pestañas abiertas
   */

  broadcast(event: string, data: any) {
    if (typeof window === 'undefined') return;

    const message = {
      event,
      data,
      timestamp: Date.now(),
      source: 'session-communicator',
    };

    // Usar localStorage para comunicación entre pestañas
    localStorage.setItem('session-message', JSON.stringify(message));

    // Remover inmediatamente para permitir múltiples mensajes
    setTimeout(() => {
      localStorage.removeItem('session-message');
    }, 100);
  }

  /**
   * Escuchar eventos específicos
   */

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Dejar de escuchar eventos
   */

  off(event: string, callback: (data: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * Manejar cambios en localStorage
   */
  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'session-message' && event.newValue) {
      try {
        const message = JSON.parse(event.newValue);
        if (message.source === 'session-communicator') {
          this.emitEvent(message.event, message.data);
        }
      } catch (error) {
        void error;
      }
    }
  }

  /**
   * Emitir evento a los listeners locales
   */

  private emitEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          void error;
        }
      });
    }
  }

  /**
   * Notificar que se debe cerrar sesión desde otro dispositivo
   */
  notifySessionTermination(reason: string, userId: string) {
    this.broadcast('session-terminated', {
      reason,
      userId,
      message: 'Tu sesión ha sido cerrada porque se inició sesión desde otro dispositivo',
    });
  }

  /**
   * Notificar que una nueva sesión está iniciando
   */
  notifyNewSessionStarting(userId: string) {
    this.broadcast('new-session-starting', {
      userId,
      message: 'Se está iniciando una nueva sesión para este usuario',
    });
  }

  /**
   * Limpiar listeners
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
    }
    this.listeners = {};
  }
}

export default SessionCommunicator;

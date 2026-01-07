/**
 * @fileoverview Sistema de Fingerprinting de Sesiones
 * @description Genera identificadores únicos de navegador/dispositivo para detectar reconexiones
 * @author Sistema de Mejoras de Sesiones
 * @date 2025-11-05
 */

interface SessionFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory?: number;
  colorDepth: number;
  pixelRatio: number;
  touchSupport: boolean;
  webglRenderer?: string;
}

interface FingerprintOptions {
  includeCanvas?: boolean;
  includeWebGL?: boolean;
  includeAudio?: boolean;
}

/**
 * Genera un fingerprint único del navegador/dispositivo para detectar reconexiones
 */
export class SessionFingerprintGenerator {
  /**
   * Genera un fingerprint completo del navegador
   */
  static async generateFingerprint(options: FingerprintOptions = {}): Promise<string> {
    try {
      const fingerprint = await this.collectFingerprintData(options);
      return this.hashFingerprint(fingerprint);
    } catch (error) {
      console.warn('[FINGERPRINT] Error generando fingerprint:', error);
      // Fallback a un fingerprint básico
      return this.generateBasicFingerprint();
    }
  }

  /**
   * Recolecta datos del navegador para el fingerprint
   */
  private static async collectFingerprintData(
    options: FingerprintOptions
  ): Promise<SessionFingerprint> {
    const nav = navigator;
    const screen = window.screen;

    const fingerprint: SessionFingerprint = {
      userAgent: nav.userAgent || '',
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: nav.language || '',
      platform: nav.platform || '',
      cookieEnabled: nav.cookieEnabled || false,
      doNotTrack: nav.doNotTrack || null,
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      colorDepth: screen.colorDepth || 0,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };

    // Información adicional si está disponible
    if ('deviceMemory' in nav) {
      fingerprint.deviceMemory = (nav as any).deviceMemory;
    }

    // WebGL renderer si está habilitado
    if (options.includeWebGL !== false) {
      fingerprint.webglRenderer = this.getWebGLRenderer();
    }

    return fingerprint;
  }

  /**
   * Obtiene información del renderer WebGL
   */
  private static getWebGLRenderer(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext);

      if (!gl) return undefined;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }

      return gl.getParameter(gl.RENDERER);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Genera hash del fingerprint para crear un identificador único
   */
  private static async hashFingerprint(fingerprint: SessionFingerprint): Promise<string> {
    const fingerprintString = JSON.stringify(fingerprint, Object.keys(fingerprint).sort());

    // Usar Web Crypto API si está disponible
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('[FINGERPRINT] Error usando Web Crypto API:', error);
      }
    }

    // Fallback a hash simple
    return this.simpleHash(fingerprintString);
  }

  /**
   * Hash simple como fallback
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Genera fingerprint básico si falla el completo
   */
  private static generateBasicFingerprint(): string {
    const basic = [
      navigator.userAgent || 'unknown',
      screen.width + 'x' + screen.height,
      navigator.language || 'unknown',
      new Date().getTimezoneOffset().toString(),
    ].join('|');

    return this.simpleHash(basic);
  }

  /**
   * Compara dos fingerprints para determinar si son del mismo dispositivo
   */
  static compareFingerprints(fp1: string, fp2: string): boolean {
    return fp1 === fp2;
  }

  /**
   * Guarda el fingerprint en localStorage
   */
  static saveFingerprint(fingerprint: string): void {
    try {
      localStorage.setItem('session-fingerprint', fingerprint);
      localStorage.setItem('session-fingerprint-timestamp', Date.now().toString());
    } catch (error) {
      console.warn('[FINGERPRINT] Error guardando fingerprint:', error);
    }
  }

  /**
   * Obtiene el fingerprint guardado en localStorage
   */
  static getSavedFingerprint(): { fingerprint: string; timestamp: number } | null {
    try {
      const fingerprint = localStorage.getItem('session-fingerprint');
      const timestamp = localStorage.getItem('session-fingerprint-timestamp');

      if (fingerprint && timestamp) {
        return {
          fingerprint,
          timestamp: parseInt(timestamp, 10),
        };
      }
    } catch (error) {
      console.warn('[FINGERPRINT] Error obteniendo fingerprint guardado:', error);
    }

    return null;
  }

  /**
   * Verifica si el fingerprint actual coincide con el guardado
   */
  static async isSameDevice(): Promise<boolean> {
    try {
      const currentFingerprint = await this.generateFingerprint();
      const saved = this.getSavedFingerprint();

      if (!saved) {
        // Primer uso, guardar fingerprint actual
        this.saveFingerprint(currentFingerprint);
        return true;
      }

      // Verificar si es el mismo dispositivo
      const isSame = this.compareFingerprints(currentFingerprint, saved.fingerprint);

      // Actualizar timestamp si es el mismo dispositivo
      if (isSame) {
        this.saveFingerprint(currentFingerprint);
      }

      return isSame;
    } catch (error) {
      console.warn('[FINGERPRINT] Error verificando dispositivo:', error);
      return true; // Asumir mismo dispositivo en caso de error
    }
  }

  /**
   * Limpia el fingerprint guardado (usar al cerrar sesión manual)
   */
  static clearSavedFingerprint(): void {
    try {
      localStorage.removeItem('session-fingerprint');
      localStorage.removeItem('session-fingerprint-timestamp');
    } catch (error) {
      console.warn('[FINGERPRINT] Error limpiando fingerprint:', error);
    }
  }

  /**
   * Verifica si el fingerprint guardado es reciente (menos de X tiempo)
   */
  static isFingerprintRecent(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    try {
      const saved = this.getSavedFingerprint();
      if (!saved) return false;

      return Date.now() - saved.timestamp < maxAgeMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🔧 MEJORA: Actualiza la actividad del fingerprint sin regenerarlo
   */
  static updateLastActivity(): void {
    try {
      const saved = this.getSavedFingerprint();
      if (saved) {
        // Solo actualizar timestamp, mantener el mismo fingerprint
        localStorage.setItem('session-fingerprint-timestamp', Date.now().toString());
      }
    } catch (error) {
      console.warn('[FINGERPRINT] Error actualizando actividad:', error);
    }
  }

  /**
   * 🔧 MEJORA: Marca que el logout fue manual para reconocimiento posterior
   */
  static markManualLogout(): void {
    try {
      localStorage.setItem('session-manual-logout-marker', Date.now().toString());
    } catch (error) {
      console.warn('[FINGERPRINT] Error marcando logout manual:', error);
    }
  }

  /**
   * 🔧 MEJORA: Verifica si hubo un logout manual reciente
   */
  static wasRecentManualLogout(maxAgeMs: number = 60000): boolean {
    try {
      const marker = localStorage.getItem('session-manual-logout-marker');
      if (!marker) return false;

      const logoutTime = parseInt(marker, 10);
      const isRecent = Date.now() - logoutTime < maxAgeMs;

      // Limpiar marcador si es muy viejo
      if (!isRecent) {
        localStorage.removeItem('session-manual-logout-marker');
      }

      return isRecent;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Hook para usar el fingerprinting en componentes React
 */
export function useSessionFingerprint() {
  const generateFingerprint = async () => {
    return SessionFingerprintGenerator.generateFingerprint();
  };

  const isSameDevice = async () => {
    return SessionFingerprintGenerator.isSameDevice();
  };

  const saveFingerprint = (fingerprint: string) => {
    SessionFingerprintGenerator.saveFingerprint(fingerprint);
  };

  const clearFingerprint = () => {
    SessionFingerprintGenerator.clearSavedFingerprint();
  };

  return {
    generateFingerprint,
    isSameDevice,
    saveFingerprint,
    clearFingerprint,
  };
}

export default SessionFingerprintGenerator;

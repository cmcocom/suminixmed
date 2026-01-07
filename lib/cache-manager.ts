/**
 * Sistema de caché en memoria para datos frecuentes
 * Reduce queries a la base de datos para catálogos que cambian poco
 *
 * OPTIMIZACIONES:
 * - Límite máximo de entradas para evitar memory leaks
 * - LRU (Least Recently Used) para evicción automática
 * - Limpieza automática de entradas expiradas
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccess: number;
  size: number; // Tamaño aproximado en bytes
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_ENTRIES = 100; // Máximo 100 entradas en caché
  private readonly MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB máximo
  private currentSize = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cache = new Map();
    // Limpieza automática cada 60 segundos
    this.startAutoCleanup();
  }

  /**
   * Iniciar limpieza automática de entradas expiradas
   */
  private startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Cada 60 segundos

    // No bloquear el proceso de Node.js
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.DEFAULT_TTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
      }
    });

    if (keysToDelete.length > 0) {
      console.debug(`[CACHE] Limpiadas ${keysToDelete.length} entradas expiradas`);
    }
  }

  /**
   * Estimar tamaño de un objeto en bytes
   */
  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 = 2 bytes por char
    } catch {
      return 1024; // Default 1KB si no se puede serializar
    }
  }

  /**
   * Evicción LRU cuando se excede el límite
   */
  private evictIfNeeded(): void {
    // Evictar por número de entradas
    while (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.findLeastRecentlyUsed();
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) this.currentSize -= entry.size;
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }

    // Evictar por tamaño total
    while (this.currentSize > this.MAX_SIZE_BYTES && this.cache.size > 0) {
      const oldestKey = this.findLeastRecentlyUsed();
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) this.currentSize -= entry.size;
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * Encontrar la entrada menos recientemente usada
   */
  private findLeastRecentlyUsed(): string | null {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    });

    return oldestKey;
  }

  /**
   * Obtener dato del caché
   * @param key Clave del caché
   * @param ttl Tiempo de vida en milisegundos (default: 5 minutos)
   * @returns Dato cacheado o null si expiró
   */
  get<T>(key: string, ttl: number = this.DEFAULT_TTL): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Si expiró, eliminar y retornar null
    if (age > ttl) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return null;
    }

    // Actualizar último acceso (LRU)
    entry.lastAccess = now;

    return entry.data as T;
  }

  /**
   * Guardar dato en caché
   * @param key Clave del caché
   * @param data Dato a cachear
   */
  set<T>(key: string, data: T): void {
    // Si ya existe, restar el tamaño anterior
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
    }

    const size = this.estimateSize(data);
    const now = Date.now();

    // Evictar si es necesario antes de insertar
    this.evictIfNeeded();

    this.cache.set(key, {
      data,
      timestamp: now,
      lastAccess: now,
      size,
    });

    this.currentSize += size;
  }

  /**
   * Invalidar una entrada específica del caché
   * @param key Clave a invalidar
   */
  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Invalidar todas las entradas que comiencen con un prefijo
   * @param prefix Prefijo de las claves a invalidar
   */
  invalidateByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.invalidate(key));
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return {
      entries: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
      sizeBytes: this.currentSize,
      maxSizeBytes: this.MAX_SIZE_BYTES,
      sizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Detener limpieza automática (para cleanup)
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Keys predefinidas para consistencia
export const CACHE_KEYS = {
  TIPOS_ENTRADA: 'tipos_entrada:all',
  PROVEEDORES: 'proveedores:all',
  PROVEEDORES_ACTIVOS: 'proveedores:activos',
  TIPOS_SALIDA: 'tipos_salida:all',
  CATEGORIAS: 'categorias:all',
};

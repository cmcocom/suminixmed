/**
 * Sistema de Caché para SuminixMed
 *
 * Proporciona almacenamiento temporal en memoria para reducir carga en BD.
 * Utiliza node-cache para simplicidad y rapidez.
 *
 * Uso:
 * ```typescript
 * import { cache } from '@/lib/cache';
 *
 * // Guardar en caché (TTL: 5 minutos)
 * await cache.set('clave', datos, 300);
 *
 * // Obtener del caché
 * const datos = await cache.get('clave');
 *
 * // Invalidar caché
 * await cache.del('clave');
 * ```
 */

import NodeCache from 'node-cache';

// Configuración del caché
const cacheConfig = {
  stdTTL: 300, // TTL por defecto: 5 minutos
  checkperiod: 60, // Verificar expiración cada 60 segundos
  useClones: false, // No clonar objetos (mejor rendimiento)
  deleteOnExpire: true, // Eliminar automáticamente al expirar
  maxKeys: 1000, // Máximo 1000 entradas en caché
};

// Instancia global del caché
const nodeCache = new NodeCache(cacheConfig);

/**
 * Prefijos estándar para organizar claves de caché
 */
export const CachePrefix = {
  DASHBOARD_STATS: 'dashboard:stats',
  STOCK_ALERTS: 'stock:alerts',
  USER_PERMISSIONS: 'user:permissions',
  ENTITY_CONFIG: 'entity:config',
  CATEGORIES_COUNT: 'categories:count',
  INVENTORY_SUMMARY: 'inventory:summary',
  REPORTS: 'reports',
} as const;

/**
 * TTL predefinidos por tipo de dato (en segundos)
 */
export const CacheTTL = {
  VERY_SHORT: 60, // 1 minuto - datos muy dinámicos
  SHORT: 180, // 3 minutos - datos semi-dinámicos
  MEDIUM: 300, // 5 minutos - datos con cambios moderados (default)
  LONG: 900, // 15 minutos - datos poco cambiantes
  VERY_LONG: 3600, // 1 hora - datos casi estáticos
  DAY: 86400, // 1 día - datos estáticos (configuración)
} as const;

/**
 * Interfaz del sistema de caché
 */
interface CacheSystem {
  /**
   * Obtener un valor del caché
   * @param key Clave del valor a obtener
   * @returns El valor almacenado o undefined si no existe o expiró
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Guardar un valor en el caché
   * @param key Clave bajo la cual guardar el valor
   * @param value Valor a almacenar
   * @param ttl Tiempo de vida en segundos (opcional, usa default si no se especifica)
   * @returns true si se guardó exitosamente
   */
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  /**
   * Eliminar un valor del caché
   * @param key Clave del valor a eliminar
   * @returns Número de entradas eliminadas (0 o 1)
   */
  del(key: string): Promise<number>;

  /**
   * Eliminar múltiples valores del caché
   * @param keys Array de claves a eliminar
   * @returns Número de entradas eliminadas
   */
  delMultiple(keys: string[]): Promise<number>;

  /**
   * Eliminar todas las entradas que coincidan con un patrón
   * @param pattern Patrón de búsqueda (ej: "dashboard:*")
   * @returns Número de entradas eliminadas
   */
  delPattern(pattern: string): Promise<number>;

  /**
   * Verificar si una clave existe en el caché
   * @param key Clave a verificar
   * @returns true si existe y no ha expirado
   */
  has(key: string): Promise<boolean>;

  /**
   * Limpiar todo el caché
   * @returns void
   */
  flush(): Promise<void>;

  /**
   * Obtener estadísticas del caché
   * @returns Objeto con estadísticas
   */
  getStats(): Promise<{
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  }>;

  /**
   * Obtener todas las claves almacenadas
   * @returns Array de claves
   */
  keys(): Promise<string[]>;
}

/**
 * Implementación del sistema de caché
 */
class CacheSystemImpl implements CacheSystem {
  private cache: NodeCache;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor(cache: NodeCache) {
    this.cache = cache;
    this.stats = {
      hits: 0,
      misses: 0,
    };

    // Log de eventos importantes (opcional, para debugging)
    if (process.env.NODE_ENV === 'development') {
      // Cache event logging disabled for production optimization
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = this.cache.get<T>(key);

      if (value !== undefined) {
        this.stats.hits++;
        return value;
      }

      this.stats.misses++;
      return undefined;
    } catch (error) {
      console.error(`[CACHE] Error al obtener ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const success = this.cache.set(key, value, ttl || cacheConfig.stdTTL);

      // Cache set success (logging disabled for performance)

      return success;
    } catch (error) {
      console.error(`[CACHE] Error al guardar ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const deleted = this.cache.del(key);
      return deleted;
    } catch (error) {
      console.error(`[CACHE] Error al eliminar ${key}:`, error);
      return 0;
    }
  }

  async delMultiple(keys: string[]): Promise<number> {
    try {
      const deleted = this.cache.del(keys);
      return deleted;
    } catch (error) {
      console.error(`[CACHE] Error al eliminar múltiples claves:`, error);
      return 0;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const allKeys = this.cache.keys();
      const regex = new RegExp(pattern.replace('*', '.*'));
      const matchingKeys = allKeys.filter((key) => regex.test(key));

      if (matchingKeys.length > 0) {
        const deleted = this.cache.del(matchingKeys);
        return deleted;
      }

      return 0;
    } catch (error) {
      console.error(`[CACHE] Error al eliminar patrón ${pattern}:`, error);
      return 0;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error(`[CACHE] Error al verificar ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      this.cache.flushAll();
    } catch (error) {
      console.error('[CACHE] Error al limpiar caché:', error);
    }
  }

  async getStats(): Promise<{
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  }> {
    try {
      const nodeStats = this.cache.getStats();

      return {
        keys: nodeStats.keys,
        hits: this.stats.hits,
        misses: this.stats.misses,
        ksize: nodeStats.ksize,
        vsize: nodeStats.vsize,
      };
    } catch (error) {
      console.error('[CACHE] Error al obtener estadísticas:', error);
      return {
        keys: 0,
        hits: 0,
        misses: 0,
        ksize: 0,
        vsize: 0,
      };
    }
  }

  async keys(): Promise<string[]> {
    try {
      return this.cache.keys();
    } catch (error) {
      console.error('[CACHE] Error al obtener claves:', error);
      return [];
    }
  }
}

/**
 * Instancia global del sistema de caché
 * Exportar como singleton
 */
export const cache: CacheSystem = new CacheSystemImpl(nodeCache);

/**
 * Helper para invalidar caché relacionado con una operación
 *
 * @example
 * // Al crear un producto, invalidar caché de inventario
 * await invalidateRelatedCache('inventario', ['crear']);
 */
export async function invalidateRelatedCache(
  resource: string,
  _operations: string[]
): Promise<void> {
  const patterns = [`${resource}:*`, `dashboard:stats*`, `reports:${resource}*`];

  for (const pattern of patterns) {
    await cache.delPattern(pattern);
  }
}

/**
 * Helper para obtener o calcular un valor con caché
 * Pattern: "cache-aside" / "lazy loading"
 *
 * @param key Clave del caché
 * @param fetcher Función que calcula el valor si no está en caché
 * @param ttl Tiempo de vida en segundos (opcional)
 * @returns El valor (del caché o recién calculado)
 *
 * @example
 * const stats = await getOrCompute(
 *   'dashboard:stats',
 *   async () => await calcularEstadisticas(),
 *   300 // 5 minutos
 * );
 */
export async function getOrCompute<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = await cache.get<T>(key);

  if (cached !== undefined) {
    return cached;
  }

  // Si no está en caché, calcular
  const value = await fetcher();

  // Guardar en caché para próximas consultas
  await cache.set(key, value, ttl);

  return value;
}

/**
 * Decorator para cachear resultados de funciones
 * (Experimental - usar con precaución)
 */
export function Cacheable(ttl: number = CacheTTL.MEDIUM) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return await getOrCompute(cacheKey, async () => await originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
}

export default cache;

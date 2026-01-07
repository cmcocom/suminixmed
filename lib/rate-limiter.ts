/**
 * Rate Limiter In-Memory
 *
 * Implementación simple de rate limiting usando Map en memoria.
 * Compatible con Edge Runtime de Next.js.
 *
 * NOTA: En producción con múltiples instancias, considerar Redis
 * (Upstash KV o Vercel KV para Vercel Edge).
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitRecord>;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Limpieza periódica cada 5 minutos
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Verifica si la solicitud está dentro del límite de rate
   */
  async check(identifier: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // Si no hay registro o expiró, crear nuevo
    if (!record || now >= record.resetTime) {
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });

      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    // Incrementar contador
    record.count++;

    const allowed = record.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - record.count);

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      resetTime: record.resetTime,
    };
  }

  /**
   * Limpia registros expirados
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Resetea el contador para un identificador específico
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Obtiene estadísticas del rate limiter
   */
  getStats(): {
    totalIdentifiers: number;
    maxRequests: number;
    windowMs: number;
  } {
    return {
      totalIdentifiers: this.requests.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

// Instancias globales con diferentes límites
export const generalLimiter = new RateLimiter(
  500, // 500 requests (aumentado para desarrollo)
  15 * 60 * 1000 // por 15 minutos
);

export const authLimiter = new RateLimiter(
  50, // 50 requests (aumentado para desarrollo)
  15 * 60 * 1000 // por 15 minutos
);

export const apiLimiter = new RateLimiter(
  1000, // 1000 requests (aumentado para desarrollo)
  15 * 60 * 1000 // por 15 minutos
);

/**
 * Helper para obtener identificador único del request
 * Prioriza: userId > IP > user-agent hash
 */
export function getRateLimitIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Intentar obtener IP real (considerando proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

export { RateLimiter };

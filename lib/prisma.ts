import { PrismaClient } from '@prisma/client';

// Evitar múltiples instancias en desarrollo
declare global {
  var prisma: PrismaClient | undefined;
  var prismaConnected: Promise<void> | undefined;
}

/**
 * Configuración de Connection Pool para PostgreSQL
 *
 * IMPORTANTE: Ajustar según los recursos del servidor:
 * - connection_limit: Máximo de conexiones simultáneas (default: 10)
 * - pool_timeout: Tiempo máximo de espera para obtener conexión (segundos)
 *
 * La URL debe incluir estos parámetros:
 * postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 */
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';

  // Si ya tiene parámetros de pool, usar tal cual
  if (baseUrl.includes('connection_limit')) {
    return baseUrl;
  }

  // Agregar parámetros de connection pool si no existen
  const separator = baseUrl.includes('?') ? '&' : '?';
  const poolParams = [
    'connection_limit=10', // Máximo 10 conexiones simultáneas
    'pool_timeout=20', // 20 segundos timeout para obtener conexión
    'connect_timeout=10', // 10 segundos timeout para conectar
  ].join('&');

  return `${baseUrl}${separator}${poolParams}`;
};

// Crear cliente Prisma con configuración optimizada
const createPrismaClient = () => {
  return new PrismaClient({
    // Solo log de errores en producción para mejor rendimiento
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
    // Configuración de connection pool optimizada
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
};

export const prisma = globalThis.prisma || createPrismaClient();

// Query performance monitoring disabled for production optimization

// Singleton para desarrollo Y producción
if (!globalThis.prisma) {
  globalThis.prisma = prisma;
}

// 🔒 CRÍTICO: Conectar explícitamente Prisma al inicializar
// Esto previene el error "Engine is not yet connected"
// Usar Promise para evitar múltiples conexiones simultáneas
if (!globalThis.prismaConnected) {
  globalThis.prismaConnected = prisma
    .$connect()
    .then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PRISMA] ✅ Conexión establecida exitosamente');
      }
    })
    .catch((err) => {
      console.error('[PRISMA] ❌ Error conectando a la base de datos:', err);
      // No salir del proceso en desarrollo para permitir hot reload
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
}

// Exportar función para asegurar conexión antes de operaciones críticas
export async function ensurePrismaConnection() {
  if (globalThis.prismaConnected) {
    await globalThis.prismaConnected;
  }
}

/**
 * Desconectar Prisma de forma segura
 * Usar en cleanup o shutdown del servidor
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('[PRISMA] Desconectado correctamente');
  } catch (error) {
    console.error('[PRISMA] Error al desconectar:', error);
  }
}

/**
 * Ejecutar operación con retry automático
 * Útil para operaciones críticas que pueden fallar por conexión
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes('connection') ||
          error.message.includes('FATAL') ||
          error.message.includes('timeout'));

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      console.warn(`[PRISMA] Retry ${attempt}/${maxRetries} después de error de conexión`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

// Registrar handlers de shutdown (solo en servidor)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  import('./shutdown-handler')
    .then(({ registerShutdownHandlers }) => {
      registerShutdownHandlers();
    })
    .catch(() => {
      // Silenciar error si no se puede importar
    });
}

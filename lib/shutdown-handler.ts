/**
 * Manejo de shutdown graceful del servidor
 *
 * Este módulo asegura que las conexiones se cierren correctamente
 * cuando el servidor se detiene, evitando conexiones huérfanas.
 */

import { cacheManager } from './cache-manager';
import { disconnectPrisma } from './prisma';

let isShuttingDown = false;

/**
 * Función de cleanup que se ejecuta al cerrar el servidor
 */
async function cleanup(signal: string) {
  if (isShuttingDown) {
    console.log('[SHUTDOWN] Ya en proceso de cierre...');
    return;
  }

  isShuttingDown = true;
  console.log(`[SHUTDOWN] Recibida señal ${signal}, iniciando cierre graceful...`);

  try {
    // 1. Detener el caché
    console.log('[SHUTDOWN] Deteniendo caché...');
    cacheManager.stopAutoCleanup();
    cacheManager.clear();

    // 2. Desconectar Prisma
    console.log('[SHUTDOWN] Desconectando base de datos...');
    await disconnectPrisma();

    console.log('[SHUTDOWN] Cierre completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('[SHUTDOWN] Error durante el cierre:', error);
    process.exit(1);
  }
}

/**
 * Registrar handlers de señales de shutdown
 * Llamar una sola vez al iniciar la aplicación
 */
export function registerShutdownHandlers() {
  // Solo registrar en el servidor (no en cliente)
  if (typeof window !== 'undefined') {
    return;
  }

  // Evitar registrar múltiples veces
  const handlers = process as NodeJS.Process & { _shutdownRegistered?: boolean };
  if (handlers._shutdownRegistered) {
    return;
  }
  handlers._shutdownRegistered = true;

  // SIGTERM: Señal de terminación estándar (Docker, PM2, etc.)
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  // SIGINT: Ctrl+C en terminal
  process.on('SIGINT', () => cleanup('SIGINT'));

  // Errores no capturados
  process.on('uncaughtException', (error) => {
    console.error('[FATAL] Excepción no capturada:', error);
    cleanup('uncaughtException').then(() => process.exit(1));
  });

  // Promesas rechazadas no manejadas
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Promesa rechazada no manejada:', reason);
    console.error('Promesa:', promise);
    // No salir del proceso, solo log
  });

  // Solo log en desarrollo para no ensuciar los logs del build
  if (process.env.NODE_ENV === 'development') {
    console.log('[SHUTDOWN] Handlers de cierre registrados');
  }
}

export default { registerShutdownHandlers, cleanup };

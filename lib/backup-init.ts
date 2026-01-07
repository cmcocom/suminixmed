/**
 * Inicializador del Sistema de Respaldos Automáticos
 *
 * Este archivo se importa en el layout principal para iniciar
 * el sistema de respaldos automáticos al arrancar la aplicación
 */

import { startCronJob } from './backup-scheduler';

let initialized = false;

export async function initializeBackupSystem() {
  if (initialized) {
    return;
  }

  try {
    await startCronJob();
    initialized = true;
  } catch (error) {
    // Error inicializando respaldos automáticos
  }
}

// Llamar automáticamente al importar (solo en servidor)
if (typeof window === 'undefined') {
  initializeBackupSystem();
}

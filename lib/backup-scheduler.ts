/**
 * Sistema de Respaldos Automáticos
 *
 * Gestiona la configuración y ejecución de respaldos programados
 */

import cron, { ScheduledTask } from 'node-cron';
import { createDatabaseBackup, deleteBackup, listBackups } from './backup-utils';
import { prisma } from './prisma';

export interface BackupConfig {
  id: number;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number | null; // 0-6 (Domingo-Sábado)
  dayOfMonth?: number | null; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  retentionDays: number;
  retentionCount?: number | null;
  lastRun?: Date | null;
  nextRun?: Date | null;
}

export interface BackupHistoryEntry {
  id: number;
  filename: string;
  backupType: 'automatic' | 'manual';
  status: 'success' | 'failed';
  sizeBytes?: number | null;
  tablesCount?: number | null;
  errorMessage?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  durationSeconds?: number | null;
  createdBy?: string | null;
  description?: string | null;
}

let cronJob: ScheduledTask | null = null;

/**
 * Obtiene la configuración actual de respaldos automáticos
 */
export async function getBackupConfig(): Promise<BackupConfig | null> {
  try {
    const config = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        enabled,
        frequency,
        day_of_week as "dayOfWeek",
        day_of_month as "dayOfMonth",
        hour,
        minute,
        retention_days as "retentionDays",
        retention_count as "retentionCount",
        last_run as "lastRun",
        next_run as "nextRun"
      FROM backup_config
      WHERE id = 1
    `;

    if (config.length === 0) return null;

    return config[0] as BackupConfig;
  } catch (error) {
    return null;
  }
}

/**
 * Actualiza la configuración de respaldos automáticos
 */
export async function updateBackupConfig(config: Partial<BackupConfig>): Promise<boolean> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (config.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(config.enabled);
    }

    if (config.frequency) {
      updates.push(`frequency = $${paramIndex++}`);
      values.push(config.frequency);
    }

    if (config.dayOfWeek !== undefined) {
      updates.push(`day_of_week = $${paramIndex++}`);
      values.push(config.dayOfWeek);
    }

    if (config.dayOfMonth !== undefined) {
      updates.push(`day_of_month = $${paramIndex++}`);
      values.push(config.dayOfMonth);
    }

    if (config.hour !== undefined) {
      updates.push(`hour = $${paramIndex++}`);
      values.push(config.hour);
    }

    if (config.minute !== undefined) {
      updates.push(`minute = $${paramIndex++}`);
      values.push(config.minute);
    }

    if (config.retentionDays !== undefined) {
      updates.push(`retention_days = $${paramIndex++}`);
      values.push(config.retentionDays);
    }

    if (config.retentionCount !== undefined) {
      updates.push(`retention_count = $${paramIndex++}`);
      values.push(config.retentionCount);
    }

    // Calcular next_run si se actualizó la programación
    if (
      config.frequency ||
      config.hour !== undefined ||
      config.minute !== undefined ||
      config.dayOfWeek !== undefined ||
      config.dayOfMonth !== undefined
    ) {
      const nextRun = calculateNextRun(config);
      updates.push(`next_run = $${paramIndex++}`);
      values.push(nextRun);
    }

    if (updates.length === 0) return false;

    const query = `
      UPDATE backup_config
      SET ${updates.join(', ')}
      WHERE id = 1
    `;

    await prisma.$executeRawUnsafe(query, ...values);

    // Reiniciar cron job si está habilitado
    if (config.enabled !== false) {
      await restartCronJob();
    } else if (config.enabled === false) {
      stopCronJob();
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Calcula la próxima fecha de ejecución basada en la configuración
 * IMPORTANTE: La hora configurada es local, pero se guarda en UTC
 */
function calculateNextRun(config: Partial<BackupConfig>): Date {
  // Obtener fecha/hora actual
  const now = new Date();

  const hourLocal = config.hour ?? 2;
  const minuteLocal = config.minute ?? 0;

  // Crear fecha para hoy con la hora configurada (HORA LOCAL)
  const next = new Date();
  next.setHours(hourLocal, minuteLocal, 0, 0);

  switch (config.frequency) {
    case 'daily':
      // Si ya pasó la hora de hoy, programar para mañana
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case 'weekly':
      const targetDay = config.dayOfWeek ?? 0;
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;

      if (daysToAdd < 0) daysToAdd += 7;
      if (daysToAdd === 0 && next <= now) daysToAdd = 7;

      next.setDate(next.getDate() + daysToAdd);
      break;

    case 'monthly':
      const targetDate = config.dayOfMonth ?? 1;
      next.setDate(targetDate);

      // Si ya pasó este mes, ir al siguiente
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}

/**
 * Genera expresión cron desde la configuración
 */
function generateCronExpression(config: BackupConfig): string {
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = config;

  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;

    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek ?? 0}`;

    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth ?? 1} * *`;

    default:
      return `${minute} ${hour} * * *`; // Default: daily
  }
}

/**
 * Ejecuta un respaldo automático
 */
async function executeAutomaticBackup(): Promise<void> {
  const startTime = new Date();
  let historyId: number | null = null;

  try {
    // Registrar inicio en historial
    const historyResult = await prisma.$queryRaw<any[]>`
      INSERT INTO backup_history (
        filename, backup_type, status, started_at, description
      )
      VALUES (
        'pending', 'automatic', 'running', ${startTime}, 'Respaldo automático programado'
      )
      RETURNING id
    `;
    historyId = historyResult[0]?.id;

    // Crear respaldo
    const result = await createDatabaseBackup(
      'Sistema Automático',
      `Respaldo automático - ${startTime.toLocaleDateString('es-MX')}`
    );

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    if (result.success && result.filename) {
      // Obtener información del respaldo
      const backups = await listBackups();
      const backup = backups.find((b) => b.filename === result.filename);

      // Actualizar historial con éxito
      if (historyId) {
        await prisma.$executeRaw`
          UPDATE backup_history
          SET 
            filename = ${result.filename},
            status = 'success',
            size_bytes = ${backup?.size ?? 0},
            tables_count = ${backup?.tables ?? 0},
            completed_at = ${endTime},
            duration_seconds = ${duration}
          WHERE id = ${historyId}
        `;
      }

      // Actualizar last_run en configuración
      await prisma.$executeRaw`
        UPDATE backup_config
        SET last_run = ${startTime}
        WHERE id = 1
      `;
      // Limpiar respaldos antiguos
      await cleanOldBackups();
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    // Actualizar historial con error
    if (historyId) {
      await prisma.$executeRaw`
        UPDATE backup_history
        SET 
          status = 'failed',
          error_message = ${errorMessage},
          completed_at = ${endTime},
          duration_seconds = ${duration}
        WHERE id = ${historyId}
      `;
    }
  }
}

/**
 * Limpia respaldos antiguos según la política de retención
 */
async function cleanOldBackups(): Promise<void> {
  try {
    const config = await getBackupConfig();
    if (!config) return;

    const backups = await listBackups();
    const now = new Date();

    // Filtrar respaldos a eliminar
    const toDelete: string[] = [];

    // Por días de retención
    if (config.retentionDays > 0) {
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

      backups.forEach((backup) => {
        const backupDate = new Date(backup.date);
        if (backupDate < cutoffDate) {
          toDelete.push(backup.filename);
        }
      });
    }

    // Por número máximo de respaldos
    if (config.retentionCount && backups.length > config.retentionCount) {
      const excess = backups.slice(config.retentionCount);
      excess.forEach((backup) => {
        if (!toDelete.includes(backup.filename)) {
          toDelete.push(backup.filename);
        }
      });
    }

    // Eliminar respaldos antiguos
    for (const filename of toDelete) {
      await deleteBackup(filename);
    }

    if (toDelete.length > 0) {
    }
  } catch (error) {}
}

/**
 * Inicia el trabajo cron para respaldos automáticos
 */
export async function startCronJob(): Promise<void> {
  try {
    const config = await getBackupConfig();

    if (!config || !config.enabled) {
      return;
    }

    const cronExpression = generateCronExpression(config);
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📅 Próximo respaldo: ${config.nextRun?.toLocaleString('es-MX') ?? 'Calculando...'}`
      );
    }

    cronJob = cron.schedule(cronExpression, async () => {
      await executeAutomaticBackup();

      // Recalcular next_run
      const newConfig = await getBackupConfig();
      if (newConfig) {
        const nextRun = calculateNextRun(newConfig);
        await prisma.$executeRaw`
          UPDATE backup_config
          SET next_run = ${nextRun}
          WHERE id = 1
        `;
      }
    });
  } catch (error) {}
}

/**
 * Detiene el trabajo cron
 */
export function stopCronJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

/**
 * Reinicia el trabajo cron
 */
export async function restartCronJob(): Promise<void> {
  stopCronJob();
  await startCronJob();
}

/**
 * Obtiene el historial de respaldos
 */
export async function getBackupHistory(limit: number = 50): Promise<BackupHistoryEntry[]> {
  try {
    const history = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        filename,
        backup_type as "backupType",
        status,
        size_bytes as "sizeBytes",
        tables_count as "tablesCount",
        error_message as "errorMessage",
        started_at as "startedAt",
        completed_at as "completedAt",
        duration_seconds as "durationSeconds",
        created_by as "createdBy",
        description
      FROM backup_history
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;

    return history as BackupHistoryEntry[];
  } catch (error) {
    return [];
  }
}

/**
 * Registra un respaldo manual en el historial
 */
export async function logManualBackup(
  filename: string,
  success: boolean,
  sizeBytes?: number,
  tablesCount?: number,
  createdBy?: string,
  description?: string,
  error?: string
): Promise<void> {
  try {
    const startTime = new Date();

    await prisma.$executeRaw`
      INSERT INTO backup_history (
        filename,
        backup_type,
        status,
        size_bytes,
        tables_count,
        error_message,
        started_at,
        completed_at,
        duration_seconds,
        created_by,
        description
      )
      VALUES (
        ${filename},
        'manual',
        ${success ? 'success' : 'failed'},
        ${sizeBytes ?? null},
        ${tablesCount ?? null},
        ${error ?? null},
        ${startTime},
        ${startTime},
        0,
        ${createdBy ?? 'Usuario'},
        ${description ?? 'Respaldo manual'}
      )
    `;
  } catch (error) {
    // Error registrando respaldo manual
  }
}

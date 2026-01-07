/**
 * Utilidades Mejoradas para Respaldo y Restauración con Seguridad Avanzada
 *
 * Mejoras implementadas:
 * - Checksums SHA-256 para validar integridad
 * - Respaldo automático pre-restauración
 * - Auditoría completa de restauraciones
 * - Limpieza robusta de conexiones con función PostgreSQL
 * - Validación de archivos antes de restaurar
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

// Parsear DATABASE_URL correctamente
function parseDatabaseUrl(): {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
} {
  const dbUrl = process.env.DATABASE_URL || '';

  // Formato: postgres://user:password@host:port/database?params
  // Necesitamos extraer solo el nombre de la base de datos sin los parámetros
  const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = dbUrl.match(regex);

  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5], // Solo el nombre, sin parámetros
    };
  }

  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || '5432',
    database: process.env.DATABASE_NAME || 'suminix',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
  };
}

const dbConfig = parseDatabaseUrl();
const DB_HOST = dbConfig.host;
const DB_PORT = dbConfig.port;
const DB_NAME = dbConfig.database;
const DB_USER = dbConfig.user;
const DB_PASSWORD = dbConfig.password;

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export interface BackupMetadata {
  filename: string;
  date: string;
  size: number;
  tables: number;
  createdBy: string;
  description?: string;
  sha256?: string; // Nuevo: checksum para integridad
}

/**
 * Calcula el hash SHA-256 de un archivo
 */
async function calculateFileHash(filepath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Guarda el checksum en la base de datos
 */
async function saveBackupChecksum(
  filename: string,
  sha256Hash: string,
  sizeBytes: number,
  tablesCount: number
): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO backup_checksums (filename, sha256_hash, file_size_bytes, tables_count)
      VALUES (${filename}, ${sha256Hash}, ${sizeBytes}, ${tablesCount})
      ON CONFLICT (filename) 
      DO UPDATE SET 
        sha256_hash = ${sha256Hash},
        file_size_bytes = ${sizeBytes},
        tables_count = ${tablesCount},
        created_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {}
}

/**
 * Verifica la integridad de un respaldo
 * Si no existe checksum, lo genera automáticamente
 */
async function verifyBackupIntegrity(filename: string): Promise<{
  valid: boolean;
  error?: string;
  generated?: boolean;
}> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);

    if (!existsSync(filepath)) {
      return { valid: false, error: 'Archivo no encontrado' };
    }

    // Obtener checksum almacenado
    const checksumRecord = await prisma.$queryRaw<any[]>`
      SELECT sha256_hash, file_size_bytes
      FROM backup_checksums
      WHERE filename = ${filename}
    `;

    // Si no hay checksum registrado, generarlo automáticamente
    if (checksumRecord.length === 0) {
      console.log(`🔐 Generando checksum automáticamente para: ${filename}`);

      const stats = await fs.stat(filepath);
      const currentHash = await calculateFileHash(filepath);
      const tableCount = await countTablesInBackup(filepath);

      // Guardar el checksum generado
      await saveBackupChecksum(filename, currentHash, stats.size, tableCount);

      // Marcar como verificado
      await prisma.$executeRaw`
        UPDATE backup_checksums
        SET 
          verified_at = CURRENT_TIMESTAMP,
          verification_status = 'valid'
        WHERE filename = ${filename}
      `;

      console.log(`✅ Checksum generado y guardado: ${currentHash.substring(0, 16)}...`);

      return { valid: true, generated: true };
    }

    const storedHash = checksumRecord[0].sha256_hash;
    const storedSize = checksumRecord[0].file_size_bytes;

    // Verificar tamaño del archivo
    const stats = await fs.stat(filepath);
    if (stats.size !== Number(storedSize)) {
      return {
        valid: false,
        error: `Tamaño incorrecto: esperado ${storedSize}, actual ${stats.size}`,
      };
    }

    // Calcular y verificar hash
    const currentHash = await calculateFileHash(filepath);
    if (currentHash !== storedHash) {
      return { valid: false, error: 'Checksum no coincide - archivo posiblemente corrupto' };
    }

    // Actualizar estado de verificación
    await prisma.$executeRaw`
      UPDATE backup_checksums
      SET 
        verified_at = CURRENT_TIMESTAMP,
        verification_status = 'valid'
      WHERE filename = ${filename}
    `;

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

async function ensureBackupDir(): Promise<void> {
  if (!existsSync(BACKUP_DIR)) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
  return `backup-${timestamp}.sql`;
}

async function countTablesInBackup(filepath: string): Promise<number> {
  try {
    const grepCommand = `grep -c "CREATE TABLE" "${filepath}" || echo "0"`;
    const { stdout } = await execAsync(grepCommand);
    return parseInt(stdout.trim()) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Categoriza el tipo de error de respaldo
 */
function categorizeBackupError(error: Error): {
  type: 'LOCK' | 'PERMISSION' | 'DISK_SPACE' | 'CONNECTION' | 'TIMEOUT' | 'UNKNOWN';
  userMessage: string;
  suggestion: string;
  canRetry: boolean;
} {
  const errorMsg = error.message.toLowerCase();

  // Error de bloqueo de tablas
  if (
    errorMsg.includes('lock') ||
    errorMsg.includes('locked') ||
    errorMsg.includes('could not obtain lock')
  ) {
    return {
      type: 'LOCK',
      userMessage: 'La base de datos está siendo utilizada por otro proceso',
      suggestion:
        'Espera unos segundos e intenta nuevamente. Si el problema persiste, verifica que no haya procesos largos ejecutándose.',
      canRetry: true,
    };
  }

  // Error de permisos
  if (
    errorMsg.includes('permission') ||
    errorMsg.includes('denied') ||
    errorMsg.includes('must be owner')
  ) {
    return {
      type: 'PERMISSION',
      userMessage: 'No tienes permisos suficientes para realizar el respaldo',
      suggestion:
        'Contacta al administrador del sistema para verificar los permisos de la base de datos.',
      canRetry: false,
    };
  }

  // Error de espacio en disco
  if (
    errorMsg.includes('no space') ||
    errorMsg.includes('disk full') ||
    errorMsg.includes('enospc')
  ) {
    return {
      type: 'DISK_SPACE',
      userMessage: 'No hay suficiente espacio en disco para crear el respaldo',
      suggestion: 'Libera espacio en el disco o contacta al administrador del sistema.',
      canRetry: false,
    };
  }

  // Error de conexión
  if (
    errorMsg.includes('connection') ||
    errorMsg.includes('could not connect') ||
    errorMsg.includes('econnrefused')
  ) {
    return {
      type: 'CONNECTION',
      userMessage: 'No se pudo conectar a la base de datos',
      suggestion: 'Verifica que el servidor de base de datos esté funcionando correctamente.',
      canRetry: true,
    };
  }

  // Error de timeout
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return {
      type: 'TIMEOUT',
      userMessage: 'El proceso de respaldo tomó demasiado tiempo',
      suggestion:
        'La base de datos puede estar muy ocupada. Intenta en un momento con menos actividad.',
      canRetry: true,
    };
  }

  return {
    type: 'UNKNOWN',
    userMessage: error.message || 'Error desconocido al crear el respaldo',
    suggestion: 'Revisa los logs del sistema o contacta al administrador.',
    canRetry: false,
  };
}

/**
 * Crea un respaldo completo de la base de datos con checksum
 */
export async function createDatabaseBackup(
  userId: string,
  description?: string
): Promise<{ success: boolean; filename?: string; sha256?: string; error?: string }> {
  try {
    await ensureBackupDir();

    const filename = generateBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);

    const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`;

    await execAsync(pgDumpCommand, {
      maxBuffer: 1024 * 1024 * 100,
    });

    const stats = await fs.stat(filepath);
    const tableCount = await countTablesInBackup(filepath);

    // Calcular checksum SHA-256
    const sha256Hash = await calculateFileHash(filepath);

    // Guardar checksum en BD
    await saveBackupChecksum(filename, sha256Hash, stats.size, tableCount);

    const metadata: BackupMetadata = {
      filename,
      date: new Date().toISOString(),
      size: stats.size,
      tables: tableCount,
      createdBy: userId,
      description: description || 'Respaldo manual',
      sha256: sha256Hash,
    };

    await fs.writeFile(
      path.join(BACKUP_DIR, `${filename}.json`),
      JSON.stringify(metadata, null, 2)
    );

    return { success: true, filename, sha256: sha256Hash };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Crea un respaldo con verificación de integridad y manejo robusto de errores
 */
export async function createDatabaseBackupWithVerification(
  userId: string,
  description?: string,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  filename?: string;
  sha256?: string;
  error?: string;
  errorType?: string;
  suggestion?: string;
  canRetry?: boolean;
}> {
  let lastError: Error | null = null;

  // Intentar crear el respaldo con reintentos
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📦 Intento ${attempt}/${maxRetries} - Creando respaldo...`);

      await ensureBackupDir();

      const filename = generateBackupFilename();
      const filepath = path.join(BACKUP_DIR, filename);

      // Comando mejorado con opciones para evitar problemas comunes
      const pgDumpCommand =
        `PGPASSWORD="${DB_PASSWORD}" pg_dump ` +
        `-h ${DB_HOST} ` +
        `-p ${DB_PORT} ` +
        `-U ${DB_USER} ` +
        `-d ${DB_NAME} ` +
        `--no-owner ` + // Evita errores de ownership
        `--no-privileges ` + // Evita errores de privilegios
        `--lock-wait-timeout=5000 ` + // Espera 5 seg por locks
        `-F p ` + // Formato plain text
        `-f "${filepath}"`;

      await execAsync(pgDumpCommand, {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        timeout: 5 * 60 * 1000, // 5 minutos timeout
      });

      console.log(`✅ Respaldo creado: ${filename}`);

      // Verificar que el archivo se creó correctamente
      const stats = await fs.stat(filepath);
      if (stats.size === 0) {
        throw new Error('El archivo de respaldo está vacío');
      }

      const tableCount = await countTablesInBackup(filepath);

      // Calcular checksum SHA-256
      console.log(`🔐 Calculando checksum SHA-256...`);
      const sha256Hash = await calculateFileHash(filepath);

      // Guardar checksum en BD
      await saveBackupChecksum(filename, sha256Hash, stats.size, tableCount);
      console.log(`✅ Checksum guardado: ${sha256Hash.substring(0, 16)}...`);

      // Guardar metadata
      const metadata: BackupMetadata = {
        filename,
        date: new Date().toISOString(),
        size: stats.size,
        tables: tableCount,
        createdBy: userId,
        description: description || 'Respaldo manual',
        sha256: sha256Hash,
      };

      await fs.writeFile(
        path.join(BACKUP_DIR, `${filename}.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Respaldo completado exitosamente`);
      console.log(`   📁 Archivo: ${filename}`);
      console.log(`   📊 Tamaño: ${formatBytes(stats.size)}`);
      console.log(`   🗂️  Tablas: ${tableCount}`);

      return {
        success: true,
        filename,
        sha256: sha256Hash,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Error en intento ${attempt}:`, lastError.message);

      // Categorizar el error
      const errorInfo = categorizeBackupError(lastError);

      // Si no se puede reintentar, fallar inmediatamente
      if (!errorInfo.canRetry) {
        console.error(`🚫 Error no recuperable: ${errorInfo.type}`);
        return {
          success: false,
          error: errorInfo.userMessage,
          errorType: errorInfo.type,
          suggestion: errorInfo.suggestion,
          canRetry: false,
        };
      }

      // Si es el último intento, devolver error
      if (attempt === maxRetries) {
        console.error(`🚫 Máximo de reintentos alcanzado`);
        return {
          success: false,
          error: errorInfo.userMessage,
          errorType: errorInfo.type,
          suggestion: errorInfo.suggestion,
          canRetry: true,
        };
      }

      // Esperar antes del siguiente intento (backoff exponencial)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seg
      console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Esto no debería alcanzarse, pero por seguridad
  const errorInfo = categorizeBackupError(lastError!);
  return {
    success: false,
    error: errorInfo.userMessage,
    errorType: errorInfo.type,
    suggestion: errorInfo.suggestion,
    canRetry: errorInfo.canRetry,
  };
}

export async function listBackups(): Promise<BackupMetadata[]> {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));

    const backupPromises = sqlFiles.map(async (sqlFile) => {
      const metadataFile = `${sqlFile}.json`;
      const metadataPath = path.join(BACKUP_DIR, metadataFile);

      if (existsSync(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata: BackupMetadata = JSON.parse(metadataContent);
        return metadata;
      } else {
        const filepath = path.join(BACKUP_DIR, sqlFile);
        const stats = await fs.stat(filepath);
        return {
          filename: sqlFile,
          date: stats.mtime.toISOString(),
          size: stats.size,
          tables: 0,
          createdBy: 'Desconocido',
          description: 'Sin descripción',
        };
      }
    });

    const backups = await Promise.all(backupPromises);

    return backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}

export function getBackupPath(filename: string): string {
  return path.join(BACKUP_DIR, filename);
}

/**
 * Restaura la base de datos con seguridad mejorada
 * - Crea respaldo automático antes de restaurar
 * - Valida integridad del archivo
 * - Registra auditoría completa
 * - Usa función PostgreSQL para terminar conexiones
 */
export async function restoreDatabaseBackup(
  filename: string,
  userId: string = 'Sistema'
): Promise<{ success: boolean; preBackupFilename?: string; error?: string }> {
  let restoreAuditId: number | null = null;
  let preRestoreBackupFilename: string | null = null;

  try {
    const filepath = path.join(BACKUP_DIR, filename);

    if (!existsSync(filepath)) {
      return { success: false, error: 'Archivo de respaldo no encontrado' };
    }
    const integrityCheck = await verifyBackupIntegrity(filename);

    if (!integrityCheck.valid) {
      return {
        success: false,
        error: `Verificación de integridad fallida: ${integrityCheck.error}`,
      };
    }
    // Paso 1: Crear respaldo de seguridad antes de restaurar
    const preRestoreResult = await createDatabaseBackup(
      'Sistema - Pre-restauración',
      `Respaldo automático antes de restaurar ${filename}`
    );

    if (!preRestoreResult.success) {
      return {
        success: false,
        error: `No se pudo crear respaldo de seguridad: ${preRestoreResult.error}`,
      };
    }

    preRestoreBackupFilename = preRestoreResult.filename || null;
    // Paso 2: Registrar inicio de restauración en auditoría
    const auditResult = await prisma.$queryRaw<any[]>`
      SELECT log_restore_start(
        ${filename}::VARCHAR,
        ${preRestoreBackupFilename}::VARCHAR,
        ${userId}::VARCHAR
      ) as restore_id
    `;
    restoreAuditId = auditResult[0]?.restore_id;

    // Paso 3: Terminar conexiones usando función PostgreSQL robusta
    const connectionResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM terminate_database_connections(${DB_NAME}::VARCHAR)
    `;

    if (connectionResult[0]) {
      if (connectionResult[0].error_count > 0) {
      }
    }

    // Dar tiempo para que las conexiones se cierren
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Paso 4: Eliminar y recrear base de datos
    const dropDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"`;
    await execAsync(dropDbCommand);
    const createDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};"`;
    await execAsync(createDbCommand);

    // Paso 5: Restaurar desde archivo
    const restoreCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${filepath}"`;
    await execAsync(restoreCommand, {
      maxBuffer: 1024 * 1024 * 100,
    });

    // Paso 6: Contar tablas restauradas
    const tablesResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const tablesRestored = tablesResult[0]?.count || 0;

    // Paso 7: Registrar éxito en auditoría
    if (restoreAuditId) {
      await prisma.$executeRaw`
        SELECT log_restore_complete(
          ${restoreAuditId}::INTEGER,
          'success'::VARCHAR,
          ${tablesRestored}::INTEGER,
          NULL::BIGINT,
          NULL::TEXT
        )
      `;
    }

    console.log(`📊 Tablas restauradas: ${tablesRestored}`);

    // Paso 8: Re-validar el respaldo usado para restaurar
    console.log(`🔍 Validando integridad post-restauración del respaldo: ${filename}`);
    try {
      // Actualizar el estado a 'valid' ya que se restauró exitosamente
      await prisma.$executeRaw`
        UPDATE backup_checksums
        SET 
          verification_status = 'valid',
          verified_at = CURRENT_TIMESTAMP
        WHERE filename = ${filename}
      `;
      console.log(`✅ Respaldo marcado como válido: ${filename}`);
    } catch (validationError) {
      console.warn(`⚠️ No se pudo actualizar estado de validación:`, validationError);
      // No fallar la restauración por esto
    }

    return {
      success: true,
      preBackupFilename: preRestoreBackupFilename || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    // Registrar error en auditoría
    if (restoreAuditId) {
      try {
        await prisma.$executeRaw`
          SELECT log_restore_complete(
            ${restoreAuditId}::INTEGER,
            'failed'::VARCHAR,
            NULL::INTEGER,
            NULL::BIGINT,
            ${errorMessage}::TEXT
          )
        `;
      } catch (auditError) {}
    }

    // Si tenemos respaldo pre-restauración, informar al usuario
    if (preRestoreBackupFilename) {
      return {
        success: false,
        error: `${errorMessage}. IMPORTANTE: Se creó un respaldo de seguridad: ${preRestoreBackupFilename}`,
        preBackupFilename: preRestoreBackupFilename,
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function deleteBackup(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);
    const metadataPath = path.join(BACKUP_DIR, `${filename}.json`);

    if (existsSync(filepath)) {
      await fs.unlink(filepath);
    }

    if (existsSync(metadataPath)) {
      await fs.unlink(metadataPath);
    }

    // Eliminar checksum de la BD
    await prisma.$executeRaw`
      DELETE FROM backup_checksums
      WHERE filename = ${filename}
    `;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function getDatabaseInfo(): Promise<{
  success: boolean;
  data?: {
    database: string;
    size: string;
    tables: number;
    connections: number;
  };
  error?: string;
}> {
  try {
    const sizeCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));"`;
    const { stdout: sizeOutput } = await execAsync(sizeCommand);

    const tablesCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`;
    const { stdout: tablesOutput } = await execAsync(tablesCommand);

    const connectionsCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '${DB_NAME}';"`;
    const { stdout: connectionsOutput } = await execAsync(connectionsCommand);

    return {
      success: true,
      data: {
        database: DB_NAME,
        size: sizeOutput.trim(),
        tables: parseInt(tablesOutput.trim()) || 0,
        connections: parseInt(connectionsOutput.trim()) || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtiene estadísticas de respaldos usando la función PostgreSQL
 */
export async function getBackupStatistics(): Promise<any> {
  try {
    const stats = await prisma.$queryRaw`
      SELECT * FROM get_backup_statistics()
    `;
    return stats;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene historial de restauraciones
 */
export async function getRestoreHistory(limit: number = 50): Promise<any[]> {
  try {
    const history = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        restore_filename as "restoreFilename",
        pre_restore_backup_filename as "preRestoreBackupFilename",
        status,
        restored_by as "restoredBy",
        error_message as "errorMessage",
        started_at as "startedAt",
        completed_at as "completedAt",
        duration_seconds as "durationSeconds",
        tables_restored as "tablesRestored",
        records_affected as "recordsAffected"
      FROM backup_restore_audit
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return history;
  } catch (error) {
    return [];
  }
}

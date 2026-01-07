/**
 * Utilidades para Respaldo y Restauración de Base de Datos PostgreSQL
 *
 * Funcionalidades:
 * - Crear respaldos completos de la BD
 * - Restaurar desde respaldos
 * - Listar respaldos disponibles
 * - Obtener información de respaldos
 * - Eliminar respaldos antiguos
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

  // Fallback a variables individuales
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

// Directorio de respaldos
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Interface para metadata de backup
export interface BackupMetadata {
  filename: string;
  date: string;
  size: number;
  tables: number;
  createdBy: string;
  description?: string;
}

/**
 * Asegura que el directorio de respaldos existe
 */
async function ensureBackupDir(): Promise<void> {
  if (!existsSync(BACKUP_DIR)) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Genera nombre de archivo para el respaldo
 */
function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
  return `backup-${timestamp}.sql`;
}

/**
 * Cuenta tablas de forma optimizada usando grep (no carga el archivo completo en memoria)
 */
async function countTablesInBackup(filepath: string): Promise<number> {
  try {
    // Usar grep para contar "CREATE TABLE" sin cargar el archivo completo
    const grepCommand = `grep -c "CREATE TABLE" "${filepath}" || echo "0"`;
    const { stdout } = await execAsync(grepCommand);
    return parseInt(stdout.trim()) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Crea un respaldo completo de la base de datos
 */
export async function createDatabaseBackup(
  userId: string,
  description?: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    await ensureBackupDir();

    const filename = generateBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);

    // Comando pg_dump con variables de entorno
    const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`;

    // Ejecutar pg_dump
    await execAsync(pgDumpCommand, {
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    // Obtener información del archivo
    const stats = await fs.stat(filepath);

    // Contar tablas de forma optimizada (sin cargar archivo completo en memoria)
    const tableCount = await countTablesInBackup(filepath);

    // Crear archivo de metadata
    const metadata: BackupMetadata = {
      filename,
      date: new Date().toISOString(),
      size: stats.size,
      tables: tableCount,
      createdBy: userId,
      description: description || 'Respaldo manual',
    };

    await fs.writeFile(
      path.join(BACKUP_DIR, `${filename}.json`),
      JSON.stringify(metadata, null, 2)
    );

    return { success: true, filename };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Lista todos los respaldos disponibles (optimizado con lectura paralela)
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));

    // Leer todos los metadatos en paralelo (mucho más rápido)
    const backupPromises = sqlFiles.map(async (sqlFile) => {
      const metadataFile = `${sqlFile}.json`;
      const metadataPath = path.join(BACKUP_DIR, metadataFile);

      if (existsSync(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata: BackupMetadata = JSON.parse(metadataContent);
        return metadata;
      } else {
        // Si no hay metadata, crear una básica
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

    // Ordenar por fecha descendente (más reciente primero)
    return backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}

/**
 * Obtiene la ruta completa de un archivo de respaldo
 */
export function getBackupPath(filename: string): string {
  return path.join(BACKUP_DIR, filename);
}

/**
 * Restaura la base de datos desde un respaldo
 * ADVERTENCIA: Esta operación sobrescribirá todos los datos actuales
 */
export async function restoreDatabaseBackup(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);

    // Verificar que el archivo existe
    if (!existsSync(filepath)) {
      return { success: false, error: 'Archivo de respaldo no encontrado' };
    }

    // Primero, terminar todas las conexiones activas a la BD
    const terminateConnectionsCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"`;

    try {
      await execAsync(terminateConnectionsCommand);
    } catch (err) {}

    // Eliminar la base de datos existente
    const dropDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"`;
    await execAsync(dropDbCommand);

    // Crear la base de datos nuevamente
    const createDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};"`;
    await execAsync(createDbCommand);

    // Restaurar desde el archivo
    const restoreCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${filepath}"`;
    await execAsync(restoreCommand, {
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un archivo de respaldo
 */
export async function deleteBackup(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);
    const metadataPath = path.join(BACKUP_DIR, `${filename}.json`);

    // Eliminar archivo SQL
    if (existsSync(filepath)) {
      await fs.unlink(filepath);
    }

    // Eliminar metadata
    if (existsSync(metadataPath)) {
      await fs.unlink(metadataPath);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene información general de la base de datos
 */
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
    // Obtener tamaño de la BD
    const sizeCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));"`;
    const { stdout: sizeOutput } = await execAsync(sizeCommand);

    // Obtener número de tablas
    const tablesCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`;
    const { stdout: tablesOutput } = await execAsync(tablesCommand);

    // Obtener conexiones activas
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

/**
 * Formatea bytes a tamaño legible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

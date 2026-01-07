/**
 * PostgreSQL Backup Manager
 * Sistema de respaldos usando pg_dump/pg_restore (método oficial de PostgreSQL)
 */

import { exec } from 'child_process';
import crypto from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupOptions {
  format?: 'custom' | 'plain';
  compress?: number; // 0-9
  description?: string;
}

export interface BackupResult {
  success: boolean;
  filename: string;
  filepath: string;
  size: number;
  sizeFormatted: string;
  timestamp: Date;
  format: string;
  checksum?: string;
  tables?: number;
}

export interface RestoreOptions {
  createNew?: boolean;
  targetDb?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  details: {
    tablesFound: number;
    objectsCount: {
      functions: number;
      indexes: number;
      constraints: number;
      sequences: number;
    };
    format: string;
    fileSize: number;
  };
}

export class PgBackupManager {
  private backupDir: string;
  private dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor(backupDirectory?: string) {
    this.backupDir = backupDirectory || path.join(process.cwd(), 'backups');

    // Obtener configuración de la base de datos desde DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || '';
    const urlMatch = dbUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

    if (urlMatch) {
      const [, user, password, host, port, database] = urlMatch;
      this.dbConfig = {
        host,
        port: parseInt(port),
        user,
        password,
        database: database.trim(), // Remover espacios
      };
    } else {
      throw new Error('DATABASE_URL no está configurada correctamente');
    }
  }

  /**
   * Detecta la ruta de pg_dump según el sistema operativo
   */
  private getPgDumpPath(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows
      return 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe';
    } else if (platform === 'darwin') {
      // macOS
      return '/Library/PostgreSQL/17/bin/pg_dump';
    } else {
      // Linux (asume instalación por defecto)
      return '/usr/bin/pg_dump';
    }
  }

  /**
   * Detecta la ruta de pg_restore según el sistema operativo
   */
  private getPgRestorePath(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows
      return 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_restore.exe';
    } else if (platform === 'darwin') {
      // macOS
      return '/Library/PostgreSQL/17/bin/pg_restore';
    } else {
      // Linux
      return '/usr/bin/pg_restore';
    }
  }

  /**
   * Detecta la ruta de psql según el sistema operativo
   */
  private getPsqlPath(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows
      return 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
    } else if (platform === 'darwin') {
      // macOS
      return '/Library/PostgreSQL/17/bin/psql';
    } else {
      // Linux
      return '/usr/bin/psql';
    }
  }

  /**
   * Crear respaldo de la base de datos usando pg_dump
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const { format = 'custom', compress = 9, description } = options;
    // Evitar warning si description no se usa en el flujo actual
    void description;

    // Asegurar que existe el directorio
    await fs.mkdir(this.backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'custom' ? 'backup' : 'sql';
    const filename = `suminix-${timestamp}.${extension}`;
    const filepath = path.join(this.backupDir, filename);

    // Construir comando pg_dump con path dinámico según OS
    const pgDumpPath = this.getPgDumpPath();
    const command = [
      `"${pgDumpPath}"`,
      `-U ${this.dbConfig.user}`,
      `-h ${this.dbConfig.host}`,
      `-p ${this.dbConfig.port}`,
      `-d ${this.dbConfig.database}`,
      `--format=${format}`,
      format === 'custom' ? `--compress=${compress}` : '',
      '--verbose',
      `--file="${filepath}"`,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      console.log('[PgBackup] Iniciando respaldo:', filename);

      await execAsync(command, {
        env: { ...process.env, PGPASSWORD: this.dbConfig.password },
        maxBuffer: 1024 * 1024 * 200, // 200MB buffer
      });

      const stats = await fs.stat(filepath);

      // Calcular checksum SHA-256
      const checksum = await this.calculateChecksum(filepath);

      // Validar el respaldo
      const validation = await this.validateBackup(filename);

      console.log('[PgBackup] Respaldo completado exitosamente:', {
        filename,
        size: this.formatBytes(stats.size),
        checksum: checksum.substring(0, 16) + '...',
        tables: validation.details.tablesFound,
      });

      return {
        success: true,
        filename,
        filepath,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        timestamp: new Date(),
        format,
        checksum,
        tables: validation.details.tablesFound,
      };
    } catch (error: any) {
      void error;
      console.error('[PgBackup] Error creando respaldo:', error);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Listar todos los respaldos disponibles
   */
  async listBackups() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter((f) => f.endsWith('.backup') || f.endsWith('.sql'));

      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filepath = path.join(this.backupDir, filename);
          const stats = await fs.stat(filepath);

          // Intentar leer metadata si existe
          const metadataPath = filepath + '.meta.json';
          let metadata: any = {};
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent);
          } catch {
            // No hay metadata, continuar
          }

          return {
            filename,
            filepath,
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            timestamp: stats.birthtime.toISOString(), // Formato ISO para el frontend
            created: stats.birthtime,
            modified: stats.mtime,
            format: filename.endsWith('.backup') ? 'custom' : 'sql',
            checksum: metadata.checksum,
            description: metadata.description,
            tables: metadata.tables,
            createdBy: metadata.createdBy || 'Sistema',
            validationStatus: metadata.validationStatus || 'pending',
            validationDate: metadata.validationDate,
            validationDetails: metadata.validationDetails,
          };
        })
      );

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error: any) {
      void error;
      console.error('[PgBackup] Error listando respaldos:', error);
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  /**
   * Validar integridad de un respaldo
   */
  async validateBackup(filename: string): Promise<ValidationResult> {
    const filepath = path.join(this.backupDir, filename);

    try {
      // Verificar que existe
      await fs.access(filepath);

      const isCustomFormat = filename.endsWith('.backup');
      let listOutput: string;

      if (isCustomFormat) {
        // Usar pg_restore --list para validar con path dinámico
        const pgRestorePath = this.getPgRestorePath();
        const { stdout } = await execAsync(`"${pgRestorePath}" --list "${filepath}"`, {
          env: { ...process.env, PGPASSWORD: this.dbConfig.password },
        });
        listOutput = stdout;
      } else {
        // Para SQL plano, verificar que no esté corrupto
        const content = await fs.readFile(filepath, 'utf-8');
        if (!content.includes('PostgreSQL database dump') && !content.includes('CREATE TABLE')) {
          return {
            valid: false,
            errors: ['Archivo SQL no parece ser un respaldo válido de PostgreSQL'],
            details: {
              tablesFound: 0,
              objectsCount: { functions: 0, indexes: 0, constraints: 0, sequences: 0 },
              format: 'sql',
              fileSize: (await fs.stat(filepath)).size,
            },
          };
        }
        listOutput = content;
      }

      // Contar objetos en el respaldo
      const tables = (listOutput.match(/TABLE DATA/g) || []).length;
      const functions = (listOutput.match(/FUNCTION/g) || []).length;
      const indexes = (listOutput.match(/INDEX/g) || []).length;
      const constraints = (listOutput.match(/CONSTRAINT/g) || []).length;
      const sequences = (listOutput.match(/SEQUENCE/g) || []).length;

      const valid = tables > 0;
      const errors: string[] = [];

      if (tables === 0) {
        errors.push('No se encontraron tablas en el respaldo');
      }

      // Guardar resultado de validación en metadata
      await this.saveMetadata(filename, {
        validationStatus: valid ? 'valid' : 'invalid',
        validationDate: new Date().toISOString(),
        validationDetails: {
          tablesFound: tables,
          objectsCount: { functions, indexes, constraints, sequences },
        },
      });

      return {
        valid,
        errors,
        details: {
          tablesFound: tables,
          objectsCount: { functions, indexes, constraints, sequences },
          format: isCustomFormat ? 'custom' : 'sql',
          fileSize: (await fs.stat(filepath)).size,
        },
      };
    } catch (error: any) {
      void error;
      console.error('[PgBackup] Error validando respaldo:', error);
      return {
        valid: false,
        errors: [error.message || 'Error desconocido al validar'],
        details: {
          tablesFound: 0,
          objectsCount: { functions: 0, indexes: 0, constraints: 0, sequences: 0 },
          format: filename.endsWith('.backup') ? 'custom' : 'sql',
          fileSize: 0,
        },
      };
    }
  }

  /**
   * Restaurar base de datos desde un respaldo
   */
  async restoreBackup(filename: string, options: RestoreOptions = {}): Promise<any> {
    const filepath = path.join(this.backupDir, filename);
    const { createNew = false, targetDb = this.dbConfig.database } = options;

    // Verificar que existe el archivo
    try {
      await fs.access(filepath);
    } catch {
      throw new Error(`Backup file not found: ${filename}`);
    }

    const finalTargetDb = createNew ? `${targetDb}_restored_${Date.now()}` : targetDb;

    try {
      console.log('[PgBackup] Iniciando restauración:', filename);

      // Paso 1: Crear respaldo pre-restauración
      console.log('[PgBackup] Creando respaldo de seguridad...');
      const preBackup = await this.createBackup({
        format: 'custom',
        compress: 9,
        description: `Pre-restauración automática - ${new Date().toLocaleString()}`,
      });
      console.log('[PgBackup] Pre-backup creado:', preBackup.filename);

      // Paso 2: Terminar conexiones activas
      console.log('[PgBackup] Terminando conexiones activas...');
      await this.terminateConnections(targetDb);

      // Paso 3: Eliminar y recrear base de datos si no es nueva
      if (!createNew) {
        console.log('[PgBackup] Eliminando base de datos actual...');
        await this.dropDatabase(targetDb);
      }

      console.log('[PgBackup] Creando base de datos...');
      await this.createDatabase(finalTargetDb);

      // Paso 4: Restaurar
      console.log('[PgBackup] Restaurando datos...');
      const isCustomFormat = filename.endsWith('.backup');
      let restoreCmd: string;

      const pgRestorePath = this.getPgRestorePath();
      const psqlPath = this.getPsqlPath();

      if (isCustomFormat) {
        restoreCmd = [
          `"${pgRestorePath}"`,
          `-U ${this.dbConfig.user}`,
          `-h ${this.dbConfig.host}`,
          `-p ${this.dbConfig.port}`,
          `-d ${finalTargetDb}`,
          '--verbose',
          '--clean',
          '--if-exists',
          `"${filepath}"`,
        ].join(' ');
      } else {
        restoreCmd = [
          `"${psqlPath}"`,
          `-U ${this.dbConfig.user}`,
          `-h ${this.dbConfig.host}`,
          `-p ${this.dbConfig.port}`,
          `-d ${finalTargetDb}`,
          `-f "${filepath}"`,
        ].join(' ');
      }

      await execAsync(restoreCmd, {
        env: { ...process.env, PGPASSWORD: this.dbConfig.password },
        maxBuffer: 1024 * 1024 * 200, // 200MB
      });

      // Paso 5: Verificar
      console.log('[PgBackup] Verificando restauración...');
      const verification = await this.verifyRestore(finalTargetDb);

      console.log('[PgBackup] Restauración completada exitosamente:', verification);

      return {
        success: true,
        message: 'Database restored successfully',
        targetDatabase: finalTargetDb,
        preBackup: preBackup.filename,
        verification,
      };
    } catch (error: any) {
      void error;
      console.error('[PgBackup] Error en restauración:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Eliminar un respaldo
   */
  async deleteBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    const metadataPath = filepath + '.meta.json';

    try {
      await fs.unlink(filepath);
      // Intentar eliminar metadata también
      try {
        await fs.unlink(metadataPath);
      } catch {
        // No importa si no existe
      }
      console.log('[PgBackup] Respaldo eliminado:', filename);
    } catch (error: any) {
      void error;
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  /**
   * Limpiar respaldos antiguos
   */
  async cleanOldBackups(daysToKeep: number = 30): Promise<{ deleted: number; files: string[] }> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted: string[] = [];

    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        await this.deleteBackup(backup.filename);
        deleted.push(backup.filename);
      }
    }

    console.log(`[PgBackup] Limpieza completada: ${deleted.length} respaldos eliminados`);

    return {
      deleted: deleted.length,
      files: deleted,
    };
  }

  /**
   * Calcular checksum SHA-256 de un archivo
   */
  private async calculateChecksum(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filepath);

      stream.on('data', (data: string | Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Guardar metadata adicional del respaldo
   */
  private async saveMetadata(filename: string, additionalData: any = {}): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    const metadataPath = filepath + '.meta.json';

    try {
      // Leer metadata existente si existe
      let existing: any = {};
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        existing = JSON.parse(content);
      } catch {
        // No existe, crear nuevo
      }

      // Merge con nuevos datos
      const metadata = {
        ...existing,
        ...additionalData,
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('[PgBackup] Error guardando metadata:', error);
      // No es crítico, continuar
    }
  }

  /**
   * Terminar todas las conexiones activas a una BD
   */
  private async terminateConnections(database: string): Promise<void> {
    const psqlPath = '/Library/PostgreSQL/17/bin/psql';
    const cmd = [
      psqlPath,
      `-U ${this.dbConfig.user}`,
      `-h ${this.dbConfig.host}`,
      `-p ${this.dbConfig.port}`,
      '-d postgres',
      `-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid();"`,
    ].join(' ');

    try {
      await execAsync(cmd, {
        env: { ...process.env, PGPASSWORD: this.dbConfig.password },
      });
    } catch {
      // Ignorar errores si no hay conexiones
    }
  }

  /**
   * Eliminar base de datos
   */
  private async dropDatabase(database: string): Promise<void> {
    try {
      const cmd = `dropdb -U ${this.dbConfig.user} -h ${this.dbConfig.host} -p ${this.dbConfig.port} ${database}`;
      await execAsync(cmd, {
        env: { ...process.env, PGPASSWORD: this.dbConfig.password },
      });
    } catch {
      // Ignorar si no existe
    }
  }

  /**
   * Crear base de datos
   */
  private async createDatabase(database: string): Promise<void> {
    const cmd = `createdb -U ${this.dbConfig.user} -h ${this.dbConfig.host} -p ${this.dbConfig.port} ${database}`;
    await execAsync(cmd, {
      env: { ...process.env, PGPASSWORD: this.dbConfig.password },
    });
  }

  /**
   * Verificar integridad después de restaurar
   */
  private async verifyRestore(database: string): Promise<any> {
    const queries = [
      { key: 'users', query: 'SELECT COUNT(*) FROM users' },
      { key: 'productos', query: 'SELECT COUNT(*) FROM inventario' },
      { key: 'entradas', query: 'SELECT COUNT(*) FROM entradas_inventario' },
      { key: 'salidas', query: 'SELECT COUNT(*) FROM salidas_inventario' },
      { key: 'partidas_entrada', query: 'SELECT COUNT(*) FROM partidas_entrada_inventario' },
      { key: 'partidas_salida', query: 'SELECT COUNT(*) FROM partidas_salida_inventario' },
    ];

    const results: any = {};

    const psqlPath = '/Library/PostgreSQL/17/bin/psql';

    for (const { key, query } of queries) {
      try {
        const cmd = [
          psqlPath,
          `-U ${this.dbConfig.user}`,
          `-h ${this.dbConfig.host}`,
          `-p ${this.dbConfig.port}`,
          `-d ${database}`,
          '-t',
          `-c "${query}"`,
        ].join(' ');

        const { stdout } = await execAsync(cmd, {
          env: { ...process.env, PGPASSWORD: this.dbConfig.password },
        });

        const match = stdout.match(/(\d+)/);
        results[key] = match ? parseInt(match[1]) : 0;
      } catch (error) {
        void error;
        results[key] = 0;
      }
    }

    return results;
  }

  /**
   * Formatear bytes a formato legible
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtener información de la base de datos
   */
  async getDatabaseInfo(): Promise<any> {
    try {
      const queries = {
        size: `SELECT pg_size_pretty(pg_database_size('${this.dbConfig.database}')) as size`,
        tables: `SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public'`,
        connections: `SELECT COUNT(*) as connections FROM pg_stat_activity WHERE datname = '${this.dbConfig.database}'`,
      };

      const results: any = {
        database: this.dbConfig.database,
      };

      const psqlPath = '/Library/PostgreSQL/17/bin/psql';

      for (const [key, query] of Object.entries(queries)) {
        const cmd = [
          psqlPath,
          `-U ${this.dbConfig.user}`,
          `-h ${this.dbConfig.host}`,
          `-p ${this.dbConfig.port}`,
          `-d ${this.dbConfig.database}`,
          '-t',
          `-c "${query}"`,
        ].join(' ');

        const { stdout } = await execAsync(cmd, {
          env: { ...process.env, PGPASSWORD: this.dbConfig.password },
        });

        results[key] = stdout.trim();
      }

      return results;
    } catch (error: any) {
      void error;
      console.error('[PgBackup] Error obteniendo info de BD:', error);
      return {
        database: this.dbConfig.database,
        size: 'N/A',
        tables: 0,
        connections: 0,
      };
    }
  }
}

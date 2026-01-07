/**
 * Script para calcular checksums SHA-256 de respaldos existentes sin checksum
 * 
 * Este script:
 * 1. Busca todos los archivos .sql en backups/
 * 2. Verifica si tienen checksum en la base de datos
 * 3. Calcula y guarda el checksum para los que no tienen
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * Calcula el hash SHA-256 de un archivo
 */
async function calculateFileHash(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filepath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Cuenta tablas en el respaldo SQL
 */
async function countTablesInBackup(filepath: string): Promise<number> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const grepCommand = `grep -c "^CREATE TABLE" "${filepath}"`;
    const { stdout } = await execAsync(grepCommand);
    return parseInt(stdout.trim()) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Procesa un archivo de respaldo
 */
async function processBackupFile(filename: string): Promise<void> {
  const filepath = path.join(BACKUP_DIR, filename);
  
  console.log(`\n📋 Procesando: ${filename}`);

  try {
    // Verificar si ya tiene checksum
    const existing = await prisma.$queryRaw<Array<{ sha256_hash: string | null }>>`
      SELECT sha256_hash
      FROM backup_checksums
      WHERE filename = ${filename}
    `;

    if (existing.length > 0 && existing[0].sha256_hash) {
      console.log(`   ✓ Ya tiene checksum: ${existing[0].sha256_hash.substring(0, 16)}...`);
      return;
    }

    // Calcular checksum
    console.log(`   🔍 Calculando checksum SHA-256...`);
    const sha256Hash = await calculateFileHash(filepath);
    console.log(`   ✓ Checksum: ${sha256Hash.substring(0, 16)}...`);

    // Obtener tamaño de archivo
    const stats = await stat(filepath);
    const sizeBytes = stats.size;
    console.log(`   ✓ Tamaño: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);

    // Contar tablas
    console.log(`   🔍 Contando tablas...`);
    const tablesCount = await countTablesInBackup(filepath);
    console.log(`   ✓ Tablas: ${tablesCount}`);

    // Guardar o actualizar checksum
    if (existing.length > 0) {
      // Actualizar registro existente
      await prisma.$executeRaw`
        UPDATE backup_checksums
        SET 
          sha256_hash = ${sha256Hash},
          file_size_bytes = ${sizeBytes},
          tables_count = ${tablesCount},
          verification_status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE filename = ${filename}
      `;
      console.log(`   ✅ Checksum actualizado en BD`);
    } else {
      // Insertar nuevo registro
      await prisma.$executeRaw`
        INSERT INTO backup_checksums (filename, sha256_hash, file_size_bytes, tables_count, verification_status)
        VALUES (${filename}, ${sha256Hash}, ${sizeBytes}, ${tablesCount}, 'pending')
      `;
      console.log(`   ✅ Checksum guardado en BD`);
    }

  } catch (error) {
    console.error(`   ❌ Error procesando ${filename}:`, error);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando cálculo de checksums para respaldos existentes\n');
  console.log(`📁 Directorio: ${BACKUP_DIR}\n`);

  try {
    // Listar archivos .sql
    const files = await readdir(BACKUP_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    console.log(`📊 Encontrados ${sqlFiles.length} archivos de respaldo\n`);

    if (sqlFiles.length === 0) {
      console.log('⚠️  No hay archivos de respaldo para procesar');
      return;
    }

    // Procesar cada archivo
    for (const file of sqlFiles) {
      await processBackupFile(file);
    }

    console.log('\n\n✅ Proceso completado');
    console.log('\n📊 Resumen:');
    
    const summary = await prisma.$queryRaw<Array<{ 
      total: bigint;
      with_checksum: bigint;
      without_checksum: bigint;
    }>>`
      SELECT 
        COUNT(*) as total,
        COUNT(sha256_hash) as with_checksum,
        COUNT(*) - COUNT(sha256_hash) as without_checksum
      FROM backup_checksums
    `;

    if (summary.length > 0) {
      console.log(`   Total de respaldos: ${summary[0].total}`);
      console.log(`   Con checksum: ${summary[0].with_checksum}`);
      console.log(`   Sin checksum: ${summary[0].without_checksum}`);
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
main();

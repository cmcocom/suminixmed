#!/usr/bin/env node

/**
 * Script de Validación Completa de Respaldos
 * Verifica integridad, tamaño, estructura SQL y metadatos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gunzip = promisify(zlib.gunzip);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

async function validateSQLFile(filePath) {
  try {
    let content;
    
    if (filePath.endsWith('.gz')) {
      // Descomprimir archivo
      const compressed = fs.readFileSync(filePath);
      const decompressed = await gunzip(compressed);
      content = decompressed.toString('utf8');
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const validations = {
      hasCreateDatabase: content.includes('CREATE DATABASE'),
      hasDropDatabase: content.includes('DROP DATABASE'),
      hasTables: content.includes('CREATE TABLE'),
      hasInserts: content.includes('INSERT INTO'),
      hasCopyStatements: content.includes('COPY '),
      lines: content.split('\n').length,
      size: content.length,
    };

    // Contar tablas
    const tableMatches = content.match(/CREATE TABLE/g);
    validations.tableCount = tableMatches ? tableMatches.length : 0;

    // Contar inserts
    const insertMatches = content.match(/INSERT INTO/g);
    validations.insertCount = insertMatches ? insertMatches.length : 0;

    // Detectar errores comunes
    validations.hasErrors = content.includes('ERROR:') || content.includes('FATAL:');

    return validations;
  } catch (error) {
    return { error: error.message };
  }
}

async function validateJSONMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = JSON.parse(content);
    
    return {
      valid: true,
      timestamp: metadata.timestamp,
      database: metadata.database,
      success: metadata.success,
      tables: metadata.tables?.length || 0,
      totalRecords: metadata.totalRecords || 0,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     🔍 VALIDACIÓN COMPLETA DE RESPALDOS - SUMINIXMED         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  const backupsDir = path.join(__dirname, 'backups');

  if (!fs.existsSync(backupsDir)) {
    log('❌ Directorio de respaldos no encontrado', 'red');
    process.exit(1);
  }

  const files = fs.readdirSync(backupsDir);
  
  // Filtrar archivos SQL y SQL.GZ
  const sqlFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  log(`📁 Directorio: ${backupsDir}`, 'blue');
  log(`📊 Total de archivos SQL: ${sqlFiles.length}`, 'blue');
  log(`📋 Total de archivos JSON (metadata): ${jsonFiles.length}\n`, 'blue');

  if (sqlFiles.length === 0) {
    log('⚠️  No se encontraron respaldos SQL', 'yellow');
    return;
  }

  // Obtener información de cada archivo
  const backups = [];

  for (const file of sqlFiles) {
    const filePath = path.join(backupsDir, file);
    const stats = fs.statSync(filePath);
    
    const backup = {
      filename: file,
      path: filePath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      modified: stats.mtime,
      modifiedFormatted: formatDate(stats.mtime),
      age: Date.now() - stats.mtime.getTime(),
    };

    // Buscar archivo JSON de metadata asociado
    const jsonFile = file.replace(/\.sql(\.gz)?$/, '.sql.json');
    const jsonPath = path.join(backupsDir, jsonFile);
    
    if (fs.existsSync(jsonPath)) {
      backup.metadata = await validateJSONMetadata(jsonPath);
    }

    // Validar contenido SQL
    log(`🔍 Validando: ${file}...`, 'cyan');
    backup.validation = await validateSQLFile(filePath);

    backups.push(backup);
  }

  // Ordenar por fecha (más reciente primero)
  backups.sort((a, b) => b.modified - a.modified);

  log('\n╔════════════════════════════════════════════════════════════════╗', 'green');
  log('║                    📋 RESULTADOS DE VALIDACIÓN                 ║', 'green');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'green');

  let totalWarnings = 0;
  let totalErrors = 0;

  for (let i = 0; i < backups.length; i++) {
    const backup = backups[i];
    const isRecent = i < 5; // Los 5 más recientes

    log(`\n${'━'.repeat(70)}`, isRecent ? 'green' : 'blue');
    log(`${isRecent ? '🟢' : '🔵'} ${backup.filename}`, isRecent ? 'green' : 'blue');
    log(`${'━'.repeat(70)}`, isRecent ? 'green' : 'blue');

    // Información básica
    log(`📅 Fecha: ${backup.modifiedFormatted}`);
    log(`📦 Tamaño: ${backup.sizeFormatted}`);
    log(`⏰ Antigüedad: ${Math.round(backup.age / (1000 * 60 * 60 * 24))} días`);

    // Metadata
    if (backup.metadata) {
      if (backup.metadata.valid) {
        log(`✓ Metadata JSON: Válida`, 'green');
        log(`  - Timestamp: ${backup.metadata.timestamp}`);
        log(`  - Database: ${backup.metadata.database}`);
        log(`  - Tablas: ${backup.metadata.tables}`);
        log(`  - Registros totales: ${backup.metadata.totalRecords}`);
        log(`  - Estado: ${backup.metadata.success ? '✓ Exitoso' : '✗ Fallido'}`, 
          backup.metadata.success ? 'green' : 'red');
      } else {
        log(`✗ Metadata JSON: Error - ${backup.metadata.error}`, 'red');
        totalErrors++;
      }
    } else {
      log(`⚠️  Sin metadata JSON`, 'yellow');
      totalWarnings++;
    }

    // Validación SQL
    if (backup.validation.error) {
      log(`✗ Error al validar SQL: ${backup.validation.error}`, 'red');
      totalErrors++;
    } else {
      const v = backup.validation;

      // Validaciones críticas
      if (!v.hasCreateDatabase && !v.hasTables) {
        log(`✗ CRÍTICO: No se encontraron definiciones de tablas`, 'red');
        totalErrors++;
      } else if (!v.hasTables) {
        log(`⚠️  Advertencia: Sin CREATE TABLE statements`, 'yellow');
        totalWarnings++;
      } else {
        log(`✓ Estructura: ${v.tableCount} tablas detectadas`, 'green');
      }

      if (!v.hasInserts && !v.hasCopyStatements) {
        log(`⚠️  Advertencia: Sin datos (ni INSERT ni COPY)`, 'yellow');
        totalWarnings++;
      } else {
        if (v.hasInserts) {
          log(`✓ Datos: ${v.insertCount} INSERTs encontrados`, 'green');
        }
        if (v.hasCopyStatements) {
          log(`✓ Datos: COPY statements encontrados`, 'green');
        }
      }

      if (v.hasErrors) {
        log(`✗ ERRORES detectados en el archivo SQL`, 'red');
        totalErrors++;
      }

      // Información adicional
      log(`📊 Estadísticas:`);
      log(`  - Líneas: ${v.lines.toLocaleString()}`);
      log(`  - Tamaño contenido: ${formatBytes(v.size)}`);
      log(`  - CREATE DATABASE: ${v.hasCreateDatabase ? 'Sí' : 'No'}`);
      log(`  - DROP DATABASE: ${v.hasDropDatabase ? 'Sí' : 'No'}`);
    }

    // Recomendaciones
    const ageInDays = Math.round(backup.age / (1000 * 60 * 60 * 24));
    if (ageInDays > 30) {
      log(`⚠️  Recomendación: Respaldo antiguo (${ageInDays} días) - considerar archivar`, 'yellow');
    }

    if (backup.size < 1000) {
      log(`⚠️  Advertencia: Archivo muy pequeño (${backup.sizeFormatted}) - posible respaldo vacío`, 'yellow');
      totalWarnings++;
    }
  }

  // Resumen final
  log('\n\n╔════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║                      📊 RESUMEN FINAL                          ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'magenta');

  log(`📁 Total de respaldos analizados: ${backups.length}`);
  log(`🟢 Respaldos recientes (últimos 5): ${Math.min(5, backups.length)}`);
  log(`⚠️  Advertencias encontradas: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');
  log(`❌ Errores encontrados: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');

  // Respaldo más reciente
  if (backups.length > 0) {
    const latest = backups[0];
    log(`\n🏆 Respaldo más reciente:`, 'green');
    log(`   ${latest.filename}`, 'green');
    log(`   Fecha: ${latest.modifiedFormatted}`, 'green');
    log(`   Tamaño: ${latest.sizeFormatted}`, 'green');
  }

  // Estadísticas globales
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  const avgSize = totalSize / backups.length;
  
  log(`\n📊 Estadísticas globales:`);
  log(`   Tamaño total: ${formatBytes(totalSize)}`);
  log(`   Tamaño promedio: ${formatBytes(avgSize)}`);
  log(`   Tamaño mínimo: ${formatBytes(Math.min(...backups.map(b => b.size)))}`);
  log(`   Tamaño máximo: ${formatBytes(Math.max(...backups.map(b => b.size)))}`);

  // Estado final
  log('\n' + '═'.repeat(70));
  if (totalErrors === 0 && totalWarnings === 0) {
    log('✅ TODOS LOS RESPALDOS ESTÁN EN PERFECTO ESTADO', 'green');
  } else if (totalErrors === 0) {
    log('⚠️  RESPALDOS FUNCIONALES CON ADVERTENCIAS MENORES', 'yellow');
  } else {
    log('❌ SE ENCONTRARON ERRORES EN ALGUNOS RESPALDOS', 'red');
    log('   Recomendación: Generar nuevos respaldos', 'red');
  }
  log('═'.repeat(70) + '\n');

  // Recomendaciones
  log('💡 Recomendaciones:', 'cyan');
  log('   1. Mantener al menos los últimos 5 respaldos recientes');
  log('   2. Generar respaldos cada 24 horas');
  log('   3. Archivar respaldos mayores a 30 días');
  log('   4. Probar restauración periódicamente\n');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

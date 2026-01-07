#!/usr/bin/env node

/**
 * ANÁLISIS DE MIGRACIÓN DE PRODUCCIÓN
 * ====================================
 * 
 * Objetivo: Migrar backup de producción (2025-11-04T06:38:51) 
 * manteniendo intactas las tablas RBAC V2 modificadas.
 * 
 * CRÍTICO: NO perder los cambios del sistema RBAC V2 implementado.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

// ========================================================================
// TABLAS RBAC V2 QUE NO DEBEN SER SOBRESCRITAS
// ========================================================================
const TABLAS_RBAC_V2_PROTEGIDAS = [
  'rbac_roles',                    // Roles del sistema RBAC V2
  'rbac_permissions',              // Permisos definidos en RBAC V2
  'rbac_role_permissions',         // Asignación de permisos a roles
  'rbac_user_roles',               // Asignación de roles a usuarios
  'rbac_module_visibility',        // Control de visibilidad de módulos (NUEVA)
  'rbac_audit_log',                // Log de auditoría RBAC
  
  // Tablas relacionadas que podrían tener cambios importantes
  'User',                          // Usuarios (podría tener cambios en campos RBAC)
];

// ========================================================================
// TABLAS DE PRODUCCIÓN QUE SÍ QUEREMOS MIGRAR
// ========================================================================
const TABLAS_PRODUCCION_MIGRAR = [
  // Datos principales de negocio
  'Inventario',
  'entradas_inventario', 
  'salidas_inventario',
  'clientes',
  'proveedores',
  'categorias',
  'empleados',
  'ordenes_compra',
  'inventarios_fisicos',
  'ffijo',
  
  // Catálogos del sistema (AGREGADOS)
  'almacenes',
  'tipos_entrada',
  'tipos_salida', 
  'unidades_medida',
  'config_folios',
  'configuracion_salidas',
  
  // Datos transaccionales relacionados (AGREGADOS)
  'detalle_orden_compra',
  'inventarios_fisicos_detalle',
  'partidas_entrada_inventario',
  'partidas_salida_inventario',
  'inventario_almacen',
  'ubicaciones_almacen',
  
  // Configuración del sistema
  'entidades',
  'tipos_movimientos',
  'backup_config',
  'backup_runs',
  'backup_files',
  'backup_history',
  
  // Reportes y configuraciones
  'report_configurations',
  'generated_reports',
  'dashboard_user_configs',
  'session_notifications',
  
  // Sesiones activas (se pueden sobrescribir)
  'active_sessions',
  
  // Otros datos del sistema
  'Account',
  'Session'
];

// ========================================================================
// FUNCIONES DE ANÁLISIS
// ========================================================================

async function ejecutarComando(comando) {
  return new Promise((resolve, reject) => {
    exec(comando, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function analizarBackupProduccion() {
  console.log('📊 ANÁLISIS DE MIGRACIÓN DE PRODUCCIÓN');
  console.log('=====================================\n');
  
  const backupPath = path.join(process.cwd(), 'backups', 'suminix-2025-11-04T06-38-51-426Z.backup');
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`❌ Backup no encontrado: ${backupPath}`);
  }
  
  console.log('✅ Backup encontrado:', backupPath);
  
  // Leer metadata
  const metadataPath = backupPath + '.meta.json';
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log('📈 Información del backup:');
    console.log(`   - Fecha: ${metadata.timestamp}`);
    console.log(`   - Creado por: ${metadata.createdBy}`);
    console.log(`   - Tamaño: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Tablas: ${metadata.tables}`);
    console.log(`   - Checksum: ${metadata.checksum.substring(0, 16)}...`);
    console.log(`   - Estado: ${metadata.validationStatus}\n`);
  }
  
  return backupPath;
}

async function analizarTablasBDActual() {
  console.log('🔍 ANALIZANDO BASE DE DATOS ACTUAL...\n');
  
  try {
    // Obtener lista de tablas actuales
    const { stdout } = await ejecutarComando(`psql "${process.env.DATABASE_URL}" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`);
    
    const tablasActuales = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '');
    
    console.log(`📋 Tablas en BD actual: ${tablasActuales.length}`);
    console.log('   -', tablasActuales.join('\n   - '));
    console.log();
    
    return tablasActuales;
  } catch (error) {
    console.error('❌ Error al analizar BD actual:', error.message);
    throw error;
  }
}

async function generarPlanMigracion(tablasActuales) {
  console.log('📋 PLAN DE MIGRACIÓN');
  console.log('====================\n');
  
  // Clasificar tablas
  const tablasProtegidas = tablasActuales.filter(tabla => 
    TABLAS_RBAC_V2_PROTEGIDAS.includes(tabla)
  );
  
  const tablasMigrar = TABLAS_PRODUCCION_MIGRAR.filter(tabla => 
    !TABLAS_RBAC_V2_PROTEGIDAS.includes(tabla)
  );
  
  const tablasDesconocidas = tablasActuales.filter(tabla => 
    !TABLAS_RBAC_V2_PROTEGIDAS.includes(tabla) && 
    !TABLAS_PRODUCCION_MIGRAR.includes(tabla)
  );
  
  console.log('🔒 TABLAS PROTEGIDAS (NO migrar - mantener RBAC V2):');
  tablasProtegidas.forEach(tabla => {
    console.log(`   ✋ ${tabla} - Mantener datos actuales del RBAC V2`);
  });
  console.log(`   Total: ${tablasProtegidas.length} tablas\n`);
  
  console.log('📦 TABLAS A MIGRAR (datos de producción):');
  tablasMigrar.forEach(tabla => {
    console.log(`   ✅ ${tabla} - Migrar desde backup de producción`);
  });
  console.log(`   Total: ${tablasMigrar.length} tablas\n`);
  
  if (tablasDesconocidas.length > 0) {
    console.log('⚠️  TABLAS NO CLASIFICADAS (requiere decisión):');
    tablasDesconocidas.forEach(tabla => {
      console.log(`   ❓ ${tabla} - ¿Migrar o mantener?`);
    });
    console.log(`   Total: ${tablasDesconocidas.length} tablas\n`);
  }
  
  return {
    tablasProtegidas,
    tablasMigrar,
    tablasDesconocidas
  };
}

async function verificarRiesgos(plan) {
  console.log('⚠️  ANÁLISIS DE RIESGOS');
  console.log('=======================\n');
  
  const riesgos = [];
  
  // Verificar si hay usuarios en RBAC V2 que no estén en producción
  console.log('👥 Verificando usuarios RBAC V2...');
  try {
    const { stdout } = await ejecutarComando(`psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM rbac_user_roles;"`);
    const usuariosRBAC = parseInt(stdout.trim());
    console.log(`   - Usuarios con roles RBAC: ${usuariosRBAC}`);
    
    if (usuariosRBAC > 0) {
      riesgos.push({
        nivel: 'ALTO',
        descripcion: `${usuariosRBAC} usuarios tienen roles RBAC V2 asignados`,
        impacto: 'Si se sobrescribe la tabla User, se perderán las asignaciones de roles',
        recomendacion: 'Hacer backup de rbac_user_roles y re-asignar después de migración'
      });
    }
  } catch (error) {
    console.log(`   ❌ Error verificando usuarios RBAC: ${error.message}`);
  }
  
  // Verificar permisos personalizados
  console.log('\n🔐 Verificando permisos personalizados...');
  try {
    const { stdout } = await ejecutarComando(`psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM rbac_permissions;"`);
    const permisos = parseInt(stdout.trim());
    console.log(`   - Permisos definidos: ${permisos}`);
    
    if (permisos > 0) {
      riesgos.push({
        nivel: 'CRÍTICO',
        descripcion: `${permisos} permisos RBAC V2 configurados`,
        impacto: 'Sistema de permisos completo se perdería',
        recomendacion: 'NUNCA migrar tablas rbac_*'
      });
    }
  } catch (error) {
    console.log(`   ❌ Error verificando permisos: ${error.message}`);
  }
  
  // Verificar visibilidad de módulos
  console.log('\n📋 Verificando configuración de módulos...');
  try {
    const { stdout } = await ejecutarComando(`psql "${process.env.DATABASE_URL}" -t -c "SELECT COUNT(*) FROM rbac_module_visibility;"`);
    const modulosConfig = parseInt(stdout.trim());
    console.log(`   - Configuraciones de módulos: ${modulosConfig}`);
    
    if (modulosConfig > 0) {
      riesgos.push({
        nivel: 'ALTO',
        descripcion: `${modulosConfig} configuraciones de visibilidad de módulos`,
        impacto: 'Configuración personalizada del sidebar se perdería',
        recomendacion: 'Preservar rbac_module_visibility'
      });
    }
  } catch (error) {
    console.log(`   ❌ Error verificando módulos: ${error.message}`);
  }
  
  console.log('\n📊 RESUMEN DE RIESGOS:');
  if (riesgos.length === 0) {
    console.log('✅ No se detectaron riesgos críticos');
  } else {
    riesgos.forEach((riesgo, index) => {
      console.log(`\n   ${index + 1}. RIESGO ${riesgo.nivel}:`);
      console.log(`      📝 ${riesgo.descripcion}`);
      console.log(`      💥 Impacto: ${riesgo.impacto}`);
      console.log(`      💡 Recomendación: ${riesgo.recomendacion}`);
    });
  }
  
  return riesgos;
}

async function generarScriptMigracion(plan) {
  console.log('\n🛠️  GENERANDO SCRIPT DE MIGRACIÓN');
  console.log('==================================\n');
  
  const scriptContent = `#!/bin/bash

# SCRIPT DE MIGRACIÓN SELECTIVA - PRODUCCIÓN A DESARROLLO
# ========================================================
# Generado automáticamente el ${new Date().toISOString()}
# 
# OBJETIVO: Migrar datos de producción manteniendo RBAC V2 intacto
#
# ADVERTENCIA: Este script es DESTRUCTIVO para las tablas migradas
#              Hacer backup antes de ejecutar

set -e

DATABASE_URL="${process.env.DATABASE_URL}"
BACKUP_FILE="backups/suminix-2025-11-04T06-38-51-426Z.backup"

echo "🚀 Iniciando migración selectiva..."
echo "Backup source: $BACKUP_FILE"
echo "Target DB: $DATABASE_URL"
echo ""

# Verificar que el backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup no encontrado: $BACKUP_FILE"
    exit 1
fi

# Crear backup de seguridad de BD actual
echo "📦 Creando backup de seguridad..."
SAFETY_BACKUP="backups/safety-backup-before-prod-migration-$(date +%Y%m%d_%H%M%S).backup"
pg_dump "$DATABASE_URL" -Fc -f "$SAFETY_BACKUP"
echo "✅ Backup de seguridad creado: $SAFETY_BACKUP"

# Crear esquema temporal para el backup de producción
echo "🔧 Creando esquema temporal..."
psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS temp_prod CASCADE;"
psql "$DATABASE_URL" -c "CREATE SCHEMA temp_prod;"

# Restaurar backup completo en esquema temporal
echo "📥 Restaurando backup en esquema temporal..."
pg_restore -d "$DATABASE_URL" --schema=temp_prod "$BACKUP_FILE"

echo "🔄 Migrando tablas seleccionadas..."

# Migrar cada tabla aprobada
${plan.tablasMigrar.map(tabla => `
echo "   Migrando ${tabla}..."
psql "$DATABASE_URL" -c "TRUNCATE TABLE public.${tabla} CASCADE;"
psql "$DATABASE_URL" -c "INSERT INTO public.${tabla} SELECT * FROM temp_prod.${tabla};"
`).join('')}

echo "🧹 Limpiando esquema temporal..."
psql "$DATABASE_URL" -c "DROP SCHEMA temp_prod CASCADE;"

echo "✅ Migración completada exitosamente!"
echo ""
echo "📋 RESUMEN:"
echo "   - Tablas migradas: ${plan.tablasMigrar.length}"
echo "   - Tablas protegidas: ${plan.tablasProtegidas.length}"
echo "   - Backup de seguridad: $SAFETY_BACKUP"
echo ""
echo "🔍 Verificar manualmente:"
${plan.tablasDesconocidas.map(tabla => `echo "   - Revisar tabla: ${tabla}"`).join('\n')}
`;

  const scriptPath = 'scripts/migrar-produccion-selectivo.sh';
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Hacer el script ejecutable
  try {
    await ejecutarComando(`chmod +x ${scriptPath}`);
  } catch (error) {
    console.log('⚠️  No se pudo hacer ejecutable el script (Windows?)');
  }
  
  console.log(`✅ Script generado: ${scriptPath}`);
  
  return scriptPath;
}

// ========================================================================
// FUNCIÓN PRINCIPAL
// ========================================================================

async function main() {
  try {
    console.log('🔍 ANÁLISIS DE MIGRACIÓN DE PRODUCCIÓN\n');
    
    // 1. Verificar backup
    const backupPath = await analizarBackupProduccion();
    
    // 2. Analizar BD actual
    const tablasActuales = await analizarTablasBDActual();
    
    // 3. Generar plan
    const plan = await generarPlanMigracion(tablasActuales);
    
    // 4. Verificar riesgos
    const riesgos = await verificarRiesgos(plan);
    
    // 5. Generar script
    const scriptPath = await generarScriptMigracion(plan);
    
    console.log('\n🎯 CONCLUSIONES Y RECOMENDACIONES');
    console.log('=================================\n');
    
    const riesgosCriticos = riesgos.filter(r => r.nivel === 'CRÍTICO');
    
    if (riesgosCriticos.length > 0) {
      console.log('🚨 RIESGOS CRÍTICOS DETECTADOS:');
      riesgosCriticos.forEach(riesgo => {
        console.log(`   ❌ ${riesgo.descripcion}`);
      });
      console.log('\n   ⚠️  PROCEDER CON EXTREMA PRECAUCIÓN');
    } else {
      console.log('✅ La migración es VIABLE y SEGURA');
    }
    
    console.log('\n📝 PASOS SIGUIENTES:');
    console.log('   1. Revisar este análisis cuidadosamente');
    console.log('   2. Verificar manualmente las tablas no clasificadas');
    console.log(`   3. Ejecutar script: ./${scriptPath}`);
    console.log('   4. Verificar integridad post-migración');
    console.log('   5. Probar funcionalidad RBAC V2');
    
    console.log('\n✨ Análisis completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ ERROR en el análisis:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
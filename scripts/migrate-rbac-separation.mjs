#!/usr/bin/env node

/**
 * MIGRACIÓN CRÍTICA: Separación de Permisos y Visibilidad RBAC
 * 
 * Este script implementa la nueva arquitectura donde:
 * - PERMISOS: Siempre granted=true (garantiza acceso funcional)
 * - VISIBILIDAD: Nueva tabla rbac_module_visibility (controla UI)
 * 
 * ⚠️  IMPORTANTE: Hacer backup ANTES de ejecutar
 */

import pkg from '@prisma/client';
import { randomUUID } from 'crypto';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Módulos del sistema (sincronizado con rbac-modules.ts)
const ALL_MODULES = [
  // Principales (10)
  'DASHBOARD', 'SOLICITUDES', 'SURTIDO', 'ENTRADAS', 'SALIDAS', 
  'REPORTES', 'STOCK_FIJO', 'INVENTARIOS_FISICOS', 'CATALOGOS', 'AJUSTES',
  
  // Reportes (3)
  'REPORTES_INVENTARIO', 'REPORTES_ENTRADAS_CLIENTE', 'REPORTES_SALIDAS_CLIENTE',
  
  // Catálogos (8)
  'CATALOGOS_PRODUCTOS', 'CATALOGOS_CATEGORIAS', 'CATALOGOS_CLIENTES',
  'CATALOGOS_PROVEEDORES', 'CATALOGOS_EMPLEADOS', 'CATALOGOS_TIPOS_ENTRADA',
  'CATALOGOS_TIPOS_SALIDA', 'CATALOGOS_ALMACENES',
  
  // Ajustes (7)
  'AJUSTES_USUARIOS', 'AJUSTES_RBAC', 'AJUSTES_AUDITORIA',
  'GESTION_CATALOGOS', 'GESTION_REPORTES', 'AJUSTES_ENTIDAD', 'GESTION_RESPALDOS',
  
  // Backend (1)
  'INVENTARIO'
];

async function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('es-MX');
  const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function createBackup() {
  try {
    await log('📦 Creando backup de rbac_role_permissions...');
    
    // Crear tabla de backup
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rbac_role_permissions_backup_${Math.floor(Date.now() / 1000)} AS 
      SELECT * FROM rbac_role_permissions
    `;
    
    const count = await prisma.rbac_role_permissions.count();
    await log(`✅ Backup creado: ${count} registros respaldados`, 'SUCCESS');
    
    return true;
  } catch (error) {
    await log(`Error creando backup: ${error.message}`, 'ERROR');
    return false;
  }
}

async function getCurrentVisibilityConfig() {
  try {
    await log('🔍 Analizando configuración actual de visibilidad...');
    
    // Obtener permisos LEER que están en false (módulos ocultos actualmente)
    const hiddenModules = await prisma.$queryRaw`
      SELECT 
        r.id as role_id,
        r.name as role_name,
        p.module,
        rp.granted
      FROM rbac_role_permissions rp
      JOIN rbac_roles r ON rp.role_id = r.id
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE p.action = 'LEER' 
        AND rp.granted = false
      ORDER BY r.name, p.module
    `;
    
    await log(`📊 Encontrados ${hiddenModules.length} módulos actualmente ocultos`);
    
    // Agrupar por rol
    const visibilityByRole = {};
    for (const item of hiddenModules) {
      if (!visibilityByRole[item.role_id]) {
        visibilityByRole[item.role_id] = {
          role_name: item.role_name,
          hidden_modules: []
        };
      }
      visibilityByRole[item.role_id].hidden_modules.push(item.module);
    }
    
    // Mostrar resumen
    for (const [, config] of Object.entries(visibilityByRole)) {
      await log(`   - Rol "${config.role_name}": ${config.hidden_modules.length} módulos ocultos`);
    }
    
    return visibilityByRole;
  } catch (error) {
    await log(`Error analizando configuración: ${error.message}`, 'ERROR');
    return {};
  }
}

async function migrateToVisibilityTable(visibilityConfig) {
  try {
    await log('🔄 Migrando configuraciones a nueva tabla rbac_module_visibility...');
    
    const roles = await prisma.rbac_roles.findMany();
    let insertCount = 0;
    
    for (const role of roles) {
      const hiddenModules = visibilityConfig[role.id]?.hidden_modules || [];
      
      for (const moduleKey of ALL_MODULES) {
        const isVisible = !hiddenModules.includes(moduleKey);
        
        await prisma.rbac_module_visibility.upsert({
          where: {
            role_id_module_key: {
              role_id: role.id,
              module_key: moduleKey
            }
          },
          create: {
            id: randomUUID(),
            role_id: role.id,
            module_key: moduleKey,
            is_visible: isVisible,
            created_by: 'MIGRATION_SCRIPT'
          },
          update: {
            is_visible: isVisible,
            updated_at: new Date()
          }
        });
        
        insertCount++;
      }
    }
    
    await log(`✅ Migración completada: ${insertCount} registros en rbac_module_visibility`, 'SUCCESS');
    return true;
  } catch (error) {
    await log(`Error en migración: ${error.message}`, 'ERROR');
    return false;
  }
}

async function grantAllPermissions() {
  try {
    await log('🔓 Otorgando TODOS los permisos a TODOS los roles...');
    
    // Forzar granted=true en TODOS los permisos
    const result = await prisma.rbac_role_permissions.updateMany({
      data: {
        granted: true,
        granted_at: new Date(),
        granted_by: 'MIGRATION_SCRIPT'
      }
    });
    
    await log(`✅ ${result.count} permisos actualizados a granted=true`, 'SUCCESS');
    
    // Verificar que no queden permisos en false
    const falsePermissions = await prisma.rbac_role_permissions.count({
      where: { granted: false }
    });
    
    if (falsePermissions === 0) {
      await log('✅ Verificación exitosa: Todos los permisos están granted=true', 'SUCCESS');
    } else {
      await log(`⚠️ Advertencia: Aún quedan ${falsePermissions} permisos en false`, 'ERROR');
    }
    
    return falsePermissions === 0;
  } catch (error) {
    await log(`Error otorgando permisos: ${error.message}`, 'ERROR');
    return false;
  }
}

async function verifyMigration() {
  try {
    await log('🔍 Verificando migración...');
    
    // Verificar nueva tabla
    const visibilityCount = await prisma.rbac_module_visibility.count();
    const rolesCount = await prisma.rbac_roles.count();
    const expectedRecords = rolesCount * ALL_MODULES.length;
    
    await log(`📊 Tabla rbac_module_visibility: ${visibilityCount} registros`);
    await log(`📊 Esperados: ${expectedRecords} registros (${rolesCount} roles × ${ALL_MODULES.length} módulos)`);
    
    if (visibilityCount === expectedRecords) {
      await log('✅ Verificación exitosa: Tabla completa', 'SUCCESS');
    } else {
      await log('⚠️ Advertencia: Registros faltantes en tabla de visibilidad', 'ERROR');
    }
    
    // Verificar permisos
    const falsePermissions = await prisma.rbac_role_permissions.count({
      where: { granted: false }
    });
    
    if (falsePermissions === 0) {
      await log('✅ Verificación exitosa: Todos los permisos granted=true', 'SUCCESS');
    } else {
      await log(`❌ Error: ${falsePermissions} permisos aún en false`, 'ERROR');
    }
    
    return visibilityCount === expectedRecords && falsePermissions === 0;
  } catch (error) {
    await log(`Error en verificación: ${error.message}`, 'ERROR');
    return false;
  }
}

async function showMigrationSummary(visibilityConfig) {
  await log('\n📋 RESUMEN DE MIGRACIÓN');
  await log('=' * 50);
  
  await log('🔄 CAMBIOS REALIZADOS:');
  await log('  ✅ Nueva tabla: rbac_module_visibility');
  await log('  ✅ Todos los permisos: granted = true');
  await log('  ✅ Configuración de visibilidad migrada');
  
  await log('\n🎯 NUEVA ARQUITECTURA:');
  await log('  - PERMISOS: Siempre otorgados (APIs funcionan)');
  await log('  - VISIBILIDAD: Controlada independientemente');
  await log('  - DEPENDENCIAS: Ya NO se rompen al ocultar módulos');
  
  if (Object.keys(visibilityConfig).length > 0) {
    await log('\n👁️ CONFIGURACIÓN DE VISIBILIDAD PRESERVADA:');
    for (const [, config] of Object.entries(visibilityConfig)) {
      if (config.hidden_modules.length > 0) {
        await log(`  - ${config.role_name}: ${config.hidden_modules.length} módulos ocultos`);
      }
    }
  }
  
  await log('\n🚀 PRÓXIMOS PASOS:');
  await log('  1. Ejecutar: npx prisma migrate dev');
  await log('  2. Actualizar APIs de toggles');
  await log('  3. Actualizar lógica del sidebar');
  await log('  4. Testing de dependencias');
}

async function main() {
  try {
    await log('🚀 INICIANDO MIGRACIÓN RBAC: Separación Permisos vs Visibilidad');
    await log('=' * 60);
    
    // Paso 1: Backup
    const backupSuccess = await createBackup();
    if (!backupSuccess) {
      throw new Error('Backup falló - Abortando migración');
    }
    
    // Paso 2: Analizar configuración actual
    const visibilityConfig = await getCurrentVisibilityConfig();
    
    // Paso 3: Migrar a nueva tabla de visibilidad
    const migrationSuccess = await migrateToVisibilityTable(visibilityConfig);
    if (!migrationSuccess) {
      throw new Error('Migración de visibilidad falló');
    }
    
    // Paso 4: Otorgar todos los permisos
    const permissionsSuccess = await grantAllPermissions();
    if (!permissionsSuccess) {
      throw new Error('Otorgar permisos falló');
    }
    
    // Paso 5: Verificar migración
    const verificationSuccess = await verifyMigration();
    if (!verificationSuccess) {
      await log('⚠️ Verificación con advertencias - Revisar manualmente', 'ERROR');
    }
    
    // Paso 6: Mostrar resumen
    await showMigrationSummary(visibilityConfig);
    
    await log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE', 'SUCCESS');
    
  } catch (error) {
    await log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'ERROR');
    await log('🔄 Restaurar desde backup si es necesario');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
main().catch(console.error);
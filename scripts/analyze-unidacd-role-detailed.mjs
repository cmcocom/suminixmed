#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function analyzeUNIDACDRole() {
  try {
    console.log('🔍 ANÁLISIS DETALLADO DEL ROL UNIDADC');
    console.log('=' * 60);
    
    // 1. Verificar si existe el rol UNIDADC
    console.log('\n1️⃣ VERIFICANDO EXISTENCIA DEL ROL UNIDADC:');
    const unidacdRole = await prisma.rbac_roles.findUnique({
      where: { name: 'UNIDADC' }
    });
    
    if (!unidacdRole) {
      console.log('   ❌ El rol UNIDADC NO EXISTE en la base de datos');
      
      // Mostrar todos los roles actuales
      console.log('\n📋 ROLES ACTUALES EN EL SISTEMA:');
      const allRoles = await prisma.rbac_roles.findMany({
        orderBy: { name: 'asc' }
      });
      
      for (const role of allRoles) {
        const systemIndicator = role.is_system_role ? '🔧 SISTEMA' : '👤 NORMAL';
        console.log(`   • ${role.name} - ${systemIndicator} - ${role.description}`);
      }
      
    } else {
      console.log('   ✅ El rol UNIDADC EXISTE');
      console.log(`      - ID: ${unidacdRole.id}`);
      console.log(`      - Descripción: ${unidacdRole.description}`);
      console.log(`      - Es rol de sistema: ${unidacdRole.is_system_role ? 'SÍ' : 'NO'}`);
      console.log(`      - Creado por: ${unidacdRole.created_by}`);
      console.log(`      - Fecha creación: ${unidacdRole.created_at.toLocaleString('es-MX')}`);
      
      // Verificar permisos asignados
      console.log('\n2️⃣ VERIFICANDO PERMISOS DEL ROL UNIDADC:');
      const rolePermissions = await prisma.rbac_role_permissions.findMany({
        where: { role_id: unidacdRole.id },
        include: { rbac_permissions: true }
      });
      
      const totalPermissions = await prisma.rbac_permissions.count();
      const grantedPermissions = rolePermissions.filter(rp => rp.granted).length;
      const deniedPermissions = rolePermissions.filter(rp => !rp.granted).length;
      
      console.log(`   📊 Total permisos en sistema: ${totalPermissions}`);
      console.log(`   ✅ Permisos concedidos: ${grantedPermissions}`);
      console.log(`   ❌ Permisos denegados: ${deniedPermissions}`);
      console.log(`   📈 Porcentaje acceso: ${((grantedPermissions / totalPermissions) * 100).toFixed(1)}%`);
      
      if (grantedPermissions === totalPermissions) {
        console.log('   🎯 ✅ CORRECTO: Tiene 100% de los permisos');
      } else {
        console.log('   ⚠️ PROBLEMA: NO tiene 100% de los permisos');
        
        // Mostrar algunos permisos denegados
        const deniedPerms = rolePermissions.filter(rp => !rp.granted).slice(0, 5);
        if (deniedPerms.length > 0) {
          console.log('   📋 Ejemplos de permisos DENEGADOS:');
          deniedPerms.forEach(rp => {
            console.log(`      - ${rp.rbac_permissions.name}`);
          });
        }
      }
      
      // Verificar visibilidad en sidebar
      console.log('\n3️⃣ VERIFICANDO VISIBILIDAD EN SIDEBAR:');
      const visibilityConfig = await prisma.rbac_module_visibility.findMany({
        where: { role_id: unidacdRole.id }
      });
      
      const totalModules = 28; // Según la implementación
      const visibleModules = visibilityConfig.filter(v => v.is_visible).length;
      
      console.log(`   📊 Total módulos: ${totalModules}`);
      console.log(`   👁️ Módulos visibles: ${visibleModules}`);
      console.log(`   📈 Porcentaje visibilidad: ${((visibleModules / totalModules) * 100).toFixed(1)}%`);
      
      if (visibleModules === totalModules) {
        console.log('   🎯 ✅ CORRECTO: Ve 100% de los módulos');
      } else {
        console.log('   ⚠️ PROBLEMA: NO ve 100% de los módulos');
        
        // Mostrar módulos ocultos
        const hiddenModules = visibilityConfig.filter(v => !v.is_visible).slice(0, 5);
        if (hiddenModules.length > 0) {
          console.log('   📋 Ejemplos de módulos OCULTOS:');
          hiddenModules.forEach(v => {
            console.log(`      - ${v.module_key}`);
          });
        }
      }
      
      // Verificar usuarios asignados
      console.log('\n4️⃣ USUARIOS CON ROL UNIDADC:');
      const usersWithRole = await prisma.rbac_user_roles.findMany({
        where: { role_id: unidacdRole.id },
        include: { user: true }
      });
      
      if (usersWithRole.length === 0) {
        console.log('   📋 Ningún usuario tiene asignado el rol UNIDADC');
      } else {
        console.log(`   👥 ${usersWithRole.length} usuario(s) con rol UNIDADC:`);
        usersWithRole.forEach(ur => {
          console.log(`      - ${ur.user.clave} (${ur.user.name}) - Activo: ${ur.user.activo ? 'SÍ' : 'NO'}`);
        });
      }
    }
    
    // 5. Análisis de código hardcodeado
    console.log('\n5️⃣ ANÁLISIS DE CÓDIGO HARDCODEADO:');
    console.log('   (Esta verificación requiere análisis de archivos de código)');
    
    // Verificar si en la nueva arquitectura todo es dinámico
    const totalRoles = await prisma.rbac_roles.count();
    const totalPermissions = await prisma.rbac_permissions.count();
    const totalVisibilityConfigs = await prisma.rbac_module_visibility.count();
    
    console.log('\n📈 ESTADÍSTICAS DE NUEVA ARQUITECTURA:');
    console.log(`   • Roles totales: ${totalRoles}`);
    console.log(`   • Permisos totales: ${totalPermissions}`);
    console.log(`   • Configuraciones visibilidad: ${totalVisibilityConfigs}`);
    
    // Verificar si todos los permisos están granted=true (nueva arquitectura)
    const allRolePermissions = await prisma.rbac_role_permissions.count();
    const grantedRolePermissions = await prisma.rbac_role_permissions.count({
      where: { granted: true }
    });
    
    console.log('\n🆕 VERIFICACIÓN NUEVA ARQUITECTURA:');
    console.log(`   • Total asignaciones rol-permiso: ${allRolePermissions}`);
    console.log(`   • Asignaciones granted=true: ${grantedRolePermissions}`);
    console.log(`   • Porcentaje granted=true: ${((grantedRolePermissions / allRolePermissions) * 100).toFixed(1)}%`);
    
    if (grantedRolePermissions === allRolePermissions) {
      console.log('   ✅ CORRECTO: Nueva arquitectura implementada (100% permisos granted=true)');
    } else {
      console.log('   ⚠️ ADVERTENCIA: Aún hay permisos con granted=false (arquitectura mixta)');
    }
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUNIDACDRole();
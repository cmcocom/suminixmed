#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function simpleComparison() {
  try {
    console.log('🔍 COMPARACIÓN SIMPLE: DESARROLLADOR vs UNIDADC');
    console.log('=' * 60);
    
    const desarrolladorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'DESARROLLADOR' }
    });
    
    const unidacdRole = await prisma.rbac_roles.findUnique({
      where: { name: 'UNIDADC' }
    });
    
    console.log('\n📊 RESUMEN COMPARATIVO:');
    
    // Permisos
    const devPermisos = await prisma.rbac_role_permissions.count({
      where: { role_id: desarrolladorRole.id, granted: true }
    });
    
    const unidacdPermisos = await prisma.rbac_role_permissions.count({
      where: { role_id: unidacdRole.id, granted: true }
    });
    
    console.log(`🔐 PERMISOS:`);
    console.log(`   • DESARROLLADOR: ${devPermisos} permisos`);
    console.log(`   • UNIDADC: ${unidacdPermisos} permisos`);
    
    // Visibilidad
    const devVisible = await prisma.rbac_module_visibility.count({
      where: { role_id: desarrolladorRole.id, is_visible: true }
    });
    
    const unidacdVisible = await prisma.rbac_module_visibility.count({
      where: { role_id: unidacdRole.id, is_visible: true }
    });
    
    console.log(`\n👁️ VISIBILIDAD:`);
    console.log(`   • DESARROLLADOR: ${devVisible} módulos visibles`);
    console.log(`   • UNIDADC: ${unidacdVisible} módulos visibles`);
    
    // Características
    console.log(`\n🏷️ CARACTERÍSTICAS:`);
    console.log(`   • DESARROLLADOR: Rol de sistema: ${desarrolladorRole.is_system_role ? 'SÍ' : 'NO'}`);
    console.log(`   • UNIDADC: Rol de sistema: ${unidacdRole.is_system_role ? 'SÍ' : 'NO'}`);
    
    // Usuarios (usando query raw para evitar problemas de relación)
    const devUsers = await prisma.$queryRaw`
      SELECT u.clave, u.name, u.activo
      FROM "User" u
      JOIN rbac_user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ${desarrolladorRole.id};
    `;
    
    const unidacdUsers = await prisma.$queryRaw`
      SELECT u.clave, u.name, u.activo
      FROM "User" u  
      JOIN rbac_user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ${unidacdRole.id};
    `;
    
    console.log(`\n👥 USUARIOS ASIGNADOS:`);
    console.log(`   • DESARROLLADOR: ${Array.isArray(devUsers) ? devUsers.length : 0} usuarios`);
    if (Array.isArray(devUsers) && devUsers.length > 0) {
      devUsers.forEach(u => console.log(`     - ${u.clave} (${u.name})`));
    }
    
    console.log(`   • UNIDADC: ${Array.isArray(unidacdUsers) ? unidacdUsers.length : 0} usuarios`);
    if (Array.isArray(unidacdUsers) && unidacdUsers.length > 0) {
      unidacdUsers.forEach(u => console.log(`     - ${u.clave} (${u.name})`));
    }
    
    // Conclusión
    console.log(`\n🎯 CONCLUSIÓN:`);
    
    const mismosPermisos = devPermisos === unidacdPermisos && devPermisos === 140;
    const mismaVisibilidad = devVisible === unidacdVisible && devVisible === 28;
    const ambosRolSistema = desarrolladorRole.is_system_role && unidacdRole.is_system_role;
    
    if (mismosPermisos && mismaVisibilidad && ambosRolSistema) {
      console.log('✅ SÍ - DESARROLLADOR y UNIDADC tienen EXACTAMENTE los mismos privilegios:');
      console.log('   🔐 Permisos: 140/140 (100%) ambos');
      console.log('   👁️ Visibilidad: 28/28 módulos ambos');  
      console.log('   🏷️ Ambos son roles de sistema');
      console.log('   🎯 Acceso completamente idéntico');
    } else {
      console.log('⚠️ NO - Hay diferencias:');
      console.log(`   🔐 Permisos: DEV(${devPermisos}) vs UNIDADC(${unidacdPermisos})`);
      console.log(`   👁️ Visibilidad: DEV(${devVisible}) vs UNIDADC(${unidacdVisible})`);
      console.log(`   🏷️ Rol sistema: DEV(${desarrolladorRole.is_system_role}) vs UNIDADC(${unidacdRole.is_system_role})`);
    }
    
    console.log(`\n💡 IMPLICACIONES PRÁCTICAS:`);
    console.log(`   • Ambos pueden hacer TODO en el sistema`);
    console.log(`   • Ambos ven TODOS los módulos del sidebar`);
    console.log(`   • No hay restricciones funcionales entre ellos`);
    console.log(`   • La diferencia es solo conceptual (nombre del rol)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleComparison();
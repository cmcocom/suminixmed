#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 VERIFICACIÓN DE DATOS RBAC V2');
    console.log('=' * 50);
    
    // Contar registros
    const stats = {
      roles: await prisma.rbac_roles.count(),
      permissions: await prisma.rbac_permissions.count(),
      rolePermissions: await prisma.rbac_role_permissions.count(),
      moduleVisibility: await prisma.rbac_module_visibility.count(),
      users: await prisma.user.count(),
      userRoles: await prisma.rbac_user_roles.count()
    };
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   • Roles: ${stats.roles}`);
    console.log(`   • Permisos: ${stats.permissions}`);
    console.log(`   • Rol-Permisos: ${stats.rolePermissions}`);
    console.log(`   • Visibilidad: ${stats.moduleVisibility}`);
    console.log(`   • Usuarios: ${stats.users}`);
    console.log(`   • Usuario-Roles: ${stats.userRoles}`);
    
    // Mostrar roles
    console.log('\n👑 ROLES CREADOS:');
    const roles = await prisma.rbac_roles.findMany({
      orderBy: { name: 'asc' }
    });
    
    for (const role of roles) {
      console.log(`   • ${role.name}: ${role.description}`);
    }
    
    // Verificar permisos por rol (muestra)
    console.log('\n🔑 PERMISOS POR ROL (muestra de 5):');
    for (const role of roles) {
      const permissionCount = await prisma.rbac_role_permissions.count({
        where: { 
          role_id: role.id,
          granted: true
        }
      });
      
      const samplePerms = await prisma.rbac_role_permissions.findMany({
        where: { role_id: role.id },
        include: { rbac_permissions: true },
        take: 3
      });
      
      console.log(`   • ${role.name}: ${permissionCount} permisos total`);
      samplePerms.forEach(rp => {
        console.log(`     - ${rp.rbac_permissions.name} (granted: ${rp.granted})`);
      });
    }
    
    // Verificar visibilidad por rol
    console.log('\n👁️ VISIBILIDAD POR ROL:');
    for (const role of roles) {
      const visibleCount = await prisma.rbac_module_visibility.count({
        where: { 
          role_id: role.id,
          is_visible: true
        }
      });
      
      const totalCount = await prisma.rbac_module_visibility.count({
        where: { role_id: role.id }
      });
      
      console.log(`   • ${role.name}: ${visibleCount}/${totalCount} módulos visibles`);
      
      // Mostrar algunos módulos visibles
      const visibleModules = await prisma.rbac_module_visibility.findMany({
        where: { 
          role_id: role.id,
          is_visible: true
        },
        select: { module_key: true },
        take: 5
      });
      
      const moduleList = visibleModules.map(v => v.module_key).join(', ');
      console.log(`     Ejemplos: ${moduleList}...`);
    }
    
    // Verificar usuarios
    console.log('\n👤 USUARIOS:');
    const users = await prisma.user.findMany({
      include: {
        rbac_user_roles: {
          include: { rbac_roles: true }
        }
      }
    });
    
    for (const user of users) {
      const roleNames = user.rbac_user_roles.map(ur => ur.rbac_roles.name).join(', ');
      console.log(`   • ${user.clave} (${user.name}): ${roleNames || 'Sin roles'}`);
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Nueva arquitectura
    console.log('\n🔬 VALIDACIÓN NUEVA ARQUITECTURA:');
    
    // Verificar que TODOS los permisos estén granted=true
    const falsePermissions = await prisma.rbac_role_permissions.count({
      where: { granted: false }
    });
    
    if (falsePermissions === 0) {
      console.log('   ✅ CORRECTO: Todos los permisos están granted=true');
    } else {
      console.log(`   ❌ PROBLEMA: ${falsePermissions} permisos con granted=false`);
    }
    
    // Verificar que exista tabla de visibilidad
    const hasVisibilityTable = stats.moduleVisibility > 0;
    if (hasVisibilityTable) {
      console.log('   ✅ CORRECTO: Tabla rbac_module_visibility poblada');
    } else {
      console.log('   ❌ PROBLEMA: Tabla rbac_module_visibility vacía');
    }
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    
    if (stats.roles > 0 && stats.permissions > 0 && stats.moduleVisibility > 0 && falsePermissions === 0) {
      console.log('✅ LA NUEVA ARQUITECTURA RBAC V2 ESTÁ LISTA PARA USAR');
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('  1. Actualizar componentes frontend');
      console.log('  2. Probar APIs de visibilidad');
      console.log('  3. Validar toggles en sidebar');
    } else {
      console.log('❌ Hay problemas que necesitan resolverse');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
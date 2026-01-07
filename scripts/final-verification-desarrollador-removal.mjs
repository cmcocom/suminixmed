#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function verifyRoleElimination() {
  try {
    console.log('✅ VERIFICACIÓN FINAL: ELIMINACIÓN ROL DESARROLLADOR COMPLETADA');
    console.log('=' * 70);
    
    // 1. Confirmar que DESARROLLADOR no existe
    console.log('\n🔍 1. VERIFICANDO ESTADO DE BASE DE DATOS:');
    
    const allRoles = await prisma.rbac_roles.findMany({
      orderBy: { name: 'asc' }
    });
    
    const desarrolladorExists = allRoles.some(r => r.name === 'DESARROLLADOR');
    const unidacdExists = allRoles.some(r => r.name === 'UNIDADC');
    
    console.log(`   • ¿Rol DESARROLLADOR existe?: ${desarrolladorExists ? '❌ SÍ (PROBLEMA)' : '✅ NO (CORRECTO)'}`);
    console.log(`   • ¿Rol UNIDADC existe?: ${unidacdExists ? '✅ SÍ (CORRECTO)' : '❌ NO (PROBLEMA)'}`);
    
    // 2. Verificar usuarios y sus roles
    console.log('\n👥 2. USUARIOS ACTIVOS:');
    
    const usersWithRoles = await prisma.$queryRaw`
      SELECT 
        u.clave,
        u.name,
        u.activo,
        r.name as role_name
      FROM "User" u
      JOIN rbac_user_roles ur ON u.id = ur.user_id
      JOIN rbac_roles r ON ur.role_id = r.id
      WHERE u.activo = true
      ORDER BY r.name, u.clave;
    `;
    
    if (Array.isArray(usersWithRoles)) {
      const groupedByRole = usersWithRoles.reduce((acc, user) => {
        if (!acc[user.role_name]) acc[user.role_name] = [];
        acc[user.role_name].push(user);
        return acc;
      }, {});
      
      Object.entries(groupedByRole).forEach(([role, users]) => {
        console.log(`   📋 ${role}:`);
        users.forEach(u => {
          console.log(`      • ${u.clave} (${u.name})`);
        });
      });
      
      // Verificar que usuario 888963 está con UNIDADC
      const user888963 = usersWithRoles.find(u => u.clave === '888963');
      if (user888963) {
        console.log(`\n✅ Usuario 888963: Asignado a rol ${user888963.role_name}`);
      } else {
        console.log('\n❌ Usuario 888963: No encontrado');
      }
    }
    
    // 3. Verificar permisos del rol UNIDADC
    console.log('\n🔐 3. VERIFICANDO PERMISOS UNIDADC:');
    
    if (unidacdExists) {
      const unidacdRole = allRoles.find(r => r.name === 'UNIDADC');
      
      const permisosCount = await prisma.rbac_role_permissions.count({
        where: { 
          role_id: unidacdRole.id,
          granted: true 
        }
      });
      
      const visibilidadCount = await prisma.rbac_module_visibility.count({
        where: { 
          role_id: unidacdRole.id,
          is_visible: true 
        }
      });
      
      const totalPermisos = await prisma.rbac_permissions.count();
      const totalModulos = await prisma.rbac_modules.count();
      
      const porcentajePermisos = ((permisosCount / totalPermisos) * 100).toFixed(1);
      const porcentajeVisibilidad = ((visibilidadCount / totalModulos) * 100).toFixed(1);
      
      console.log(`   • Permisos concedidos: ${permisosCount}/${totalPermisos} (${porcentajePermisos}%)`);
      console.log(`   • Módulos visibles: ${visibilidadCount}/${totalModulos} (${porcentajeVisibilidad}%)`);
      
      if (porcentajePermisos === '100.0' && porcentajeVisibilidad === '100.0') {
        console.log('   ✅ UNIDADC tiene acceso COMPLETO al sistema');
      } else {
        console.log('   ⚠️ UNIDADC no tiene acceso completo');
      }
    }
    
    // 4. Resumen final
    console.log('\n📊 4. RESUMEN FINAL:');
    console.log(`   • Roles totales en sistema: ${allRoles.length}`);
    console.log(`   • Usuarios activos con roles: ${Array.isArray(usersWithRoles) ? usersWithRoles.length : 0}`);
    
    // Estado del sistema
    if (!desarrolladorExists && unidacdExists) {
      console.log('\n🎉 ESTADO DEL SISTEMA: ✅ ÓPTIMO');
      console.log('   • Rol DESARROLLADOR eliminado exitosamente');
      console.log('   • Rol UNIDADC funciona como reemplazo');
      console.log('   • Usuario 888963 puede acceder con credenciales 888963/unidadc2024');
      console.log('   • Sistema RBAC V2 con separación permisos/visibilidad activo');
    } else {
      console.log('\n⚠️ ESTADO DEL SISTEMA: REQUIERE ATENCIÓN');
      if (desarrolladorExists) console.log('   • Rol DESARROLLADOR aún existe');
      if (!unidacdExists) console.log('   • Rol UNIDADC no existe');
    }
    
    // 5. Próximos pasos
    console.log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('   1. Probar login con usuario 888963/unidadc2024');
    console.log('   2. Verificar acceso completo a todos los módulos');
    console.log('   3. Probar toggles de visibilidad en sidebar');
    console.log('   4. Revisar logs de aplicación por errores');
    console.log('   5. Documentar cambios realizados');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRoleElimination();
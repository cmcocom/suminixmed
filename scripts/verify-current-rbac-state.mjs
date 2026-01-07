#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function verifyCurrentRoles() {
  try {
    console.log('🔍 VERIFICACIÓN ESTADO ACTUAL DEL SISTEMA RBAC');
    console.log('=' * 60);
    
    // 1. Listar todos los roles
    console.log('\n📋 ROLES EXISTENTES:');
    const allRoles = await prisma.rbac_roles.findMany({
      orderBy: { name: 'asc' }
    });
    
    if (allRoles.length === 0) {
      console.log('❌ No hay roles en el sistema');
      return;
    }
    
    for (const role of allRoles) {
      const tipoRol = role.is_system_role ? '🔧 SISTEMA' : '👤 NORMAL';
      console.log(`\n📌 ${role.name} (${tipoRol})`);
      console.log(`   • ID: ${role.id}`);
      console.log(`   • Descripción: ${role.description}`);
      console.log(`   • Activo: ${role.is_active}`);
      
      // Contar usuarios
      const userCount = await prisma.rbac_user_roles.count({
        where: { role_id: role.id }
      });
      
      // Contar permisos
      const permissionCount = await prisma.rbac_role_permissions.count({
        where: { role_id: role.id }
      });
      
      // Contar visibilidad
      const visibilityCount = await prisma.rbac_module_visibility.count({
        where: { role_id: role.id }
      });
      
      console.log(`   • Usuarios asignados: ${userCount}`);
      console.log(`   • Permisos asignados: ${permissionCount}`);
      console.log(`   • Configuraciones visibilidad: ${visibilityCount}`);
    }
    
    // 2. Verificar usuarios y sus roles
    console.log('\n👥 USUARIOS Y SUS ROLES:');
    const usersWithRoles = await prisma.$queryRaw`
      SELECT 
        u.clave,
        u.name,
        u.activo,
        r.name as role_name,
        r.is_system_role
      FROM "User" u
      JOIN rbac_user_roles ur ON u.id = ur.user_id
      JOIN rbac_roles r ON ur.role_id = r.id
      ORDER BY u.clave, r.name;
    `;
    
    if (Array.isArray(usersWithRoles)) {
      usersWithRoles.forEach(user => {
        const tipoRol = user.is_system_role ? '🔧' : '👤';
        const activo = user.activo ? '✅' : '❌';
        console.log(`   • ${user.clave} (${user.name}) ${activo} → ${tipoRol} ${user.role_name}`);
      });
    }
    
    // 3. Buscar referencias a DESARROLLADOR en el código
    console.log('\n🔍 ANÁLISIS DE ESTADO:');
    
    const desarrolladorExists = allRoles.some(r => r.name === 'DESARROLLADOR');
    const unidacdExists = allRoles.some(r => r.name === 'UNIDADC');
    
    console.log(`   • ¿Existe DESARROLLADOR?: ${desarrolladorExists ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   • ¿Existe UNIDADC?: ${unidacdExists ? '✅ SÍ' : '❌ NO'}`);
    
    if (!desarrolladorExists && unidacdExists) {
      console.log('\n🎉 ESTADO IDEAL: DESARROLLADOR eliminado, UNIDADC disponible');
      console.log('📝 PRÓXIMO PASO: Actualizar referencias en código');
    } else if (desarrolladorExists && unidacdExists) {
      console.log('\n⚠️ DUPLICADO: Ambos roles existen - necesario eliminar DESARROLLADOR');
    } else if (desarrolladorExists && !unidacdExists) {
      console.log('\n❌ PROBLEMA: Solo existe DESARROLLADOR - necesario crear UNIDADC');
    } else {
      console.log('\n❌ PROBLEMA CRÍTICO: No existe ninguno de los dos roles principales');
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`   • Total de roles: ${allRoles.length}`);
    console.log(`   • Total de usuarios con roles: ${Array.isArray(usersWithRoles) ? usersWithRoles.length : 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCurrentRoles();
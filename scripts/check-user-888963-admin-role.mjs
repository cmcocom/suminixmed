#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkUser888963() {
  try {
    console.log('🔍 Verificando usuario con clave 888963...\n');
    
    // Buscar usuario por clave
    const user = await prisma.user.findUnique({
      where: { clave: '888963' },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ NO ENCONTRADO: Usuario con clave 888963 no existe en la base de datos');
      return;
    }
    
    console.log('✅ USUARIO ENCONTRADO:');
    console.log(`   • ID: ${user.id}`);
    console.log(`   • Clave: ${user.clave}`);
    console.log(`   • Nombre: ${user.name}`);
    console.log(`   • Email: ${user.email || 'No configurado'}`);
    console.log(`   • Activo: ${user.activo ? 'Sí' : 'No'}`);
    console.log(`   • Usuario de Sistema: ${user.is_system_user ? 'Sí' : 'No'}`);
    
    // Verificar roles asignados
    console.log('\n👑 ROLES ASIGNADOS:');
    
    if (user.rbac_user_roles.length === 0) {
      console.log('   ❌ Sin roles asignados');
    } else {
      for (const userRole of user.rbac_user_roles) {
        console.log(`   • ${userRole.rbac_roles.name} (${userRole.rbac_roles.description})`);
        console.log(`     - Asignado por: ${userRole.assigned_by}`);
        console.log(`     - Fecha asignación: ${userRole.assigned_at.toLocaleString('es-MX')}`);
      }
    }
    
    // Verificar específicamente si tiene rol ADMINISTRADOR
    const hasAdminRole = user.rbac_user_roles.some(
      ur => ur.rbac_roles.name === 'ADMINISTRADOR'
    );
    
    console.log('\n🎯 VERIFICACIÓN ESPECÍFICA:');
    if (hasAdminRole) {
      console.log('   ✅ SÍ tiene el rol ADMINISTRADOR');
    } else {
      console.log('   ❌ NO tiene el rol ADMINISTRADOR');
      
      // Mostrar qué roles SÍ tiene
      const roleNames = user.rbac_user_roles.map(ur => ur.rbac_roles.name);
      if (roleNames.length > 0) {
        console.log(`   📋 Roles actuales: ${roleNames.join(', ')}`);
      }
    }
    
    // Mostrar todos los roles disponibles para referencia
    console.log('\n📚 ROLES DISPONIBLES EN EL SISTEMA:');
    const allRoles = await prisma.rbac_roles.findMany({
      orderBy: { name: 'asc' }
    });
    
    for (const role of allRoles) {
      const isAssigned = user.rbac_user_roles.some(ur => ur.role_id === role.id);
      const status = isAssigned ? '✅' : '⭕';
      console.log(`   ${status} ${role.name}: ${role.description}`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser888963();
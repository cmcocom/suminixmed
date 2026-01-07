#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log('📋 LISTADO DE TODOS LOS USUARIOS EN EL SISTEMA:\n');
    
    const users = await prisma.user.findMany({
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      },
      orderBy: { clave: 'asc' }
    });
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    console.log(`✅ Total de usuarios encontrados: ${users.length}\n`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const roleNames = user.rbac_user_roles.map(ur => ur.rbac_roles.name);
      const hasAdminRole = roleNames.includes('ADMINISTRADOR');
      
      console.log(`${i + 1}. 👤 ${user.name}`);
      console.log(`   • Clave: ${user.clave}`);
      console.log(`   • Email: ${user.email || 'No configurado'}`);
      console.log(`   • Activo: ${user.activo ? 'Sí' : 'No'}`);
      console.log(`   • Rol ADMINISTRADOR: ${hasAdminRole ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   • Roles: ${roleNames.length > 0 ? roleNames.join(', ') : 'Sin roles'}`);
      console.log('');
    }
    
    // Resumen de administradores
    const adminUsers = users.filter(user => 
      user.rbac_user_roles.some(ur => ur.rbac_roles.name === 'ADMINISTRADOR')
    );
    
    console.log('👑 RESUMEN DE ADMINISTRADORES:');
    if (adminUsers.length === 0) {
      console.log('   ❌ No hay usuarios con rol ADMINISTRADOR');
    } else {
      console.log(`   ✅ ${adminUsers.length} usuario(s) con rol ADMINISTRADOR:`);
      adminUsers.forEach(user => {
        console.log(`      - ${user.clave} (${user.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('es-MX');
  const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function checkExistingUsers() {
  await log('🔍 Verificando usuarios existentes...');
  
  const users = await prisma.user.findMany({
    include: {
      rbac_user_roles: {
        include: { rbac_roles: true }
      }
    }
  });
  
  if (users.length === 0) {
    await log('⚠️ No hay usuarios en el sistema', 'ERROR');
    return [];
  }
  
  await log(`📊 Encontrados ${users.length} usuarios:`);
  
  for (const user of users) {
    const roles = user.rbac_user_roles.map(ur => ur.rbac_roles.name).join(', ');
    const hasPassword = user.password ? '🔐' : '🚫';
    
    await log(`   • ${user.clave} (${user.name}) - ${hasPassword} - Roles: ${roles || 'Sin roles'}`);
  }
  
  return users;
}

async function createTestUser() {
  await log('👤 Creando usuario de prueba completo...');
  
  // Verificar si ya existe
  const existing = await prisma.user.findUnique({
    where: { clave: 'admin001' }
  });
  
  if (existing) {
    await log('⚠️ Usuario admin001 ya existe. Actualizando...');
    
    // Actualizar password si no tiene
    if (!existing.password) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.update({
        where: { id: existing.id },
        data: { 
          password: hashedPassword,
          activo: true
        }
      });
      
      await log('✅ Password actualizado para admin001', 'SUCCESS');
    }
    
    return existing;
  }
  
  // Crear nuevo usuario
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const newUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      clave: 'admin001',
      name: 'Admin Test',
      email: 'admin@test.com',
      password: hashedPassword,
      activo: true,
      is_system_user: false
    }
  });
  
  // Asignar rol ADMINISTRADOR
  const adminRole = await prisma.rbac_roles.findUnique({
    where: { name: 'ADMINISTRADOR' }
  });
  
  if (adminRole) {
    await prisma.rbac_user_roles.create({
      data: {
        id: randomUUID(),
        user_id: newUser.id,
        role_id: adminRole.id,
        assigned_by: 'TEST_SCRIPT',
        assigned_at: new Date()
      }
    });
    
    await log(`✅ Usuario creado: ${newUser.clave} con rol ADMINISTRADOR`, 'SUCCESS');
  }
  
  return newUser;
}

async function createOperatorUser() {
  await log('👥 Creando usuario OPERADOR de prueba...');
  
  // Verificar si ya existe
  const existing = await prisma.user.findUnique({
    where: { clave: 'oper001' }
  });
  
  if (existing) {
    await log('⚠️ Usuario oper001 ya existe');
    return existing;
  }
  
  const hashedPassword = await bcrypt.hash('oper123', 10);
  
  const newUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      clave: 'oper001',
      name: 'Operador Test',
      email: 'operador@test.com',
      password: hashedPassword,
      activo: true,
      is_system_user: false
    }
  });
  
  // Asignar rol OPERADOR
  const operRole = await prisma.rbac_roles.findUnique({
    where: { name: 'OPERADOR' }
  });
  
  if (operRole) {
    await prisma.rbac_user_roles.create({
      data: {
        id: randomUUID(),
        user_id: newUser.id,
        role_id: operRole.id,
        assigned_by: 'TEST_SCRIPT',
        assigned_at: new Date()
      }
    });
    
    await log(`✅ Usuario creado: ${newUser.clave} con rol OPERADOR`, 'SUCCESS');
  }
  
  return newUser;
}

async function main() {
  try {
    await log('🚀 VERIFICANDO Y CREANDO USUARIOS DE PRUEBA');
    await log('=' * 60);
    
    // Verificar usuarios existentes
    await checkExistingUsers();
    
    // Crear usuarios de prueba si es necesario
    await createTestUser();
    await createOperatorUser();
    
    // Mostrar credenciales finales
    console.log('\n🔑 CREDENCIALES DE ACCESO AL SISTEMA:');
    console.log('=' * 50);
    console.log('');
    console.log('🏥 SuminixMed - Nueva Arquitectura RBAC V2');
    console.log('');
    console.log('👨‍💼 ADMINISTRADOR:');
    console.log('   • Clave: admin001');
    console.log('   • Password: admin123');
    console.log('   • Visibilidad: 28/28 módulos (TODO visible)');
    console.log('');
    console.log('👨‍💻 OPERADOR:');
    console.log('   • Clave: oper001');
    console.log('   • Password: oper123');
    console.log('   • Visibilidad: 7/28 módulos (limitado para pruebas)');
    console.log('');
    console.log('🌐 URL DE ACCESO:');
    console.log('   • Login: http://localhost:3000/login');
    console.log('   • Dashboard: http://localhost:3000/dashboard');
    console.log('   • Prueba RBAC V2: http://localhost:3000/dashboard/rbac-v2-test');
    console.log('');
    console.log('🧪 PARA PROBAR LA NUEVA ARQUITECTURA:');
    console.log('   1. Acceder con usuario OPERADOR');
    console.log('   2. Verificar que sidebar muestre solo 7 módulos');
    console.log('   3. Probar que APIs funcionen para TODOS los módulos');
    console.log('   4. Usar toggles en /dashboard/ajustes/rbac');
    console.log('');
    
  } catch (error) {
    await log(`\n❌ ERROR: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
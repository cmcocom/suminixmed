#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🔑 Creando usuarios de prueba...\n');
    
    // Usuario ADMINISTRADOR
    const adminExists = await prisma.user.findUnique({
      where: { clave: 'admin001' }
    });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
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
            user_id: adminUser.id,
            role_id: adminRole.id,
            assigned_by: 'SCRIPT',
            assigned_at: new Date()
          }
        });
      }
      
      console.log('✅ Usuario ADMINISTRADOR creado');
    } else {
      console.log('ℹ️ Usuario ADMINISTRADOR ya existe');
    }
    
    // Usuario OPERADOR
    const operExists = await prisma.user.findUnique({
      where: { clave: 'oper001' }
    });
    
    if (!operExists) {
      const hashedPassword = await bcrypt.hash('oper123', 10);
      
      const operUser = await prisma.user.create({
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
            user_id: operUser.id,
            role_id: operRole.id,
            assigned_by: 'SCRIPT',
            assigned_at: new Date()
          }
        });
      }
      
      console.log('✅ Usuario OPERADOR creado');
    } else {
      console.log('ℹ️ Usuario OPERADOR ya existe');
    }
    
    console.log('\n🎯 CREDENCIALES LISTAS:\n');
    console.log('👨‍💼 ADMINISTRADOR:');
    console.log('   Clave: admin001');
    console.log('   Password: admin123');
    console.log('   Acceso: COMPLETO (28/28 módulos visibles)\n');
    
    console.log('👨‍💻 OPERADOR:');
    console.log('   Clave: oper001');
    console.log('   Password: oper123');
    console.log('   Acceso: LIMITADO (7/28 módulos visibles)\n');
    
    console.log('🌐 URL de acceso: http://localhost:3000/login');
    console.log('📋 Página de prueba: http://localhost:3000/dashboard/rbac-v2-test\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
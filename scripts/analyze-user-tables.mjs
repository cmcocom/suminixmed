#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function analyzeUserTables() {
  try {
    console.log('🔍 ANÁLISIS COMPLETO DE TABLAS DE USUARIOS');
    console.log('=' * 60);
    
    // 1. Verificar qué tablas de usuarios existen
    console.log('\n📋 1. TABLAS RELACIONADAS CON USUARIOS:');
    
    try {
      // Verificar tabla "User" (con U mayúscula)
      const usersFromUserTable = await prisma.$queryRaw`
        SELECT 
          id, 
          clave, 
          name, 
          email, 
          activo, 
          "createdAt", 
          "updatedAt"
        FROM "User" 
        ORDER BY clave;
      `;
      
      console.log('\n✅ Tabla "User" encontrada:');
      if (Array.isArray(usersFromUserTable)) {
        console.log(`   📊 Total de usuarios: ${usersFromUserTable.length}`);
        usersFromUserTable.forEach(user => {
          console.log(`   👤 ${user.clave} - ${user.name} (${user.email}) - Activo: ${user.activo}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Tabla "User" no encontrada:', error.message);
    }
    
    try {
      // Verificar tabla "users" (con u minúscula)
      const usersFromUsersTable = await prisma.$queryRaw`
        SELECT 
          id, 
          clave, 
          name, 
          email, 
          activo, 
          created_at, 
          updated_at
        FROM users 
        ORDER BY clave;
      `;
      
      console.log('\n✅ Tabla "users" encontrada:');
      if (Array.isArray(usersFromUsersTable)) {
        console.log(`   📊 Total de usuarios: ${usersFromUsersTable.length}`);
        usersFromUsersTable.forEach(user => {
          console.log(`   👤 ${user.clave} - ${user.name} (${user.email}) - Activo: ${user.activo}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Tabla "users" no encontrada:', error.message);
    }
    
    // 2. Verificar usuarios específicos mencionados
    console.log('\n🎯 2. VERIFICANDO USUARIOS ESPECÍFICOS (888963 y 081533):');
    
    try {
      const user888963 = await prisma.user.findUnique({
        where: { clave: '888963' },
        include: {
          rbac_user_roles: {
            include: {
              role: true
            }
          }
        }
      });
      
      if (user888963) {
        console.log('✅ Usuario 888963 encontrado en tabla User:');
        console.log(`   • ID: ${user888963.id}`);
        console.log(`   • Nombre: ${user888963.name}`);
        console.log(`   • Email: ${user888963.email}`);
        console.log(`   • Activo: ${user888963.activo}`);
        console.log(`   • Roles: ${user888963.rbac_user_roles.map(ur => ur.role.name).join(', ')}`);
      } else {
        console.log('❌ Usuario 888963 NO encontrado en tabla User');
      }
      
      const user081533 = await prisma.user.findUnique({
        where: { clave: '081533' }
      });
      
      if (user081533) {
        console.log('✅ Usuario 081533 encontrado en tabla User:');
        console.log(`   • ID: ${user081533.id}`);
        console.log(`   • Nombre: ${user081533.name}`);
        console.log(`   • Email: ${user081533.email}`);
        console.log(`   • Activo: ${user081533.activo}`);
      } else {
        console.log('❌ Usuario 081533 NO encontrado en tabla User');
      }
      
    } catch (error) {
      console.log('❌ Error verificando usuarios específicos:', error.message);
    }
    
    // 3. Verificar schema de tabla User
    console.log('\n🏗️ 3. ESTRUCTURA DE TABLA User:');
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        ORDER BY ordinal_position;
      `;
      
      if (Array.isArray(tableInfo)) {
        tableInfo.forEach(col => {
          console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });
      }
    } catch (error) {
      console.log('❌ Error obteniendo estructura de tabla:', error.message);
    }
    
    // 4. Verificar todos los usuarios con roles
    console.log('\n👥 4. TODOS LOS USUARIOS CON ROLES ASIGNADOS:');
    try {
      const allUsersWithRoles = await prisma.$queryRaw`
        SELECT 
          u.clave,
          u.name,
          u.activo,
          r.name as role_name
        FROM "User" u
        LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
        LEFT JOIN rbac_roles r ON ur.role_id = r.id
        ORDER BY u.clave, r.name;
      `;
      
      if (Array.isArray(allUsersWithRoles)) {
        const userGroups = {};
        allUsersWithRoles.forEach(user => {
          if (!userGroups[user.clave]) {
            userGroups[user.clave] = {
              name: user.name,
              activo: user.activo,
              roles: []
            };
          }
          if (user.role_name) {
            userGroups[user.clave].roles.push(user.role_name);
          }
        });
        
        Object.entries(userGroups).forEach(([clave, data]) => {
          const rolesText = data.roles.length > 0 ? data.roles.join(', ') : 'Sin roles';
          const status = data.activo ? '✅' : '❌';
          console.log(`   ${status} ${clave} (${data.name}) → ${rolesText}`);
        });
      }
    } catch (error) {
      console.log('❌ Error obteniendo usuarios con roles:', error.message);
    }
    
    console.log('\n📋 RESUMEN DEL ANÁLISIS:');
    console.log('🔍 Verificar si los problemas son:');
    console.log('   1. Usuarios existen pero no tienen roles asignados');
    console.log('   2. Problema con el SidebarProvider en el código React');
    console.log('   3. Problema de autenticación en NextAuth');
    console.log('   4. Cambios en el esquema que afectan la sesión');
    
  } catch (error) {
    console.error('❌ Error general en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUserTables();
#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function findUser888963() {
  try {
    console.log('🔍 BÚSQUEDA ESPECÍFICA DEL USUARIO 888963');
    console.log('=' * 50);
    
    // 1. Ver estructura de la tabla User
    console.log('\n1️⃣ ESTRUCTURA DE LA TABLA "User":');
    const structure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.table(structure);
    
    // 2. Buscar usuario 888963 con campos que sabemos que existen
    console.log('\n2️⃣ BUSCANDO USUARIO 888963:');
    const user888963 = await prisma.$queryRaw`
      SELECT id, clave, name, email, activo, password
      FROM "User" 
      WHERE clave = '888963';
    `;
    
    if (Array.isArray(user888963) && user888963.length > 0) {
      console.log('✅ ¡USUARIO 888963 ENCONTRADO!');
      console.table(user888963);
      
      // Verificar roles del usuario encontrado
      console.log('\n3️⃣ ROLES DEL USUARIO 888963:');
      const userId = user888963[0].id;
      
      const userRoles = await prisma.$queryRaw`
        SELECT 
          u.clave,
          u.name,
          r.name as role_name,
          r.description as role_description,
          r.is_system_role,
          ur.assigned_at
        FROM "User" u
        JOIN rbac_user_roles ur ON u.id = ur.user_id
        JOIN rbac_roles r ON ur.role_id = r.id
        WHERE u.id = ${userId};
      `;
      
      console.table(userRoles);
      
    } else {
      console.log('❌ Usuario 888963 NO encontrado');
    }
    
    // 3. Listar TODOS los usuarios disponibles
    console.log('\n4️⃣ TODOS LOS USUARIOS EN LA BASE DE DATOS:');
    const allUsers = await prisma.$queryRaw`
      SELECT id, clave, name, email, activo, 
             CASE WHEN password IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_password
      FROM "User" 
      ORDER BY clave;
    `;
    console.table(allUsers);
    
    // 4. Verificar si hay usuarios con patrones similares
    console.log('\n5️⃣ BUSCANDO PATRONES SIMILARES A 888963:');
    const similarUsers = await prisma.$queryRaw`
      SELECT clave, name, email, activo
      FROM "User" 
      WHERE clave LIKE '%888%' OR clave LIKE '%963%' OR email LIKE '%888%'
      ORDER BY clave;
    `;
    console.table(similarUsers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUser888963();
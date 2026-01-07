#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function investigateUserTables() {
  try {
    console.log('🔍 INVESTIGACIÓN COMPLETA DE TABLAS DE USUARIOS');
    console.log('=' * 60);
    
    // 1. Verificar schema actual
    console.log('\n1️⃣ VERIFICANDO ESQUEMA DE BASE DE DATOS:');
    
    // Consulta directa para ver todas las tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%' OR table_name LIKE '%User%'
      ORDER BY table_name;
    `;
    
    console.log('📋 TABLAS RELACIONADAS CON USUARIOS:');
    console.table(tables);
    
    // 2. Buscar usuario 888963 en tabla "User" (con U mayúscula)
    console.log('\n2️⃣ BUSCANDO EN TABLA "User" (mayúscula):');
    try {
      const userMayuscula = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE clave = '888963';
      `;
      console.log('✅ Resultado en tabla "User":');
      console.table(userMayuscula);
    } catch (error) {
      console.log('❌ Error en tabla "User":', error.message);
    }
    
    // 3. Buscar en tabla "user" (minúscula) 
    console.log('\n3️⃣ BUSCANDO EN TABLA "user" (minúscula):');
    try {
      const userMinuscula = await prisma.$queryRaw`
        SELECT * FROM "user" WHERE clave = '888963';
      `;
      console.log('✅ Resultado en tabla "user":');
      console.table(userMinuscula);
    } catch (error) {
      console.log('❌ Error en tabla "user":', error.message);
    }
    
    // 4. Buscar por email también
    console.log('\n4️⃣ BUSCANDO POR PATRONES DE EMAIL:');
    try {
      const usersByEmail = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE email LIKE '%888963%' OR email LIKE '%unidadc%';
      `;
      console.log('📧 Usuarios por patrón de email:');
      console.table(usersByEmail);
    } catch (error) {
      console.log('❌ Error buscando por email:', error.message);
    }
    
    // 5. Listar TODOS los usuarios de TODAS las tablas
    console.log('\n5️⃣ LISTANDO TODOS LOS USUARIOS:');
    try {
      const todosUsuarios = await prisma.$queryRaw`
        SELECT 
          id, clave, name, email, activo, is_system_user,
          created_at, updated_at
        FROM "User" 
        ORDER BY created_at DESC;
      `;
      console.log('👥 TODOS los usuarios en la base de datos:');
      console.table(todosUsuarios);
    } catch (error) {
      console.log('❌ Error listando usuarios:', error.message);
    }
    
    // 6. Verificar qué tabla usa NextAuth
    console.log('\n6️⃣ VERIFICANDO CONFIGURACIÓN NEXTAUTH:');
    
    // Buscar en archivos de configuración
    console.log('📁 Verificando modelo Prisma actual...');
    
    // 7. Buscar usuarios activos/inactivos
    console.log('\n7️⃣ ESTADÍSTICAS DE USUARIOS:');
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          activo,
          COUNT(*) as cantidad
        FROM "User" 
        GROUP BY activo;
      `;
      console.log('📊 Estadísticas por estado:');
      console.table(stats);
    } catch (error) {
      console.log('❌ Error en estadísticas:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en investigación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateUserTables();
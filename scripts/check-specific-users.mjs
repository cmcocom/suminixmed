#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkSpecificUsers() {
  try {
    console.log('🔍 VERIFICACIÓN ESPECÍFICA DE USUARIOS 888963 y 081533');
    console.log('=' * 60);
    
    // Buscar usuarios específicos
    const allUsers = await prisma.$queryRaw`
      SELECT 
        id,
        clave,
        name,
        email,
        activo,
        "createdAt"
      FROM "User"
      WHERE clave IN ('888963', '081533')
      OR clave LIKE '%888963%'
      OR clave LIKE '%081533%';
    `;
    
    console.log('🎯 USUARIOS ESPECÍFICOS ENCONTRADOS:');
    if (Array.isArray(allUsers) && allUsers.length > 0) {
      allUsers.forEach(user => {
        console.log(`✅ ${user.clave} - ${user.name} (${user.email}) - Activo: ${user.activo}`);
        console.log(`   Creado: ${user.createdAt}`);
      });
    } else {
      console.log('❌ No se encontraron usuarios 888963 o 081533');
    }
    
    // Verificar TODOS los usuarios en la tabla
    console.log('\n📋 TODOS LOS USUARIOS EN LA TABLA "User":');
    const todosLosUsuarios = await prisma.$queryRaw`
      SELECT 
        clave,
        name,
        email,
        activo,
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC;
    `;
    
    if (Array.isArray(todosLosUsuarios)) {
      console.log(`📊 Total de usuarios en tabla: ${todosLosUsuarios.length}`);
      todosLosUsuarios.forEach(user => {
        const status = user.activo ? '✅' : '❌';
        console.log(`${status} ${user.clave} - ${user.name} (${user.email})`);
        console.log(`   Creado: ${user.createdAt}`);
      });
    }
    
    // Verificar si hay otras tablas que podrían tener usuarios
    console.log('\n🔍 BUSCANDO OTRAS TABLAS DE USUARIOS:');
    try {
      const tablesQuery = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%user%';
      `;
      
      if (Array.isArray(tablesQuery)) {
        console.log('📋 Tablas relacionadas con usuarios:');
        tablesQuery.forEach(table => {
          console.log(`   • ${table.table_name}`);
        });
      }
    } catch (error) {
      console.log('❌ Error buscando tablas:', error.message);
    }
    
    console.log('\n🚨 DIAGNÓSTICO:');
    if (Array.isArray(allUsers) && allUsers.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Los usuarios 888963 y 081533 NO EXISTEN en la tabla User actual');
      console.log('📝 POSIBLES CAUSAS:');
      console.log('   1. Los usuarios estaban en una tabla diferente');
      console.log('   2. Hubo una migración que no preservó los usuarios originales');
      console.log('   3. Los usuarios se crearon solo como prueba y se perdieron');
      console.log('   4. Hay un problema con la configuración de la base de datos');
      
      console.log('\n💡 SOLUCIÓN RECOMENDADA:');
      console.log('   1. Crear nuevamente los usuarios que faltan');
      console.log('   2. Asignar los roles apropiados');
      console.log('   3. Verificar/reparar el SidebarProvider');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificUsers();
#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function finalUserCheck() {
  try {
    console.log('🧹 VERIFICACIÓN POST-LIMPIEZA DE CACHE');
    console.log('=' * 50);
    
    console.log('\n🔍 ESTADO ACTUAL DE LA BASE DE DATOS:');
    
    // Verificar conexión fresca a BD
    const allUsers = await prisma.$queryRaw`
      SELECT 
        clave,
        name,
        email,
        activo,
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`📊 Total usuarios en BD: ${Array.isArray(allUsers) ? allUsers.length : 0}`);
    
    if (Array.isArray(allUsers)) {
      allUsers.forEach(user => {
        console.log(`   ${user.activo ? '✅' : '❌'} ${user.clave} - ${user.name} (${user.email})`);
        console.log(`      Creado: ${user.createdAt}`);
      });
    }
    
    // Verificar específicamente los usuarios mencionados
    console.log('\n🎯 VERIFICACIÓN ESPECÍFICA:');
    
    const specificUsers = await prisma.$queryRaw`
      SELECT clave, name, activo
      FROM "User"
      WHERE clave IN ('888963', '081533')
      ORDER BY clave;
    `;
    
    if (Array.isArray(specificUsers)) {
      if (specificUsers.length === 0) {
        console.log('❌ NINGUNO de los usuarios (888963, 081533) existe');
      } else {
        console.log('✅ Usuarios encontrados:');
        specificUsers.forEach(user => {
          console.log(`   • ${user.clave}: ${user.name} - ${user.activo ? 'Activo' : 'Inactivo'}`);
        });
        
        const has888963 = specificUsers.some(u => u.clave === '888963');
        const has081533 = specificUsers.some(u => u.clave === '081533');
        
        console.log(`\n📋 RESULTADO DEFINITIVO DESPUÉS DE LIMPIAR CACHE:`);
        console.log(`   • Usuario 888963: ${has888963 ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`   • Usuario 081533: ${has081533 ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      }
    }
    
    // Verificar timestamp actual para confirmar consulta fresca
    const now = await prisma.$queryRaw`SELECT NOW() as current_time;`;
    if (Array.isArray(now)) {
      console.log(`\n⏰ Consulta ejecutada en: ${now[0].current_time}`);
    }
    
    console.log('\n💡 CONCLUSIÓN DEFINITIVA:');
    console.log('Cache de Node.js, Next.js y npm completamente limpiado.');
    console.log('Esta consulta es directa a la base de datos sin ningún cache.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalUserCheck();
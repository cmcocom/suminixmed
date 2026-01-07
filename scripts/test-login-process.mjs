#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLoginProcess() {
  try {
    console.log('🔍 ANÁLISIS DEL PROCESO DE LOGIN');
    console.log('=' * 60);
    
    // 1. Verificar qué modelo usa Prisma exactamente
    console.log('\n📋 1. VERIFICANDO MODELO PRISMA:');
    
    // Probar directamente la consulta que hace auth.ts
    console.log('   🔄 Ejecutando: prisma.user.findUnique({ where: { clave: "888963" } })');
    
    try {
      const user888963 = await prisma.user.findUnique({
        where: { clave: '888963' },
        include: { empleados: true }
      });
      
      if (user888963) {
        console.log('   ✅ Usuario 888963 encontrado:');
        console.log(`      • ID: ${user888963.id}`);
        console.log(`      • Clave: ${user888963.clave}`);
        console.log(`      • Nombre: ${user888963.name}`);
        console.log(`      • Email: ${user888963.email}`);
        console.log(`      • Activo: ${user888963.activo}`);
        console.log(`      • Tiene password: ${user888963.password ? 'SÍ' : 'NO'}`);
        console.log(`      • Empleado vinculado: ${user888963.empleados ? 'SÍ' : 'NO'}`);
      } else {
        console.log('   ❌ Usuario 888963 NO encontrado con prisma.user.findUnique()');
      }
    } catch (error) {
      console.log('   ❌ Error en consulta prisma.user:', error.message);
    }
    
    // 2. Probar con el usuario que dice que existe (081533)
    console.log('\n📋 2. VERIFICANDO USUARIO 081533:');
    
    console.log('   🔄 Ejecutando: prisma.user.findUnique({ where: { clave: "081533" } })');
    
    try {
      const user081533 = await prisma.user.findUnique({
        where: { clave: '081533' },
        include: { empleados: true }
      });
      
      if (user081533) {
        console.log('   ✅ Usuario 081533 encontrado:');
        console.log(`      • ID: ${user081533.id}`);
        console.log(`      • Clave: ${user081533.clave}`);
        console.log(`      • Nombre: ${user081533.name}`);
        console.log(`      • Email: ${user081533.email}`);
        console.log(`      • Activo: ${user081533.activo}`);
        console.log(`      • Tiene password: ${user081533.password ? 'SÍ' : 'NO'}`);
      } else {
        console.log('   ❌ Usuario 081533 NO encontrado con prisma.user.findUnique()');
      }
    } catch (error) {
      console.log('   ❌ Error en consulta prisma.user:', error.message);
    }
    
    // 3. Verificar tabla directamente con SQL
    console.log('\n📋 3. VERIFICACIÓN DIRECTA EN BASE DE DATOS:');
    
    console.log('   🔄 Ejecutando consulta SQL directa en tabla "User"');
    try {
      const directQuery = await prisma.$queryRaw`
        SELECT clave, name, email, activo, password IS NOT NULL as has_password
        FROM "User"
        WHERE clave IN ('888963', '081533')
        ORDER BY clave;
      `;
      
      if (Array.isArray(directQuery) && directQuery.length > 0) {
        console.log('   ✅ Resultados de consulta SQL directa:');
        directQuery.forEach(user => {
          console.log(`      • ${user.clave}: ${user.name} (${user.email}) - Activo: ${user.activo} - Password: ${user.has_password ? 'SÍ' : 'NO'}`);
        });
      } else {
        console.log('   ❌ No se encontraron usuarios con consulta SQL directa');
      }
    } catch (error) {
      console.log('   ❌ Error en consulta SQL directa:', error.message);
    }
    
    // 4. Verificar TODOS los usuarios que están en la tabla
    console.log('\n📋 4. TODOS LOS USUARIOS EN LA TABLA:');
    
    try {
      const allUsers = await prisma.user.findMany({
        select: {
          clave: true,
          name: true,
          email: true,
          activo: true,
          createdAt: true,
          password: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`   📊 Total de usuarios: ${allUsers.length}`);
      allUsers.forEach(user => {
        const status = user.activo ? '✅' : '❌';
        const hasPassword = user.password ? '🔒' : '🔓';
        console.log(`   ${status}${hasPassword} ${user.clave} - ${user.name} (${user.email})`);
        console.log(`      Creado: ${user.createdAt}`);
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo todos los usuarios:', error.message);
    }
    
    // 5. Simular proceso de autenticación completo
    console.log('\n📋 5. SIMULACIÓN DE PROCESO DE LOGIN:');
    
    console.log('   🔄 Simulando login con usuario 888963...');
    
    try {
      // Simular exactamente lo que hace auth.ts
      const testUser = await prisma.user.findUnique({
        where: { clave: '888963' },
        include: { empleados: true }
      });
      
      if (!testUser || !testUser.password) {
        console.log('   ❌ FALLO: Usuario no encontrado o sin password');
      } else {
        console.log('   ✅ PASO 1: Usuario encontrado');
        
        // Verificar si la password es correcta (usando la que sabemos)
        console.log('   🔄 Verificando password...');
        
        // La password debería ser 'unidadc2024' para el usuario 888963
        const testPassword = 'unidadc2024';
        
        try {
          const isPasswordValid = await bcrypt.compare(testPassword, testUser.password);
          console.log(`   ${isPasswordValid ? '✅' : '❌'} PASO 2: Verificación de password - ${isPasswordValid ? 'CORRECTA' : 'INCORRECTA'}`);
          
          if (isPasswordValid) {
            console.log('   ✅ LOGIN DEBERÍA FUNCIONAR para usuario 888963');
          } else {
            console.log('   ❌ LOGIN FALLARÍA por password incorrecta');
          }
        } catch (bcryptError) {
          console.log('   ❌ Error verificando password:', bcryptError.message);
        }
      }
    } catch (error) {
      console.log('   ❌ Error en simulación:', error.message);
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('La página de login consulta la tabla "User" usando:');
    console.log('   prisma.user.findUnique({ where: { clave: credentials.clave } })');
    console.log('\nEsto se traduce a consultar la tabla "User" por el campo "clave"');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginProcess();
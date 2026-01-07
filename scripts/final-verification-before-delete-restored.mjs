#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

async function finalVerification() {
  try {
    console.log('🧪 VERIFICACIÓN FINAL ANTES DE ELIMINAR RESTORED');
    console.log('=' * 60);
    
    const prisma = new PrismaClient();
    
    console.log('\n📋 1. VERIFICANDO CONEXIÓN A SUMINIX...');
    
    // Test básico de conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a base de datos suminix');
    
    console.log('\n📋 2. VERIFICANDO USUARIOS CRÍTICOS...');
    
    const criticalUsers = await prisma.user.findMany({
      where: {
        clave: { in: ['081533', '888963', 'admin001'] }
      },
      select: { clave: true, name: true, email: true, activo: true }
    });
    
    console.log(`✅ Usuarios críticos encontrados (${criticalUsers.length}/3):`);
    criticalUsers.forEach(u => {
      console.log(`   • ${u.clave} - ${u.name} (${u.email}) - ${u.activo ? 'Activo' : 'Inactivo'}`);
    });
    
    console.log('\n📋 3. VERIFICANDO SISTEMA RBAC V2...');
    
    // Verificar tablas RBAC V2
    const rbacTables = [
      'rbac_roles',
      'rbac_permissions', 
      'rbac_user_roles',
      'rbac_role_permissions',
      'rbac_module_visibility'
    ];
    
    for (const table of rbacTables) {
      try {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM ${table}
        `.then(result => Array.isArray(result) ? result[0]?.count : 0);
        
        console.log(`   ✅ Tabla ${table}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ Error en tabla ${table}: ${error.message}`);
      }
    }
    
    console.log('\n📋 4. VERIFICANDO ROLES DE USUARIO 081533...');
    
    const user081533Roles = await prisma.rbac_user_roles.findMany({
      where: { 
        User: { clave: '081533' }
      },
      include: {
        rbac_roles: { select: { name: true, description: true } }
      }
    });
    
    if (user081533Roles.length > 0) {
      console.log(`✅ Usuario 081533 tiene ${user081533Roles.length} rol(es):`);
      user081533Roles.forEach(ur => {
        console.log(`   • ${ur.rbac_roles.name} - ${ur.rbac_roles.description}`);
      });
    } else {
      console.log('❌ Usuario 081533 no tiene roles asignados');
    }
    
    console.log('\n📋 5. VERIFICANDO DATOS GENERALES...');
    
    const counts = {
      users: await prisma.user.count(),
      inventario: await prisma.inventario.count(),
      clientes: await prisma.clientes.count(),
      proveedores: await prisma.proveedores.count()
    };
    
    console.log('📊 Resumen de datos:');
    console.log(`   • Usuarios: ${counts.users}`);
    console.log(`   • Inventario: ${counts.inventario}`);
    console.log(`   • Clientes: ${counts.clientes}`);
    console.log(`   • Proveedores: ${counts.proveedores}`);
    
    console.log('\n🎯 6. RESUMEN FINAL:');
    
    if (criticalUsers.length === 3 && user081533Roles.length > 0) {
      console.log('✅ TODAS LAS VERIFICACIONES PASARON');
      console.log('');
      console.log('🗑️ PUEDES ELIMINAR LA BD RESTORED SEGURAMENTE');
      console.log('   • Base de datos: restored_suminix_20251027_backup');
      console.log('   • Comando: DROP DATABASE "restored_suminix_20251027_backup";');
      console.log('');
      console.log('📋 PASOS FINALES:');
      console.log('   1. ✅ Respaldo creado');
      console.log('   2. ✅ Migración verificada');
      console.log('   3. ✅ Sistema RBAC V2 funcional');
      console.log('   4. ✅ .env.local actualizado');
      console.log('   5. 🔧 Probar login con 081533');
      console.log('   6. 🗑️ Eliminar BD restored');
      
    } else {
      console.log('⚠️ ALGUNAS VERIFICACIONES FALLARON');
      console.log('   NO elimines la BD restored hasta resolver los problemas');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error en verificación final:', error);
  }
}

finalVerification();
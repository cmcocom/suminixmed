#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoleDefaultVisibility() {
  try {
    console.log('🔍 Verificando tabla role_default_visibility...\n');

    // 1. Buscar el rol ADMINISTRADOR
    const adminRole = await prisma.rbac_roles.findFirst({
      where: { name: 'ADMINISTRADOR' }
    });

    if (!adminRole) {
      console.log('❌ No existe el rol ADMINISTRADOR');
      return;
    }

    console.log('✅ Rol ADMINISTRADOR ID:', adminRole.id);
    console.log('');

    // 2. Verificar registros en role_default_visibility
    const roleDefaults = await prisma.role_default_visibility.findMany({
      where: { role_id: adminRole.id },
      orderBy: { module_key: 'asc' }
    });

    console.log(`📊 Registros en role_default_visibility: ${roleDefaults.length}`);
    
    if (roleDefaults.length > 0) {
      const visible = roleDefaults.filter(r => r.visible);
      const hidden = roleDefaults.filter(r => !r.visible);
      
      console.log(`   ✓ Visibles: ${visible.length}`);
      console.log(`   ✗ Ocultos: ${hidden.length}`);
      console.log('');
      
      if (hidden.length > 0) {
        console.log('⚠️  Módulos OCULTOS en role_default_visibility:');
        hidden.forEach(mod => {
          console.log(`   ✗ ${mod.module_key}`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️  ¡NO hay registros en role_default_visibility para ADMINISTRADOR!');
      console.log('   Esto significa que el API está usando solo los defaults hardcodeados.');
      console.log('');
    }

    // 3. Verificar registros globales (role_id NULL, user_id NULL)
    const globals = await prisma.module_visibility.findMany({
      where: { 
        role_id: null,
        user_id: null 
      },
      orderBy: { module_key: 'asc' }
    });

    console.log(`📋 Configuraciones globales en module_visibility: ${globals.length}`);
    if (globals.length > 0) {
      const hidden = globals.filter(g => !g.visible);
      if (hidden.length > 0) {
        console.log('   ⚠️  Módulos ocultos globalmente:');
        hidden.forEach(mod => {
          console.log(`      ✗ ${mod.module_key}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoleDefaultVisibility();

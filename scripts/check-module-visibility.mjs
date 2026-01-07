#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModuleVisibility() {
  try {
    console.log('🔍 Verificando visibilidad de módulos para ADMINISTRADOR...\n');

    // 1. Buscar el rol ADMINISTRADOR
    const adminRole = await prisma.rbac_roles.findFirst({
      where: { name: 'ADMINISTRADOR' }
    });

    if (!adminRole) {
      console.log('❌ No existe el rol ADMINISTRADOR');
      return;
    }

    console.log('✅ Rol encontrado:', adminRole.name);
    console.log('   ID:', adminRole.id);
    console.log('   Activo:', adminRole.is_active);
    console.log('   Sistema:', adminRole.is_system_role);
    console.log('');

    // 2. Verificar opciones de menú visibles
    const visibleModules = await prisma.module_visibility.findMany({
      where: {
        role_id: adminRole.id,
        visible: true
      },
      orderBy: {
        module_key: 'asc'
      }
    });

    console.log(`📊 Módulos visibles: ${visibleModules.length}`);
    if (visibleModules.length > 0) {
      console.log('');
      visibleModules.forEach(mod => {
        console.log(`   ✓ ${mod.module_key}`);
      });
    } else {
      console.log('   ⚠️  ¡No hay módulos visibles asignados!');
    }
    console.log('');

    // 3. Verificar TODOS los registros de module_visibility para este rol
    const allModules = await prisma.module_visibility.findMany({
      where: {
        role_id: adminRole.id
      },
      orderBy: {
        module_key: 'asc'
      }
    });

    console.log(`📋 Total de registros en module_visibility: ${allModules.length}`);
    if (allModules.length > 0) {
      console.log('');
      const invisible = allModules.filter(m => !m.visible);
      if (invisible.length > 0) {
        console.log(`   ⚠️  Módulos ocultos (${invisible.length}):`);
        invisible.forEach(mod => {
          console.log(`      ✗ ${mod.module_key}`);
        });
      }
    }
    console.log('');

    // 4. Contar usuarios con este rol
    const usersCount = await prisma.rbac_user_roles.count({
      where: { role_id: adminRole.id }
    });

    console.log(`👥 Usuarios con rol ADMINISTRADOR: ${usersCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkModuleVisibility();

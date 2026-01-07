#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateVisibilityAPI() {
  try {
    console.log('🔍 Simulando carga de visibilidad desde API...\n');

    // Simular con uno de los usuarios ADMINISTRADOR
    const userId = 'b7edc461-1ac4-437c-8a26-2944079d6edc'; // MONSERRAT RAMIREZ SILVA
    
    console.log(`👤 Usuario de prueba: ${userId}\n`);

    // Defaults base (copiados del API)
    const defaultVisibility = {
      'DASHBOARD': true,
      'ENTRADAS': true,
      'SALIDAS': true,
      'SOLICITUDES': true,
      'SURTIDO': true,
      'PRODUCTOS': true,
      'STOCK_FIJO': true,
      'CATEGORIAS': true,
      'CLIENTES': true,
      'PROVEEDORES': true,
      'EMPLEADOS': true,
      'REPORTES': true,
      'REPORTES_INVENTARIO': true,
      'AJUSTES': true,
      'USUARIOS': true,
      'RBAC': true,
      'PERMISOS_INDICADORES': true,
      'GESTION_CATALOGOS': true,
      'GESTION_REPORTES': true,
      'ENTIDADES': true,
      'GESTION_INDICADORES': true,
      'SISTEMA': true
    };

    console.log('📋 Defaults base (hardcodeados):', Object.keys(defaultVisibility).length, 'módulos\n');

    // 1. Obtener roles del usuario
    const userRoleRecords = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      select: { role_id: true }
    });
    const userRoles = userRoleRecords.map(ur => ur.role_id);
    
    console.log('🎭 Roles del usuario:', userRoles, '\n');

    // 2. Cargar configuraciones globales (user_id null, role_id null)
    const globals = await prisma.module_visibility.findMany({ 
      where: { user_id: null, role_id: null } 
    });
    console.log('🌍 Configuraciones globales:', globals.length);
    globals.forEach((g) => { 
      defaultVisibility[g.module_key] = g.visible;
      console.log(`   ${g.module_key}: ${g.visible}`);
    });
    console.log('');

    // 3. Sobrescribir con configuraciones por defecto de roles (role_default_visibility)
    if (userRoles.length > 0) {
      const roleDefaults = await prisma.role_default_visibility.findMany({
        where: { role_id: { in: userRoles } }
      });
      console.log('📑 Configuraciones de role_default_visibility:', roleDefaults.length);
      roleDefaults.forEach((rd) => { 
        defaultVisibility[rd.module_key] = rd.visible;
        console.log(`   ${rd.module_key}: ${rd.visible}`);
      });
      console.log('');
    }

    // 4. Sobrescribir con configuraciones específicas del rol del usuario
    if (userRoles.length > 0) {
      const roleSpecific = await prisma.module_visibility.findMany({
        where: { 
          role_id: { in: userRoles },
          user_id: null // Solo del rol, no específicas del usuario
        }
      });
      console.log('🎭 Configuraciones específicas del rol:', roleSpecific.length);
      roleSpecific.forEach((r) => { 
        const before = defaultVisibility[r.module_key];
        defaultVisibility[r.module_key] = r.visible;
        console.log(`   ${r.module_key}: ${before} → ${r.visible}`);
      });
      console.log('');
    }

    // 5. Sobrescribir con configuraciones específicas del usuario
    const userSpecific = await prisma.module_visibility.findMany({ 
      where: { user_id: userId, role_id: null } 
    });
    console.log('👤 Configuraciones específicas del usuario:', userSpecific.length);
    userSpecific.forEach((u) => { 
      const before = defaultVisibility[u.module_key];
      defaultVisibility[u.module_key] = u.visible;
      console.log(`   ${u.module_key}: ${before} → ${u.visible}`);
    });
    console.log('');

    // Resultado final
    const visible = Object.entries(defaultVisibility).filter(([, v]) => v);
    const hidden = Object.entries(defaultVisibility).filter(([, v]) => !v);

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Total módulos: ${Object.keys(defaultVisibility).length}`);
    console.log(`   ✓ Visibles: ${visible.length}`);
    console.log(`   ✗ Ocultos: ${hidden.length}`);
    console.log('');
    
    if (hidden.length > 0) {
      console.log('⚠️  Módulos OCULTOS:');
      hidden.forEach(([key]) => console.log(`   ✗ ${key}`));
    }

    console.log('');
    console.log('✅ Módulos VISIBLES:');
    visible.forEach(([key]) => console.log(`   ✓ ${key}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulateVisibilityAPI();

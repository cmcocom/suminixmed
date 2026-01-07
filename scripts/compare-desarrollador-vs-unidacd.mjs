#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function compareRoles() {
  try {
    console.log('🔍 COMPARACIÓN DETALLADA: DESARROLLADOR vs UNIDADC');
    console.log('=' * 70);
    
    // 1. Obtener información básica de ambos roles
    console.log('\n1️⃣ INFORMACIÓN BÁSICA DE LOS ROLES:');
    
    const desarrolladorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'DESARROLLADOR' }
    });
    
    const unidacdRole = await prisma.rbac_roles.findUnique({
      where: { name: 'UNIDADC' }
    });
    
    console.log('👨‍💻 ROL DESARROLLADOR:');
    console.log(`   • ID: ${desarrolladorRole?.id}`);
    console.log(`   • Descripción: ${desarrolladorRole?.description}`);
    console.log(`   • Es rol de sistema: ${desarrolladorRole?.is_system_role ? 'SÍ' : 'NO'}`);
    console.log(`   • Creado por: ${desarrolladorRole?.created_by}`);
    
    console.log('\n🏢 ROL UNIDADC:');
    console.log(`   • ID: ${unidacdRole?.id}`);
    console.log(`   • Descripción: ${unidacdRole?.description}`);
    console.log(`   • Es rol de sistema: ${unidacdRole?.is_system_role ? 'SÍ' : 'NO'}`);
    console.log(`   • Creado por: ${unidacdRole?.created_by}`);
    
    if (!desarrolladorRole || !unidacdRole) {
      console.log('❌ No se pudieron encontrar ambos roles');
      return;
    }
    
    // 2. Comparar permisos
    console.log('\n2️⃣ COMPARACIÓN DE PERMISOS:');
    
    const desarrolladorPermisos = await prisma.rbac_role_permissions.findMany({
      where: { role_id: desarrolladorRole.id },
      include: { rbac_permissions: true }
    });
    
    const unidacdPermisos = await prisma.rbac_role_permissions.findMany({
      where: { role_id: unidacdRole.id },
      include: { rbac_permissions: true }
    });
    
    const totalPermisos = await prisma.rbac_permissions.count();
    
    console.log(`📊 ESTADÍSTICAS DE PERMISOS:`);
    console.log(`   • Total permisos sistema: ${totalPermisos}`);
    console.log(`   • DESARROLLADOR: ${desarrolladorPermisos.length} permisos`);
    console.log(`   • UNIDADC: ${unidacdPermisos.length} permisos`);
    
    const devGranted = desarrolladorPermisos.filter(p => p.granted).length;
    const unidacdGranted = unidacdPermisos.filter(p => p.granted).length;
    
    console.log(`\n✅ PERMISOS CONCEDIDOS (granted=true):`);
    console.log(`   • DESARROLLADOR: ${devGranted}/${desarrolladorPermisos.length} (${((devGranted / totalPermisos) * 100).toFixed(1)}%)`);
    console.log(`   • UNIDADC: ${unidacdGranted}/${unidacdPermisos.length} (${((unidacdGranted / totalPermisos) * 100).toFixed(1)}%)`);
    
    // 3. Identificar diferencias en permisos
    console.log('\n3️⃣ ANÁLISIS DE DIFERENCIAS:');
    
    const devPermisoIds = new Set(desarrolladorPermisos.map(p => p.permission_id));
    const unidacdPermisoIds = new Set(unidacdPermisos.map(p => p.permission_id));
    
    const soloDesarrollador = [...devPermisoIds].filter(id => !unidacdPermisoIds.has(id));
    const soloUNIDACDC = [...unidacdPermisoIds].filter(id => !devPermisoIds.has(id));
    const compartidos = [...devPermisoIds].filter(id => unidacdPermisoIds.has(id));
    
    console.log(`🔄 PERMISOS COMPARTIDOS: ${compartidos.length}`);
    console.log(`⚡ Solo DESARROLLADOR: ${soloDesarrollador.length}`);
    console.log(`🏢 Solo UNIDADC: ${soloUNIDACDC.length}`);
    
    if (soloDesarrollador.length > 0) {
      console.log('\n📋 PERMISOS EXCLUSIVOS DE DESARROLLADOR:');
      for (const permId of soloDesarrollador.slice(0, 5)) {
        const perm = await prisma.rbac_permissions.findUnique({
          where: { id: permId }
        });
        console.log(`   • ${perm?.name}`);
      }
      if (soloDesarrollador.length > 5) {
        console.log(`   ... y ${soloDesarrollador.length - 5} más`);
      }
    }
    
    if (soloUNIDACDC.length > 0) {
      console.log('\n📋 PERMISOS EXCLUSIVOS DE UNIDADC:');
      for (const permId of soloUNIDACDC.slice(0, 5)) {
        const perm = await prisma.rbac_permissions.findUnique({
          where: { id: permId }
        });
        console.log(`   • ${perm?.name}`);
      }
      if (soloUNIDACDC.length > 5) {
        console.log(`   ... y ${soloUNIDACDC.length - 5} más`);
      }
    }
    
    // 4. Comparar visibilidad en sidebar
    console.log('\n4️⃣ COMPARACIÓN DE VISIBILIDAD EN SIDEBAR:');
    
    const devVisibilidad = await prisma.rbac_module_visibility.findMany({
      where: { role_id: desarrolladorRole.id }
    });
    
    const unidacdVisibilidad = await prisma.rbac_module_visibility.findMany({
      where: { role_id: unidacdRole.id }
    });
    
    const devVisible = devVisibilidad.filter(v => v.is_visible).length;
    const unidacdVisible = unidacdVisibilidad.filter(v => v.is_visible).length;
    
    console.log(`👁️ MÓDULOS VISIBLES:`);
    console.log(`   • DESARROLLADOR: ${devVisible}/${devVisibilidad.length} módulos`);
    console.log(`   • UNIDADC: ${unidacdVisible}/${unidacdVisibilidad.length} módulos`);
    
    // Identificar diferencias en visibilidad
    const devModulosVisibles = new Set(
      devVisibilidad.filter(v => v.is_visible).map(v => v.module_key)
    );
    const unidacdModulosVisibles = new Set(
      unidacdVisibilidad.filter(v => v.is_visible).map(v => v.module_key)
    );
    
    const modulosSoloDev = [...devModulosVisibles].filter(m => !unidacdModulosVisibles.has(m));
    const modulosSoloUnidacd = [...unidacdModulosVisibles].filter(m => !devModulosVisibles.has(m));
    const modulosCompartidos = [...devModulosVisibles].filter(m => unidacdModulosVisibles.has(m));
    
    console.log(`\n🔄 Módulos compartidos: ${modulosCompartidos.length}`);
    console.log(`⚡ Solo DESARROLLADOR: ${modulosSoloDev.length}`);
    console.log(`🏢 Solo UNIDADC: ${modulosSoloUnidacd.length}`);
    
    if (modulosSoloDev.length > 0) {
      console.log(`\n📋 MÓDULOS SOLO VISIBLES PARA DESARROLLADOR:`);
      modulosSoloDev.forEach(m => console.log(`   • ${m}`));
    }
    
    if (modulosSoloUnidacd.length > 0) {
      console.log(`\n📋 MÓDULOS SOLO VISIBLES PARA UNIDADC:`);
      modulosSoloUnidacd.forEach(m => console.log(`   • ${m}`));
    }
    
    // 5. Verificar usuarios asignados
    console.log('\n5️⃣ USUARIOS ASIGNADOS:');
    
    const devUsers = await prisma.rbac_user_roles.findMany({
      where: { role_id: desarrolladorRole.id },
      include: { user: true }
    });
    
    const unidacdUsers = await prisma.rbac_user_roles.findMany({
      where: { role_id: unidacdRole.id },
      include: { user: true }
    });
    
    console.log(`👥 DESARROLLADOR (${devUsers.length} usuarios):`);
    devUsers.forEach(ur => {
      console.log(`   • ${ur.user.clave} (${ur.user.name}) - Activo: ${ur.user.activo}`);
    });
    
    console.log(`\n👥 UNIDADC (${unidacdUsers.length} usuarios):`);
    unidacdUsers.forEach(ur => {
      console.log(`   • ${ur.user.clave} (${ur.user.name}) - Activo: ${ur.user.activo}`);
    });
    
    // 6. CONCLUSIÓN
    console.log('\n🎯 CONCLUSIÓN:');
    
    const mismosPermisos = devGranted === unidacdGranted && devGranted === totalPermisos;
    const mismaVisibilidad = devVisible === unidacdVisible && devVisible === devVisibilidad.length;
    const ambosRolSistema = desarrolladorRole.is_system_role && unidacdRole.is_system_role;
    
    if (mismosPermisos && mismaVisibilidad && ambosRolSistema) {
      console.log('✅ SÍ - DESARROLLADOR y UNIDADC tienen EXACTAMENTE los mismos privilegios:');
      console.log('   • 100% de permisos granted=true');
      console.log('   • 100% de módulos visibles');
      console.log('   • Ambos son roles de sistema');
      console.log('   • Acceso completo idéntico');
    } else {
      console.log('⚠️ NO - Hay diferencias entre DESARROLLADOR y UNIDADC:');
      if (!mismosPermisos) {
        console.log(`   • Permisos diferentes: DEV(${devGranted}) vs UNIDADC(${unidacdGranted})`);
      }
      if (!mismaVisibilidad) {
        console.log(`   • Visibilidad diferente: DEV(${devVisible}) vs UNIDADC(${unidacdVisible})`);
      }
      if (!ambosRolSistema) {
        console.log(`   • Tipo de rol: DEV(${desarrolladorRole.is_system_role}) vs UNIDADC(${unidacdRole.is_system_role})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en comparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareRoles();
#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO DEL ROL ADMINISTRADOR\n');
  console.log('=' .repeat(80));

  try {
    // 1. BUSCAR ROL ADMINISTRADOR
    const rolAdmin = await prisma.rbac_roles.findUnique({
      where: { id: 'role_administrador' }
    });

    if (!rolAdmin) {
      console.log('❌ Rol ADMINISTRADOR no encontrado');
      return;
    }

    console.log(`📋 ROL: ${rolAdmin.name}`);
    console.log(`   ID: ${rolAdmin.id}\n`);

    // 2. OBTENER TODOS LOS PERMISOS DEL ROL
    const permisosAdmin = await prisma.rbac_role_permissions.findMany({
      where: { role_id: rolAdmin.id },
      include: {
        rbac_permissions: true
      }
    });

    console.log(`📊 Total de permisos actuales: ${permisosAdmin.length}`);

    // 3. OBTENER TODOS LOS PERMISOS DEL SISTEMA
    const todosLosPermisos = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      orderBy: { module: 'asc' }
    });

    console.log(`📊 Total de permisos en el sistema: ${todosLosPermisos.length}\n`);

    // 4. MÓDULOS RESTRINGIDOS (los que NO debe tener)
    const modulosRestringidos = [
      'RBAC',
      'AUDITORIA',
      'INDICADORES',
      'PERMISOS_INDICADORES',
      'CATALOGOS',
      'REPORTES',
      'ENTIDADES'
    ];

    // 5. AGRUPAR PERMISOS QUE TIENE
    const permisosPorModulo = {};
    for (const rp of permisosAdmin) {
      const modulo = rp.rbac_permissions.module;
      if (!permisosPorModulo[modulo]) {
        permisosPorModulo[modulo] = 0;
      }
      permisosPorModulo[modulo]++;
    }

    // 6. AGRUPAR TODOS LOS PERMISOS DEL SISTEMA
    const todosPermisosPorModulo = {};
    for (const p of todosLosPermisos) {
      if (!todosPermisosPorModulo[p.module]) {
        todosPermisosPorModulo[p.module] = 0;
      }
      todosPermisosPorModulo[p.module]++;
    }

    // 7. VERIFICAR MÓDULOS RESTRINGIDOS
    console.log('🚫 VERIFICACIÓN DE MÓDULOS RESTRINGIDOS:');
    console.log('   (Estos NO deben tener permisos)\n');
    
    for (const modulo of modulosRestringidos) {
      const tiene = permisosPorModulo[modulo] || 0;
      const disponibles = todosPermisosPorModulo[modulo] || 0;
      
      if (tiene > 0) {
        console.log(`   ⚠️  ${modulo}: ${tiene}/${disponibles} permisos - DEBE SER 0`);
      } else {
        console.log(`   ✅ ${modulo}: 0/${disponibles} permisos - Correcto`);
      }
    }

    // 8. VERIFICAR MÓDULOS QUE DEBE TENER
    console.log('\n\n✅ VERIFICACIÓN DE MÓDULOS PERMITIDOS:');
    console.log('   (Estos DEBEN tener todos los permisos)\n');

    const modulosActuales = Object.keys(permisosPorModulo).sort();
    const todosLosModulos = Object.keys(todosPermisosPorModulo).sort();
    
    let modulosFaltantes = [];
    let modulosIncompletos = [];

    for (const modulo of todosLosModulos) {
      // Saltar módulos restringidos
      if (modulosRestringidos.includes(modulo)) {
        continue;
      }

      const tiene = permisosPorModulo[modulo] || 0;
      const total = todosPermisosPorModulo[modulo];

      if (tiene === 0) {
        modulosFaltantes.push({ modulo, total });
        console.log(`   ❌ ${modulo}: 0/${total} permisos - FALTA COMPLETAMENTE`);
      } else if (tiene < total) {
        modulosIncompletos.push({ modulo, tiene, total });
        console.log(`   ⚠️  ${modulo}: ${tiene}/${total} permisos - INCOMPLETO`);
      } else {
        console.log(`   ✅ ${modulo}: ${tiene}/${total} permisos - Completo`);
      }
    }

    // 9. CALCULAR PERMISOS FALTANTES
    console.log('\n\n📊 RESUMEN DE PERMISOS FALTANTES:');
    
    let totalFaltantes = 0;
    for (const modulo of todosLosModulos) {
      if (modulosRestringidos.includes(modulo)) {
        continue;
      }
      const tiene = permisosPorModulo[modulo] || 0;
      const total = todosPermisosPorModulo[modulo];
      totalFaltantes += (total - tiene);
    }

    console.log(`\n   Total de permisos que DEBERÍA tener: ${todosLosPermisos.length - modulosRestringidos.reduce((sum, m) => sum + (todosPermisosPorModulo[m] || 0), 0)}`);
    console.log(`   Total de permisos que TIENE actualmente: ${permisosAdmin.length}`);
    console.log(`   Permisos FALTANTES: ${totalFaltantes}\n`);

    // 10. LISTAR PERMISOS FALTANTES POR MÓDULO
    if (modulosFaltantes.length > 0 || modulosIncompletos.length > 0) {
      console.log('\n⚠️  MÓDULOS CON PROBLEMAS:\n');
      
      if (modulosFaltantes.length > 0) {
        console.log('   Módulos sin permisos (falta agregar completamente):');
        for (const m of modulosFaltantes) {
          console.log(`     ❌ ${m.modulo} (${m.total} permisos)`);
        }
      }

      if (modulosIncompletos.length > 0) {
        console.log('\n   Módulos con permisos incompletos:');
        for (const m of modulosIncompletos) {
          console.log(`     ⚠️  ${m.modulo} (${m.tiene}/${m.total} permisos)`);
          
          // Mostrar qué permisos faltan
          const permisosModulo = todosLosPermisos.filter(p => p.module === m.modulo);
          const permisosTiene = permisosAdmin.filter(pa => pa.rbac_permissions.module === m.modulo);
          const accionesTiene = new Set(permisosTiene.map(p => p.rbac_permissions.action));
          
          const faltantes = permisosModulo.filter(p => !accionesTiene.has(p.action));
          if (faltantes.length > 0) {
            console.log(`        Faltan:`);
            for (const f of faltantes) {
              console.log(`          - ${f.action}: ${f.name}`);
            }
          }
        }
      }
    }

    // 11. VERIFICAR VISIBILIDAD DE MÓDULOS
    console.log('\n\n👁️  VERIFICACIÓN DE VISIBILIDAD DE MÓDULOS:\n');
    
    const visibilidad = await prisma.module_visibility.findMany({
      where: { role_id: rolAdmin.id }
    });

    console.log(`   Registros de visibilidad encontrados: ${visibilidad.length}`);
    
    if (visibilidad.length > 0) {
      console.log('\n   Módulos con visibilidad configurada:');
      for (const v of visibilidad) {
        console.log(`     ${v.visible ? '👁️ ' : '🚫'} ${v.module_key} - ${v.visible ? 'Visible' : 'Oculto'}`);
      }
    }

    console.log('\n' + '=' .repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

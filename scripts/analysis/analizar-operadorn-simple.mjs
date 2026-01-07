#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 ANÁLISIS COMPLETO DEL ROL OPERADORN\n');
  console.log('=' .repeat(80));

  try {
    // 1. BUSCAR ROL OPERADORN
    const rolOperadorn = await prisma.rbac_roles.findFirst({
      where: {
        name: 'OPERADORN'
      }
    });

    if (!rolOperadorn) {
      console.log('❌ Rol OPERADORN no encontrado');
      return;
    }

    console.log(`📋 ROL: ${rolOperadorn.name}`);
    console.log(`   ID: ${rolOperadorn.id}`);

    // 2. OBTENER TODOS LOS PERMISOS DEL ROL
    const permisos = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: rolOperadorn.id
      },
      include: {
        rbac_permissions: true
      }
    });

    console.log(`   Total permisos: ${permisos.length}\n`);

    // 3. AGRUPAR POR MÓDULO
    const permisosPorModulo = {};
    for (const rp of permisos) {
      const modulo = rp.rbac_permissions.module;
      if (!permisosPorModulo[modulo]) {
        permisosPorModulo[modulo] = [];
      }
      permisosPorModulo[modulo].push(rp.rbac_permissions);
    }

    // 4. MÓDULOS DE CATÁLOGOS
    const modulosCatalogos = [
      'PRODUCTOS',
      'CLIENTES',
      'PROVEEDORES',
      'CATEGORIAS',
      'ALMACENES',
      'UBICACIONES',
      'GESTION_CATALOGOS'
    ];

    console.log('📊 PERMISOS ACTUALES DE CATÁLOGOS:');
    for (const modulo of modulosCatalogos) {
      if (permisosPorModulo[modulo]) {
        console.log(`\n   ✅ ${modulo} (${permisosPorModulo[modulo].length} permisos):`);
        for (const p of permisosPorModulo[modulo]) {
          console.log(`      - ${p.action}: ${p.name}`);
        }
      } else {
        console.log(`\n   ❌ ${modulo} - SIN PERMISOS`);
      }
    }

    // 5. VERIFICAR PERMISOS DISPONIBLES
    console.log('\n\n📋 PERMISOS DISPONIBLES EN EL SISTEMA:');
    for (const modulo of modulosCatalogos) {
      const disponibles = await prisma.rbac_permissions.findMany({
        where: {
          module: modulo,
          is_active: true
        },
        orderBy: {
          action: 'asc'
        }
      });

      if (disponibles.length > 0) {
        console.log(`\n   📦 ${modulo}:`);
        for (const p of disponibles) {
          const tiene = permisosPorModulo[modulo]?.some(pm => pm.action === p.action);
          console.log(`      ${tiene ? '✅' : '❌'} ${p.action}: ${p.name}`);
        }
      }
    }

    // 6. IDENTIFICAR FALTANTES
    console.log('\n\n⚠️  RESUMEN DE PERMISOS FALTANTES:');
    let totalFaltantes = 0;

    for (const modulo of modulosCatalogos) {
      const disponibles = await prisma.rbac_permissions.findMany({
        where: {
          module: modulo,
          is_active: true
        }
      });

      const tiene = permisosPorModulo[modulo] || [];
      const faltantes = disponibles.filter(d => 
        !tiene.some(t => t.action === d.action)
      );

      if (faltantes.length > 0) {
        totalFaltantes += faltantes.length;
        console.log(`\n   ❌ ${modulo} - Faltan ${faltantes.length} permisos:`);
        for (const f of faltantes) {
          console.log(`      - ${f.action}: ${f.name}`);
        }
      }
    }

    if (totalFaltantes === 0) {
      console.log('\n   ✅ El rol OPERADORN tiene TODOS los permisos de catálogos');
    } else {
      console.log(`\n   ⚠️  TOTAL DE PERMISOS FALTANTES: ${totalFaltantes}`);
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

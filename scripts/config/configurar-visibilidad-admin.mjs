#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 CONFIGURAR VISIBILIDAD DEL ROL ADMINISTRADOR\n');
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

    console.log(`✅ Rol ADMINISTRADOR encontrado: ${rolAdmin.id}\n`);

    // 2. MÓDULOS QUE DEBEN ESTAR OCULTOS
    const modulosOcultos = [
      'RBAC',
      'AUDITORIA',
      'INDICADORES',
      'PERMISOS_INDICADORES',
      'CATALOGOS',
      'REPORTES',
      'ENTIDADES'
    ];

    console.log('🚫 Módulos a OCULTAR para ADMINISTRADOR:');
    modulosOcultos.forEach(m => console.log(`   - ${m}`));

    // 3. OBTENER TODOS LOS MÓDULOS ÚNICOS DEL SISTEMA
    const todosLosModulos = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      select: { module: true },
      distinct: ['module']
    });

    const modulosDelSistema = todosLosModulos.map(m => m.module);
    console.log(`\n📊 Total de módulos en el sistema: ${modulosDelSistema.length}`);

    // 4. MÓDULOS QUE DEBEN ESTAR VISIBLES (todos menos los 7 restringidos)
    const modulosVisibles = modulosDelSistema.filter(m => !modulosOcultos.includes(m));
    console.log(`📊 Módulos que deben ser visibles: ${modulosVisibles.length}\n`);

    // 5. ELIMINAR CONFIGURACIÓN EXISTENTE
    console.log('🗑️  Eliminando configuración de visibilidad anterior...');
    const deleted = await prisma.module_visibility.deleteMany({
      where: {
        role_id: rolAdmin.id,
        user_id: null
      }
    });
    console.log(`   ✅ ${deleted.count} registros eliminados\n`);

    // 6. CREAR REGISTROS DE VISIBILIDAD
    console.log('📝 Creando nueva configuración de visibilidad...\n');

    let creados = 0;

    // Ocultar los 7 módulos restringidos
    for (const modulo of modulosOcultos) {
      await prisma.module_visibility.create({
        data: {
          id: `mv_${randomBytes(8).toString('hex')}`,
          role_id: rolAdmin.id,
          user_id: null,
          module_key: modulo,
          visible: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`   🚫 ${modulo} - OCULTO`);
      creados++;
    }

    // Hacer visibles todos los demás módulos
    for (const modulo of modulosVisibles) {
      await prisma.module_visibility.create({
        data: {
          id: `mv_${randomBytes(8).toString('hex')}`,
          role_id: rolAdmin.id,
          user_id: null,
          module_key: modulo,
          visible: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`   ✅ ${modulo} - VISIBLE`);
      creados++;
    }

    console.log(`\n✅ ${creados} registros de visibilidad creados\n`);

    // 7. VERIFICAR CONFIGURACIÓN FINAL
    console.log('📊 VERIFICACIÓN FINAL:\n');

    const visibilidadFinal = await prisma.module_visibility.findMany({
      where: {
        role_id: rolAdmin.id,
        user_id: null
      },
      orderBy: { module_key: 'asc' }
    });

    console.log(`   Total de registros: ${visibilidadFinal.length}`);

    const ocultos = visibilidadFinal.filter(v => !v.visible);
    const visibles = visibilidadFinal.filter(v => v.visible);

    console.log(`\n   🚫 Módulos OCULTOS (${ocultos.length}):`);
    ocultos.forEach(v => console.log(`      - ${v.module_key}`));

    console.log(`\n   ✅ Módulos VISIBLES (${visibles.length}):`);
    visibles.forEach(v => console.log(`      - ${v.module_key}`));

    // 8. VERIFICAR QUE LOS 7 RESTRINGIDOS ESTÉN OCULTOS
    console.log('\n\n🔍 VERIFICACIÓN DE MÓDULOS RESTRINGIDOS:\n');
    
    let todosOcultos = true;
    for (const modulo of modulosOcultos) {
      const config = visibilidadFinal.find(v => v.module_key === modulo);
      if (config && !config.visible) {
        console.log(`   ✅ ${modulo} - Correctamente oculto`);
      } else {
        console.log(`   ❌ ${modulo} - ERROR: No está oculto`);
        todosOcultos = false;
      }
    }

    if (todosOcultos) {
      console.log('\n✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
      console.log('\n💡 El rol ADMINISTRADOR ahora:');
      console.log('   ✅ Tiene acceso al 100% de permisos (excepto los 7 restringidos)');
      console.log('   ✅ NO verá los 7 módulos restringidos en el menú');
      console.log('   ✅ Verá todos los demás módulos del sistema');
    } else {
      console.log('\n⚠️  ADVERTENCIA: Algunos módulos no están correctamente configurados');
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

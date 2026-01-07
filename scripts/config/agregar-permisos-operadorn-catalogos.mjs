#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 AGREGAR PERMISOS FALTANTES AL ROL OPERADORN\n');
  console.log('=' .repeat(80));

  try {
    // 1. BUSCAR ROL OPERADORN
    const rolOperadorn = await prisma.rbac_roles.findFirst({
      where: { name: 'OPERADORN' }
    });

    if (!rolOperadorn) {
      console.log('❌ Rol OPERADORN no encontrado');
      return;
    }

    console.log(`✅ Rol OPERADORN encontrado: ${rolOperadorn.id}\n`);

    // 2. MÓDULOS A AGREGAR COMPLETOS
    const modulosAAgregar = [
      'PROVEEDORES',
      'CATEGORIAS',
      'ALMACENES',
      'UBICACIONES',
      'GESTION_CATALOGOS'
    ];

    console.log('📋 Módulos a agregar permisos completos:');
    modulosAAgregar.forEach(m => console.log(`   - ${m}`));

    // 3. OBTENER TODOS LOS PERMISOS DE ESOS MÓDULOS
    const permisosAAgregar = await prisma.rbac_permissions.findMany({
      where: {
        module: {
          in: modulosAAgregar
        },
        is_active: true
      }
    });

    console.log(`\n   Total permisos a agregar: ${permisosAAgregar.length}`);

    // 4. AGREGAR PERMISOS FALTANTES DE PRODUCTOS Y CLIENTES (ELIMINAR)
    const permisoEliminarProductos = await prisma.rbac_permissions.findFirst({
      where: {
        module: 'PRODUCTOS',
        action: 'ELIMINAR',
        is_active: true
      }
    });

    const permisoEliminarClientes = await prisma.rbac_permissions.findFirst({
      where: {
        module: 'CLIENTES',
        action: 'ELIMINAR',
        is_active: true
      }
    });

    if (permisoEliminarProductos) {
      permisosAAgregar.push(permisoEliminarProductos);
    }

    if (permisoEliminarClientes) {
      permisosAAgregar.push(permisoEliminarClientes);
    }

    console.log(`\n   Total con ELIMINAR de PRODUCTOS y CLIENTES: ${permisosAAgregar.length}`);

    // 5. VERIFICAR QUÉ PERMISOS YA TIENE
    const permisosActuales = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: rolOperadorn.id
      },
      select: {
        permission_id: true
      }
    });

    const permisosActualesIds = new Set(permisosActuales.map(p => p.permission_id));

    // 6. FILTRAR SOLO LOS QUE NO TIENE
    const permisosNuevos = permisosAAgregar.filter(p => !permisosActualesIds.has(p.id));

    console.log(`\n   Permisos nuevos a insertar: ${permisosNuevos.length}`);

    if (permisosNuevos.length === 0) {
      console.log('\n   ℹ️  El rol ya tiene todos los permisos');
      return;
    }

    // 7. INSERTAR LOS PERMISOS NUEVOS
    console.log('\n📝 Insertando permisos...');
    
    const permisosInsertados = [];
    for (const permiso of permisosNuevos) {
      const rolePermission = await prisma.rbac_role_permissions.create({
        data: {
          id: `rp_${randomBytes(16).toString('hex')}`,
          role_id: rolOperadorn.id,
          permission_id: permiso.id,
          granted: true,
          granted_by: 'system',
          granted_at: new Date()
        }
      });
      permisosInsertados.push(permiso);
      console.log(`   ✅ ${permiso.module} - ${permiso.action}: ${permiso.name}`);
    }

    console.log(`\n✅ ${permisosInsertados.length} permisos agregados exitosamente`);

    // 8. VERIFICAR ESTADO FINAL
    console.log('\n📊 VERIFICACIÓN FINAL:');
    
    const permisosFinales = await prisma.rbac_role_permissions.count({
      where: { role_id: rolOperadorn.id }
    });

    console.log(`   Total de permisos del rol OPERADORN: ${permisosFinales}`);

    // Verificar por módulo
    const modulosVerificar = [
      'PRODUCTOS',
      'CLIENTES',
      'PROVEEDORES',
      'CATEGORIAS',
      'ALMACENES',
      'UBICACIONES',
      'GESTION_CATALOGOS'
    ];

    console.log('\n   Permisos por módulo de catálogos:');
    for (const modulo of modulosVerificar) {
      const count = await prisma.rbac_role_permissions.count({
        where: {
          role_id: rolOperadorn.id,
          rbac_permissions: {
            module: modulo
          }
        }
      });
      console.log(`     ${count > 0 ? '✅' : '❌'} ${modulo}: ${count} permisos`);
    }

    console.log('\n✅ OPERACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

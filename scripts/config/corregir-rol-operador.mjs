#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 CORRECCIÓN DEL ROL OPERADOR\n');
  console.log('=' .repeat(80));

  try {
    // 1. ENCONTRAR EL ROL OPERADOR
    const rolOperador = await prisma.rbac_roles.findUnique({
      where: { id: 'role_operador' }
    });

    if (!rolOperador) {
      console.log('❌ Rol OPERADOR no encontrado');
      return;
    }

    console.log('✅ Rol OPERADOR encontrado');

    // 2. MÓDULOS A REMOVER
    const modulosARemover = [
      'CLIENTES',
      'INVENTARIO',
      'PRODUCTOS'
    ];

    console.log('\n📋 Módulos a remover del rol OPERADOR:');
    modulosARemover.forEach(mod => console.log(`   - ${mod}`));

    // 3. OBTENER PERMISOS A REMOVER
    const permisosARemover = await prisma.rbac_permissions.findMany({
      where: {
        module: {
          in: modulosARemover
        }
      },
      select: {
        id: true,
        name: true,
        module: true
      }
    });

    console.log(`\n   Total de permisos a remover: ${permisosARemover.length}`);
    for (const permiso of permisosARemover) {
      console.log(`   - ${permiso.module}: ${permiso.name}`);
    }

    // 4. ELIMINAR LOS PERMISOS
    const deleteResult = await prisma.rbac_role_permissions.deleteMany({
      where: {
        role_id: rolOperador.id,
        permission_id: {
          in: permisosARemover.map(p => p.id)
        }
      }
    });

    console.log(`\n✅ ${deleteResult.count} permisos removidos del rol OPERADOR`);

    // 5. VERIFICAR ESTADO FINAL
    console.log('\n📋 Verificando estado final...');
    
    const permisosFinales = await prisma.rbac_role_permissions.findMany({
      where: { role_id: rolOperador.id },
      include: {
        rbac_permissions: {
          select: {
            module: true,
            name: true
          }
        }
      }
    });

    const modulosFinales = {};
    for (const rp of permisosFinales) {
      const modulo = rp.rbac_permissions.module;
      if (!modulosFinales[modulo]) {
        modulosFinales[modulo] = 0;
      }
      modulosFinales[modulo]++;
    }

    console.log('\n🎭 ROL OPERADOR - ESTADO FINAL:');
    console.log(`   Total de permisos: ${permisosFinales.length}`);
    console.log('\n   Módulos con acceso:');
    
    const modulosOrdenados = Object.keys(modulosFinales).sort();
    for (const modulo of modulosOrdenados) {
      console.log(`     ✅ ${modulo} (${modulosFinales[modulo]} permisos)`);
    }

    console.log('\n   Módulos SIN acceso (correctamente restringidos):');
    for (const modulo of modulosARemover) {
      if (!modulosFinales[modulo]) {
        console.log(`     ❌ ${modulo} - Correctamente removido`);
      } else {
        console.log(`     ⚠️  ${modulo} - TODAVÍA TIENE ACCESO`);
      }
    }

    // 6. VERIFICAR USUARIOS AFECTADOS
    const usuariosAfectados = await prisma.rbac_user_roles.findMany({
      where: { role_id: rolOperador.id },
      include: {
        User: {
          select: {
            name: true,
            clave: true
          }
        }
      }
    });

    console.log(`\n👥 Usuarios afectados por este cambio: ${usuariosAfectados.length}`);
    for (const userRole of usuariosAfectados) {
      console.log(`   - ${userRole.User.name} (${userRole.User.clave})`);
    }

    console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

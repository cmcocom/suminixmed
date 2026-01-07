import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function modificarSistemaRBAC() {
  console.log('\n🔧 MODIFICACIÓN COMPLETA DEL SISTEMA RBAC');
  console.log('='.repeat(80));
  console.log('');

  const adminUserId = 'e73697a9-1476-4e94-883b-5ebd9a8e7fb3'; // Usuario sistema para operaciones

  try {
    // PASO 1: Eliminar rol DESARROLLADOR
    console.log('1️⃣ ELIMINANDO ROL DESARROLLADOR...\n');
    
    const desarrolladorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'DESARROLLADOR' }
    });

    if (desarrolladorRole) {
      await prisma.rbac_roles.delete({
        where: { id: desarrolladorRole.id }
      });
      console.log('   ✅ Rol DESARROLLADOR eliminado');
    } else {
      console.log('   ⚠️ Rol DESARROLLADOR no encontrado');
    }

    // PASO 2: Eliminar rol CONSULTA
    console.log('\n2️⃣ ELIMINANDO ROL CONSULTA...\n');
    
    const consultaRole = await prisma.rbac_roles.findUnique({
      where: { name: 'CONSULTA' }
    });

    if (consultaRole) {
      await prisma.rbac_roles.delete({
        where: { id: consultaRole.id }
      });
      console.log('   ✅ Rol CONSULTA eliminado');
    } else {
      console.log('   ⚠️ Rol CONSULTA no encontrado');
    }

    // PASO 3: Crear rol OPERADORN
    console.log('\n3️⃣ CREANDO ROL OPERADORN...\n');
    
    // Módulos para OPERADORN: REPORTES, ENTRADAS, SALIDAS
    const operadornModules = [
      'REPORTES',
      'REPORTES_INVENTARIO',
      'ENTRADAS',
      'SALIDAS',
      'INVENTARIO',
      'PRODUCTOS',
      'CLIENTES',
      'PERFIL_PROPIO'
    ];

    // Acciones que puede realizar
    const operadornActions = ['LEER', 'CREAR', 'EDITAR', 'EXPORTAR'];

    const operadornPermissions = await prisma.rbac_permissions.findMany({
      where: {
        OR: [
          {
            module: { in: operadornModules },
            action: { in: operadornActions }
          },
          {
            module: 'PERFIL_PROPIO' // Todos los permisos de perfil
          }
        ]
      }
    });

    const operadornRole = await prisma.rbac_roles.create({
      data: {
        id: randomUUID(),
        name: 'OPERADORN',
        description: 'Operador con acceso a reportes, entradas y salidas de inventario',
        is_active: true,
        is_system_role: false,
        created_by: adminUserId,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`   ✅ Rol OPERADORN creado (ID: ${operadornRole.id})`);

    // Asignar permisos a OPERADORN
    for (const perm of operadornPermissions) {
      await prisma.rbac_role_permissions.create({
        data: {
          id: randomUUID(),
          role_id: operadornRole.id,
          permission_id: perm.id,
          granted: true,
          granted_by: adminUserId,
          granted_at: new Date()
        }
      });
    }

    console.log(`   ✅ ${operadornPermissions.length} permisos asignados a OPERADORN`);

    // PASO 4: Modificar rol OPERADOR
    console.log('\n4️⃣ MODIFICANDO ROL OPERADOR...\n');
    
    const operadorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'OPERADOR' }
    });

    if (!operadorRole) {
      throw new Error('Rol OPERADOR no encontrado');
    }

    // Eliminar todos los permisos actuales del OPERADOR
    await prisma.rbac_role_permissions.deleteMany({
      where: { role_id: operadorRole.id }
    });

    console.log('   ✅ Permisos antiguos eliminados');

    // Módulos para OPERADOR: REPORTES, SALIDAS (sin ENTRADAS)
    const operadorModules = [
      'REPORTES',
      'REPORTES_INVENTARIO',
      'SALIDAS',
      'INVENTARIO',
      'PRODUCTOS',
      'CLIENTES',
      'PERFIL_PROPIO'
    ];

    // Acciones que puede realizar (solo LEER y EXPORTAR, sin crear/editar)
    const operadorActions = ['LEER', 'EXPORTAR'];

    const operadorPermissions = await prisma.rbac_permissions.findMany({
      where: {
        OR: [
          {
            module: { in: operadorModules },
            action: { in: operadorActions }
          },
          {
            module: 'PERFIL_PROPIO' // Todos los permisos de perfil
          },
          {
            module: 'SALIDAS',
            action: 'CREAR' // Puede crear salidas
          }
        ]
      }
    });

    for (const perm of operadorPermissions) {
      await prisma.rbac_role_permissions.create({
        data: {
          id: randomUUID(),
          role_id: operadorRole.id,
          permission_id: perm.id,
          granted: true,
          granted_by: adminUserId,
          granted_at: new Date()
        }
      });
    }

    console.log(`   ✅ ${operadorPermissions.length} permisos asignados a OPERADOR`);
    console.log('   📋 Permisos: LEER y EXPORTAR en reportes/salidas, CREAR salidas');

    // PASO 5: Asignar 100% de permisos a SUPERVISOR
    console.log('\n5️⃣ MODIFICANDO ROL SUPERVISOR (100% permisos)...\n');
    
    const supervisorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'SUPERVISOR' }
    });

    if (!supervisorRole) {
      throw new Error('Rol SUPERVISOR no encontrado');
    }

    // Eliminar permisos actuales
    await prisma.rbac_role_permissions.deleteMany({
      where: { role_id: supervisorRole.id }
    });

    console.log('   ✅ Permisos antiguos eliminados');

    // Obtener TODOS los permisos
    const allPermissions = await prisma.rbac_permissions.findMany({
      where: { is_active: true }
    });

    for (const perm of allPermissions) {
      await prisma.rbac_role_permissions.create({
        data: {
          id: randomUUID(),
          role_id: supervisorRole.id,
          permission_id: perm.id,
          granted: true,
          granted_by: adminUserId,
          granted_at: new Date()
        }
      });
    }

    console.log(`   ✅ ${allPermissions.length} permisos asignados a SUPERVISOR (100%)`);

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ MODIFICACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('='.repeat(80));
    console.log('');

    // Verificar roles finales
    const finalRoles = await prisma.rbac_roles.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: {
            rbac_role_permissions: true,
            rbac_user_roles: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('📊 ROLES FINALES EN EL SISTEMA:\n');

    for (const role of finalRoles) {
      const percentage = ((role._count.rbac_role_permissions / allPermissions.length) * 100).toFixed(1);
      console.log(`🎭 ${role.name}`);
      console.log(`   Tipo: ${role.is_system_role ? 'Sistema' : 'Personalizado'}`);
      console.log(`   Permisos: ${role._count.rbac_role_permissions} (${percentage}%)`);
      console.log(`   Usuarios: ${role._count.rbac_user_roles}`);
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('');
    console.log('✅ Cambios aplicados:');
    console.log('   ✅ Rol DESARROLLADOR eliminado');
    console.log('   ✅ Rol CONSULTA eliminado');
    console.log('   ✅ Rol OPERADORN creado con permisos para reportes, entradas y salidas');
    console.log('   ✅ Rol OPERADOR modificado (solo reportes y salidas, sin entradas)');
    console.log('   ✅ Rol SUPERVISOR con 100% de permisos');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA MODIFICACIÓN:', error);
    console.error('\n⚠️ REVERTIR CAMBIOS USANDO EL RESPALDO CREADO');
    throw error;
  }
}

// Ejecutar
modificarSistemaRBAC()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

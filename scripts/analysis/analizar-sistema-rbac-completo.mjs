import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 ANÁLISIS COMPLETO DEL SISTEMA RBAC\n');
  console.log('='.repeat(80));

  // 1. Analizar todos los permisos únicos en el sistema
  console.log('\n1️⃣ PERMISOS ÚNICOS EN EL SISTEMA:\n');
  
  const allPermissions = await prisma.rbac_permissions.findMany({
    select: {
      id: true,
      module: true,
      action: true,
      name: true
    }
  });

  // Obtener combinaciones únicas
  const uniquePerms = new Set();
  const permissionsByModule = new Map();

  allPermissions.forEach(perm => {
    const key = `${perm.module}:${perm.action}`;
    uniquePerms.add(key);
    
    if (!permissionsByModule.has(perm.module)) {
      permissionsByModule.set(perm.module, new Set());
    }
    permissionsByModule.get(perm.module).add(perm.action);
  });

  console.log(`Total de combinaciones módulo-acción únicas: ${allPermissions.length}\n`);

  // Ordenar módulos alfabéticamente
  const sortedModules = Array.from(permissionsByModule.keys()).sort();
  
  let totalUniquePermissions = 0;
  sortedModules.forEach(moduleName => {
    const actions = Array.from(permissionsByModule.get(moduleName)).sort();
    totalUniquePermissions += actions.length;
    console.log(`📌 ${moduleName}: ${actions.length} acciones`);
    actions.forEach(action => {
      console.log(`   - ${action}`);
    });
    console.log('');
  });

  console.log(`\n✅ TOTAL DE PERMISOS ÚNICOS: ${uniquePerms.size}`);

  // 2. Analizar roles actuales
  console.log('\n' + '='.repeat(80));
  console.log('\n2️⃣ ROLES ACTUALES Y SUS PERMISOS:\n');

  const roles = await prisma.rbac_roles.findMany({
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

  for (const role of roles) {
    console.log(`\n🎭 ${role.name}`);
    console.log(`   ID: ${role.id}`);
    console.log(`   Tipo: ${role.is_system_role ? 'Sistema' : 'Personalizado'}`);
    console.log(`   Permisos: ${role._count.rbac_role_permissions} (${((role._count.rbac_role_permissions / uniquePerms.size) * 100).toFixed(1)}%)`);
    console.log(`   Usuarios: ${role._count.rbac_user_roles}`);
  }

  // 3. Analizar módulos específicos mencionados
  console.log('\n' + '='.repeat(80));
  console.log('\n3️⃣ PERMISOS PARA MÓDULOS ESPECÍFICOS:\n');

  const targetModules = ['DASHBOARD', 'REPORTES', 'ENTRADAS', 'SALIDAS'];
  
  for (const moduleName of targetModules) {
    const modulePerms = await prisma.rbac_permissions.findMany({
      where: { module: moduleName },
      select: {
        module: true,
        action: true
      }
    });

    console.log(`\n📋 ${moduleName}:`);
    if (modulePerms.length > 0) {
      modulePerms.forEach(p => console.log(`   - ${p.action}`));
      console.log(`   Total: ${modulePerms.length} permisos`);
    } else {
      console.log(`   ⚠️ No se encontraron permisos para este módulo`);
    }
  }

  // 4. Verificar usuarios afectados por cambios
  console.log('\n' + '='.repeat(80));
  console.log('\n4️⃣ USUARIOS AFECTADOS POR LOS CAMBIOS:\n');

  const rolesToDelete = ['DESARROLLADOR', 'CONSULTA'];
  
  for (const roleName of rolesToDelete) {
    const usersWithRole = await prisma.rbac_user_roles.findMany({
      where: {
        rbac_roles: { name: roleName }
      },
      include: {
        User: {
          select: {
            email: true,
            name: true,
            clave: true
          }
        }
      }
    });

    console.log(`\n🔴 Rol a eliminar: ${roleName}`);
    console.log(`   Usuarios afectados: ${usersWithRole.length}`);
    
    if (usersWithRole.length > 0) {
      usersWithRole.forEach(ur => {
        console.log(`   - ${ur.User.email || ur.User.name} (clave: ${ur.User.clave})`);
      });
    } else {
      console.log(`   ✅ No hay usuarios asignados, seguro para eliminar`);
    }
  }

  // 5. Verificar opciones de menú disponibles
  console.log('\n' + '='.repeat(80));
  console.log('\n5️⃣ OPCIONES DE MENÚ (module_visibility):\n');

  const menuModules = await prisma.module_visibility.findMany({
    select: {
      module_key: true
    },
    distinct: ['module_key']
  });

  console.log(`Total de módulos en menu: ${menuModules.length}\n`);
  menuModules.forEach(m => console.log(`   - ${m.module_key}`));

  // 6. Resumen de acciones a realizar
  console.log('\n' + '='.repeat(80));
  console.log('\n6️⃣ RESUMEN DE ACCIONES A REALIZAR:\n');

  console.log('✅ Acciones confirmadas:');
  console.log('   1. Eliminar rol DESARROLLADOR (0 usuarios afectados)');
  console.log('   2. Eliminar rol CONSULTA (verificar usuarios)');
  console.log('   3. Crear rol OPERADORN con permisos: DASHBOARD, REPORTES, ENTRADAS, SALIDAS');
  console.log('   4. Actualizar rol OPERADOR para tener: DASHBOARD, REPORTES, SALIDAS');
  console.log('   5. Actualizar rol SUPERVISOR para tener 100% de permisos');
  console.log(`   6. Total de permisos a asignar a SUPERVISOR: ${uniquePerms.size}`);

  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

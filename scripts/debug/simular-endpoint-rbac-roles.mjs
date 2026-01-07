import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Simulando la lógica del endpoint /api/rbac/roles/simple\n');

  // Primero, verificar si hay un usuario administrador para simular
  const adminUser = await prisma.User.findFirst({
    include: {
      rbac_user_roles: {
        include: {
          rbac_roles: true
        }
      }
    }
  });

  if (!adminUser) {
    console.log('❌ No se encontró ningún usuario en la base de datos');
    return;
  }

  console.log(`👤 Simulando sesión como: ${adminUser.email || adminUser.name}\n`);

  // Verificar si es usuario sistema
  const isSystemUser = adminUser.rbac_user_roles.some(
    ur => ur.rbac_roles.is_system_role === true
  );

  console.log(`🔐 Es usuario sistema: ${isSystemUser}`);
  console.log(`📋 Roles del usuario: ${adminUser.rbac_user_roles.map(ur => ur.rbac_roles.name).join(', ')}\n`);

  // Simular la query del endpoint
  const roles = await prisma.rbac_roles.findMany({
    where: {
      is_active: true,
      ...(isSystemUser ? {} : { is_system_role: false })
    },
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      is_active: true,
      is_system_role: true,
      _count: {
        select: {
          rbac_role_permissions: true,
          rbac_user_roles: true
        }
      }
    },
    orderBy: [
      { is_system_role: 'desc' },
      { name: 'asc' }
    ]
  });

  console.log(`\n✅ Roles devueltos por el endpoint: ${roles.length}\n`);

  roles.forEach(role => {
    console.log(`📌 ${role.name}`);
    console.log(`   ID: ${role.id}`);
    console.log(`   Activo: ${role.is_active}`);
    console.log(`   Es sistema: ${role.is_system_role}`);
    console.log(`   Permisos: ${role._count.rbac_role_permissions}`);
    console.log(`   Usuarios: ${role._count.rbac_user_roles}`);
    console.log('');
  });

  // Buscar específicamente OPERADOR
  const operadorRole = roles.find(r => r.name === 'OPERADOR');
  
  if (operadorRole) {
    console.log('✅ El rol OPERADOR SÍ está en la respuesta del endpoint\n');
    console.log('Datos completos del rol OPERADOR:');
    console.log(JSON.stringify(operadorRole, null, 2));
  } else {
    console.log('❌ El rol OPERADOR NO está en la respuesta del endpoint\n');
    console.log('Posibles razones:');
    console.log('  1. is_active = false');
    console.log('  2. is_system_role = true y el usuario no es sistema');
    console.log('  3. El filtro está mal configurado');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n👥 Consultando usuarios con roles de sistema...\n');

  // Buscar usuarios que tengan roles de sistema
  const usersWithSystemRoles = await prisma.rbac_user_roles.findMany({
    where: {
      rbac_roles: {
        is_system_role: true
      }
    },
    include: {
      User: {
        select: {
          id: true,
          email: true,
          name: true,
          clave: true
        }
      },
      rbac_roles: {
        select: {
          name: true,
          is_system_role: true
        }
      }
    }
  });

  console.log(`✅ Encontrados ${usersWithSystemRoles.length} asignaciones de roles de sistema:\n`);

  const userMap = new Map();

  usersWithSystemRoles.forEach(ur => {
    const userId = ur.User.id;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user: ur.User,
        roles: []
      });
    }
    userMap.get(userId).roles.push(ur.rbac_roles.name);
  });

  console.log(`👤 Usuarios únicos con roles de sistema: ${userMap.size}\n`);

  userMap.forEach((data, userId) => {
    console.log(`📧 ${data.user.email || data.user.name}`);
    console.log(`   Clave: ${data.user.clave || 'N/A'}`);
    console.log(`   Roles de sistema: ${data.roles.join(', ')}`);
    console.log('');
  });

  // Verificar qué vería cada usuario
  console.log('🔍 Simulando qué roles vería cada usuario:\n');

  for (const [userId, data] of userMap) {
    const isSystemUser = true; // Tienen al menos un rol de sistema

    const visibleRoles = await prisma.rbac_roles.findMany({
      where: {
        is_active: true,
        ...(isSystemUser ? {} : { is_system_role: false })
      },
      select: {
        name: true,
        is_system_role: true
      }
    });

    console.log(`${data.user.email || data.user.name} vería ${visibleRoles.length} roles:`);
    console.log(`   ${visibleRoles.map(r => r.name).join(', ')}`);
    
    const hasOperador = visibleRoles.some(r => r.name === 'OPERADOR');
    console.log(`   ${hasOperador ? '✅' : '❌'} Incluye OPERADOR`);
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

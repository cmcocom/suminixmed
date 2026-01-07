#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoleAssignments() {
  try {
    console.log('🔍 Verificando asignaciones de roles a usuarios...\n');

    // 1. Buscar rol ADMINISTRADOR
    const adminRole = await prisma.rbac_roles.findFirst({
      where: { name: 'ADMINISTRADOR' }
    });

    if (!adminRole) {
      console.log('❌ No existe el rol ADMINISTRADOR');
      return;
    }

    console.log('✅ Rol ADMINISTRADOR:', adminRole.id);
    console.log('');

    // 2. Buscar usuarios con este rol
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: { role_id: adminRole.id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`👥 Usuarios con rol ADMINISTRADOR: ${userRoles.length}`);
    console.log('');

    if (userRoles.length > 0) {
      userRoles.forEach((ur, index) => {
        console.log(`${index + 1}. Usuario ID: ${ur.user_id}`);
        if (ur.User) {
          console.log(`   Nombre: ${ur.User.name}`);
          console.log(`   Email: ${ur.User.email}`);
        }
        console.log(`   Asignado desde: ${ur.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  ¡NO hay usuarios asignados al rol ADMINISTRADOR!');
      console.log('   Este es el problema: sin rbac_user_roles, el API no carga la visibilidad correcta.');
    }

    // 3. Listar todos los usuarios y sus roles
    const allUserRoles = await prisma.rbac_user_roles.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rbac_roles: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        user_id: 'asc'
      }
    });

    console.log(`📊 Total de asignaciones usuario-rol en el sistema: ${allUserRoles.length}`);
    console.log('');

    if (allUserRoles.length > 0) {
      const grouped = allUserRoles.reduce((acc, ur) => {
        const userId = ur.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user: ur.User,
            roles: []
          };
        }
        if (ur.rbac_roles) {
          acc[userId].roles.push(ur.rbac_roles.name);
        }
        return acc;
      }, {});

      Object.entries(grouped).forEach(([userId, data]) => {
        console.log(`Usuario: ${data.user?.name || userId}`);
        console.log(`  Email: ${data.user?.email || 'N/A'}`);
        console.log(`  Roles: ${data.roles.join(', ') || 'Sin roles'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoleAssignments();

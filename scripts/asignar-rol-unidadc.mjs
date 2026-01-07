#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const userIdentifier = process.argv[2] || '888963';
  const roleName = process.argv[3] || 'UNIDADC';

  console.log('===========================================');
  console.log(`Asignando rol "${roleName}" al usuario "${userIdentifier}"`);
  console.log('Buscando usuario y rol en la base de datos...');

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userIdentifier },
          { clave: userIdentifier }
        ]
      },
      select: {
        id: true,
        clave: true,
        name: true
      }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado con id/clave: ${userIdentifier}`);
      return;
    }

    const role = await prisma.rbac_roles.findFirst({
      where: { name: roleName },
      select: { id: true, name: true }
    });

    if (!role) {
      console.error(`❌ Rol no encontrado con name: ${roleName}`);
      return;
    }

    console.log(`Usuario encontrado: ${user.name || '(sin nombre)'} | ID: ${user.id} | Clave: ${user.clave}`);
    console.log(`Rol encontrado: ${role.name} | ID: ${role.id}`);

    const existingAssignment = await prisma.rbac_user_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: role.id
      }
    });

    if (existingAssignment) {
      console.log('\n⚠️  El usuario ya tiene asignado este rol. No se realizaron cambios.');
      return;
    }

    console.log('\nCreando asignación...');

    const assignment = await prisma.rbac_user_roles.create({
      data: {
        id: randomUUID(),
        user_id: user.id,
        role_id: role.id,
        assigned_by: 'SYSTEM_SCRIPT'
      }
    });

    console.log('✅ Rol asignado correctamente. Registro creado:');
    console.log(assignment);

    const rolesDelUsuario = await prisma.rbac_user_roles.findMany({
      where: { user_id: user.id },
      include: { rbac_roles: { select: { name: true } } }
    });

    console.log('\nRoles actuales del usuario:');
    rolesDelUsuario.forEach((item) => {
      console.log(` - ${item.rbac_roles.name}`);
    });
  } catch (error) {
    console.error('❌ Error durante la asignación:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

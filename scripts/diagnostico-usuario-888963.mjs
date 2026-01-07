#!/usr/bin/env node
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const identifier = process.argv[2] || '888963'; // puede ser id o clave

  console.log('===========================================');
  console.log('Diagnóstico de visibilidad para usuario:', identifier);
  console.log('Conexión a la base de datos y recolección de datos...');

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        { clave: identifier }
      ]
    },
    select: {
      id: true,
      clave: true,
      name: true
    }
  });

  if (!user) {
    console.log(`❌ Usuario no encontrado con id/clave: ${identifier}`);
    return;
  }

  const userId = user.id;

  console.log(`Usuario encontrado: ${user.name || '(sin nombre)'} | ID: ${user.id} | Clave: ${user.clave}`);

  // Obtener roles del usuario
  const userRoles = await prisma.rbac_user_roles.findMany({ where: { user_id: userId } });
  console.log('\nRoles asignados:');
  if (userRoles.length === 0) console.log(' - (ninguno)');
  userRoles.forEach(r => console.log(' -', r.role_id));

  const roleIds = userRoles.map(r => r.role_id);

  // Obtener permisos LEER para estos roles
  const rolePerms = await prisma.rbac_role_permissions.findMany({
    where: { role_id: { in: roleIds } },
    include: { rbac_permissions: true }
  });

  const moduleMap = new Map();

  rolePerms.forEach(rp => {
    const mod = rp.rbac_permissions.module;
    const granted = rp.granted;
    if (!moduleMap.has(mod)) moduleMap.set(mod, []);
    moduleMap.get(mod).push({ role: rp.role_id, granted });
  });

  console.log('\nPermisos LEER por módulo (por rol):');
  for (const [mod, arr] of moduleMap) {
    console.log(` - ${mod}:`, arr.map(a => `${a.role}=>${a.granted}`).join(', '));
  }

  // Calcular visibilidad efectiva (OR entre roles)
  const effective = {};
  for (const [mod, arr] of moduleMap) {
    effective[mod] = arr.some(a => a.granted === true);
  }

  console.log('\nVisibilidad efectiva (OR entre roles):');
  Object.entries(effective).forEach(([k,v]) => console.log(` - ${k}: ${v}`));

  // Revisar registros en module_visibility para roles
  console.log('\nRegistros en module_visibility (por role):');
  if (roleIds.length) {
    try {
      let mv = [];

      if (prisma.module_visibility?.findMany) {
        mv = await prisma.module_visibility.findMany({
          where: { role_id: { in: roleIds } },
          orderBy: { module_key: 'asc' }
        });
      } else {
        mv = await prisma.$queryRaw`
          SELECT role_id, module_key, visible
          FROM module_visibility
          WHERE role_id IN (${Prisma.join(roleIds)})
          ORDER BY module_key ASC
        `;
      }

      if (mv.length === 0) console.log(' - (ninguno)');
      mv.forEach(m => console.log(` - ${m.module_key}: visible=${m.visible} (role=${m.role_id})`));
      console.log(`\nTotal module_visibility rows for roles: ${mv.length}`);
    } catch (error) {
      console.log(' - No se pudo consultar module_visibility:', error.message);
    }
  } else {
    console.log(' - No roles asignados');
  }

  console.log('\nDiagnóstico completado. Si no ves resultados, detén cualquier servidor dev y ejecuta este script desde otra terminal:');
  console.log('  1) Asegúrate de que no esté corriendo `npm run dev` en la misma terminal.');
  console.log("  2) Ejecuta: /usr/bin/env node ./scripts/diagnostico-usuario-888963.mjs <userId>");

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

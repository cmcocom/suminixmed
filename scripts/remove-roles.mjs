#!/usr/bin/env node
import pkg from '@prisma/client';
import readline from 'readline';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const TARGET_ROLES = ['DESARROLLADOR', 'COLABORADOR'];

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function findTargetRoles() {
  // Buscar roles case-insensitive
  const roles = await prisma.rbac_roles.findMany({
    where: {
      OR: TARGET_ROLES.map((r) => ({ name: { equals: r, mode: 'insensitive' } }))
    }
  });
  return roles;
}

function buildDeleteSql(roleIds) {
  const idsList = roleIds.map((id) => `'${id}'`).join(', ');
  return `-- RESPALDO OPCIONAL: guardar resultados antes de ejecutar\n` +
    `SELECT * FROM rbac_roles WHERE id IN (${idsList});\n` +
    `SELECT * FROM rbac_role_permissions WHERE role_id IN (${idsList});\n` +
    `SELECT * FROM rbac_user_roles WHERE role_id IN (${idsList});\n\n` +
    `BEGIN;\n` +
    `DELETE FROM rbac_role_permissions WHERE role_id IN (${idsList});\n` +
    `DELETE FROM rbac_user_roles WHERE role_id IN (${idsList});\n` +
    `DELETE FROM rbac_roles WHERE id IN (${idsList});\n` +
    `COMMIT;\n`;
}

async function run() {
  try {
    const args = process.argv.slice(2);
    const apply = args.includes('--apply') || args.includes('-y');

    console.log('\n🔎 Buscando roles a eliminar (case-insensitive):', TARGET_ROLES.join(', '));

    const roles = await findTargetRoles();

    if (!roles || roles.length === 0) {
      console.log('\n✅ No se encontraron roles con esos nombres. Nada que hacer.');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n⚠️  Se encontraron ${roles.length} rol(es):`);
    roles.forEach((r) => {
      console.log(`  - ${r.name} (id: ${r.id})  is_system_role=${r.is_system_role}`);
    });

    const roleIds = roles.map((r) => r.id);

    const usuarios = await prisma.rbac_user_roles.findMany({
      where: { role_id: { in: roleIds } },
      select: { user_id: true, role_id: true }
    });

    const usuariosUnicos = Array.from(new Set(usuarios.map((u) => u.user_id)));

    console.log(`\n👥 Usuarios afectados (total assignments: ${usuarios.length}, usuarios únicos: ${usuariosUnicos.length}):`);
    console.log(usuariosUnicos.slice(0, 50).map((u) => `  - ${u}`).join('\n'));
    if (usuariosUnicos.length > 50) console.log('  (listado truncado a 50 usuarios)');

    console.log('\n📋 SQL que se ejecutaría (transacción). Revisa cuidadosamente antes de aplicar:\n');
    console.log(buildDeleteSql(roleIds));

    if (!apply) {
      console.log('\n🛑 Modo DRY-RUN: ningún cambio será aplicado.');
      console.log("Para aplicar los cambios ejecuta: node scripts/remove-roles.mjs --apply  (o -y) \n");
      await prisma.$disconnect();
      return;
    }

    // Confirmación interactiva
    const answer = (await ask('\n¿Confirmas que quieres eliminar permanentemente estos roles y todas sus asignaciones y permisos asociados? (si/no): ')).trim().toLowerCase();
    if (!['si', 's', 'yes', 'y'].includes(answer)) {
      console.log('\n✋ Operación abortada por el usuario. No se realizaron cambios.');
      await prisma.$disconnect();
      return;
    }

    // Ejecutar borrado en transacción
    console.log('\n⏳ Ejecutando eliminación en transacción...');
    await prisma.$transaction(async (tx) => {
      // Borrar permisos asignados al rol
      const delPerms = await tx.rbac_role_permissions.deleteMany({ where: { role_id: { in: roleIds } } });
      console.log(`  • rbac_role_permissions eliminadas: ${delPerms.count}`);

      // Borrar asignaciones de usuario
      const delUserRoles = await tx.rbac_user_roles.deleteMany({ where: { role_id: { in: roleIds } } });
      console.log(`  • rbac_user_roles eliminadas: ${delUserRoles.count}`);

      // Finalmente borrar los roles
      const delRoles = await tx.rbac_roles.deleteMany({ where: { id: { in: roleIds } } });
      console.log(`  • rbac_roles eliminadas: ${delRoles.count}`);
    });

    console.log('\n✅ Eliminación completada. Recuerda actualizar cualquier seed o script que pueda volver a crear estos roles.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error durante la operación:', error);
    try { await prisma.$disconnect(); } catch { }
    process.exit(1);
  }
}

run();

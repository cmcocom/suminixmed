#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 RESUMEN DE ROLES EN EL SISTEMA\n');
  console.log('=' .repeat(80));

  try {
    // Obtener todos los roles
    const roles = await prisma.rbac_roles.findMany({
      include: {
        _count: {
          select: {
            rbac_role_permissions: true,
            rbac_user_roles: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`\n🎭 TOTAL DE ROLES: ${roles.length}\n`);

    // Obtener total de permisos en el sistema
    const totalPermisos = await prisma.rbac_permissions.count({
      where: { is_active: true }
    });

    console.log('📋 DETALLE DE CADA ROL:\n');
    
    for (const rol of roles) {
      const porcentaje = ((rol._count.rbac_role_permissions / totalPermisos) * 100).toFixed(1);
      
      console.log(`${rol.name}`);
      console.log(`   ID: ${rol.id}`);
      console.log(`   Tipo: ${rol.type || 'Sistema'}`);
      console.log(`   Descripción: ${rol.description || 'Sin descripción'}`);
      console.log(`   Permisos: ${rol._count.rbac_role_permissions}/${totalPermisos} (${porcentaje}%)`);
      console.log(`   Usuarios asignados: ${rol._count.rbac_user_roles}`);
      console.log(`   Activo: ${rol.is_active ? '✅ Sí' : '❌ No'}`);
      console.log('');
    }

    // Resumen
    console.log('=' .repeat(80));
    console.log('\n📊 RESUMEN ESTADÍSTICO:\n');
    
    const rolesActivos = roles.filter(r => r.is_active).length;
    const rolesInactivos = roles.filter(r => !r.is_active).length;
    const totalUsuariosConRol = roles.reduce((sum, r) => sum + r._count.rbac_user_roles, 0);
    
    console.log(`   Roles activos: ${rolesActivos}`);
    console.log(`   Roles inactivos: ${rolesInactivos}`);
    console.log(`   Total de usuarios con roles asignados: ${totalUsuariosConRol}`);
    console.log(`   Total de permisos en el sistema: ${totalPermisos}`);
    
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 MODIFICACIÓN DEL ROL ADMINISTRADOR Y USUARIO 888963\n');
  console.log('=' .repeat(80));

  try {
    // 1. ENCONTRAR AL USUARIO 888963
    console.log('\n📋 Paso 1: Buscar usuario 888963...');
    const usuario = await prisma.user.findFirst({
      where: { clave: '888963' },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });

    if (!usuario) {
      console.log('❌ Usuario 888963 no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${usuario.name} (${usuario.email})`);
    console.log(`   Roles actuales: ${usuario.rbac_user_roles.map(ur => ur.rbac_roles.name).join(', ')}`);

    // 2. QUITAR ROL ADMINISTRADOR AL USUARIO 888963
    console.log('\n📋 Paso 2: Quitar rol ADMINISTRADOR al usuario 888963...');
    
    const rolAdmin = await prisma.rbac_roles.findUnique({
      where: { id: 'role_administrador' }
    });

    if (!rolAdmin) {
      console.log('❌ Rol ADMINISTRADOR no encontrado');
      return;
    }

    // Eliminar la asignación del rol ADMINISTRADOR
    const deleteResult = await prisma.rbac_user_roles.deleteMany({
      where: {
        user_id: usuario.id,
        role_id: rolAdmin.id
      }
    });

    console.log(`✅ Rol ADMINISTRADOR removido (${deleteResult.count} registro eliminado)`);

    // 3. MODIFICAR EL ROL ADMINISTRADOR
    console.log('\n📋 Paso 3: Modificar permisos del rol ADMINISTRADOR...');
    
    // Módulos a QUITAR del rol ADMINISTRADOR
    const modulosAQuitar = [
      'RBAC',              // Gestión RBAC
      'AUDITORIA',         // Auditoria del Sistema
      'INDICADORES',       // Gestión de Indicadores
      'PERMISOS_INDICADORES', // Permisos de Indicadores
      'CATALOGOS',         // Gestión de Catálogos
      'REPORTES',          // Gestión de Reportes
      'ENTIDADES'          // Entidades
    ];

    console.log('   Módulos a remover del rol ADMINISTRADOR:');
    modulosAQuitar.forEach(mod => console.log(`   - ${mod}`));

    // Obtener todos los permisos de esos módulos
    const permisosAQuitar = await prisma.rbac_permissions.findMany({
      where: {
        module: {
          in: modulosAQuitar
        }
      },
      select: {
        id: true,
        name: true,
        module: true
      }
    });

    console.log(`\n   Total de permisos a remover: ${permisosAQuitar.length}`);
    
    // Eliminar los permisos del rol ADMINISTRADOR
    const deletePermissions = await prisma.rbac_role_permissions.deleteMany({
      where: {
        role_id: rolAdmin.id,
        permission_id: {
          in: permisosAQuitar.map(p => p.id)
        }
      }
    });

    console.log(`✅ ${deletePermissions.count} permisos removidos del rol ADMINISTRADOR`);

    // 4. ELIMINAR VISIBILIDAD DE MÓDULOS
    console.log('\n📋 Paso 4: Actualizar visibilidad de módulos...');
    
    const deleteVisibility = await prisma.module_visibility.deleteMany({
      where: {
        role_id: rolAdmin.id,
        module_key: {
          in: modulosAQuitar
        }
      }
    });

    console.log(`✅ ${deleteVisibility.count} módulos removidos de la visibilidad`);

    // 5. VERIFICAR CAMBIOS
    console.log('\n📋 Paso 5: Verificar cambios...');
    
    // Verificar usuario
    const usuarioActualizado = await prisma.user.findFirst({
      where: { clave: '888963' },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });

    console.log('\n👤 USUARIO 888963 - ESTADO FINAL:');
    console.log(`   Nombre: ${usuarioActualizado.name}`);
    console.log(`   Email: ${usuarioActualizado.email}`);
    console.log(`   Roles actuales: ${usuarioActualizado.rbac_user_roles.map(ur => ur.rbac_roles.name).join(', ')}`);

    // Verificar rol ADMINISTRADOR
    const adminPermisos = await prisma.rbac_role_permissions.count({
      where: { role_id: rolAdmin.id }
    });

    const adminModulos = await prisma.module_visibility.findMany({
      where: { role_id: rolAdmin.id },
      select: { module_key: true }
    });

    console.log('\n🎭 ROL ADMINISTRADOR - ESTADO FINAL:');
    console.log(`   Total de permisos: ${adminPermisos}`);
    console.log(`   Total de módulos visibles: ${adminModulos.length}`);
    console.log('\n   Módulos que YA NO puede ver ADMINISTRADOR:');
    modulosAQuitar.forEach(mod => console.log(`   ❌ ${mod}`));

    console.log('\n✅ CAMBIOS COMPLETADOS EXITOSAMENTE');
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

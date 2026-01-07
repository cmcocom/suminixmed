import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRolesStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE ROLES Y USUARIOS\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar roles
    console.log('\n📋 ROLES EN LA BASE DE DATOS:');
    const roles = await prisma.rbac_roles.findMany({
      where: {
        name: { in: ['ADMINISTRADOR', 'UNIDADC', 'OPERADOR', 'OPERADORN'] }
      },
      orderBy: { name: 'asc' }
    });
    
    roles.forEach(rol => {
      console.log(`\n  Rol: ${rol.name}`);
      console.log(`    - ID: ${rol.id}`);
      console.log(`    - Activo: ${rol.is_active ? '✅ SÍ' : '❌ NO'}`);
      console.log(`    - Rol de Sistema: ${rol.is_system_role ? '✅ SÍ' : '❌ NO'}`);
      console.log(`    - Descripción: ${rol.description || 'N/A'}`);
    });
    
    // 2. Verificar usuarios específicos
    console.log('\n\n👥 USUARIOS Y SUS ROLES:');
    const usuarios = await prisma.usuarios.findMany({
      where: {
        email: { in: ['cmcocom@unidadc.com', 'monserrat@unidadc.com'] }
      },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });
    
    for (const usuario of usuarios) {
      console.log(`\n  Usuario: ${usuario.email}`);
      console.log(`    - Nombre: ${usuario.nombre_completo}`);
      console.log(`    - Usuario de Sistema: ${usuario.is_system_user ? '✅ SÍ' : '❌ NO'}`);
      console.log(`    - Activo: ${usuario.activo ? '✅ SÍ' : '❌ NO'}`);
      console.log(`    - Roles asignados: ${usuario.rbac_user_roles.length}`);
      
      usuario.rbac_user_roles.forEach(ur => {
        console.log(`      • ${ur.rbac_roles.name} (Activo: ${ur.is_active ? '✅' : '❌'})`);
      });
    }
    
    // 3. Verificar permisos de cada rol
    console.log('\n\n🔐 PERMISOS POR ROL:');
    for (const rol of roles) {
      const permisos = await prisma.rbac_role_permissions.count({
        where: { role_id: rol.id }
      });
      console.log(`  ${rol.name}: ${permisos} permisos`);
    }
    
    // 4. Verificar module_visibility
    console.log('\n\n👁️  MODULE VISIBILITY:');
    const usuarios2 = await prisma.usuarios.findMany({
      where: {
        email: { in: ['cmcocom@unidadc.com', 'monserrat@unidadc.com'] }
      },
      include: {
        module_visibility: true
      }
    });
    
    for (const usuario of usuarios2) {
      console.log(`\n  Usuario: ${usuario.email}`);
      console.log(`    - Configuraciones de visibilidad: ${usuario.module_visibility.length}`);
      if (usuario.module_visibility.length === 0) {
        console.log(`    ⚠️  Sin restricciones de visibilidad (debería ver TODO)`);
      } else {
        usuario.module_visibility.forEach(mv => {
          console.log(`      • ${mv.module_name}: ${mv.is_visible ? 'Visible ✅' : 'Oculto ❌'}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRolesStatus();

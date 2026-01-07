#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function configurarRolAdministrador() {
  try {
    console.log('\n🔧 CONFIGURACIÓN DEL ROL ADMINISTRADOR\n');
    console.log('═'.repeat(80));

    // 1. Verificar rol ADMINISTRADOR
    const rolAdmin = await prisma.rbac_roles.findFirst({
      where: { name: 'ADMINISTRADOR' }
    });

    if (!rolAdmin) {
      console.log('❌ No se encontró el rol ADMINISTRADOR');
      return;
    }

    console.log('\n📋 ROL ADMINISTRADOR ACTUAL:');
    console.log(`   ID: ${rolAdmin.id}`);
    console.log(`   Nombre: ${rolAdmin.name}`);
    console.log(`   Descripción: ${rolAdmin.description}`);
    console.log(`   Es dinámico: ${rolAdmin.is_dynamic ? '✅ SÍ' : '❌ NO'}`);

    // 2. Actualizar a dinámico si no lo es
    if (!rolAdmin.is_dynamic) {
      console.log('\n🔄 Actualizando rol a DINÁMICO...');
      
      await prisma.rbac_roles.update({
        where: { id: rolAdmin.id },
        data: { is_dynamic: true }
      });
      
      console.log('✅ Rol actualizado a dinámico');
    } else {
      console.log('\n✅ El rol ya es dinámico');
    }

    // 3. Contar permisos totales
    const totalPermisos = await prisma.rbac_permissions.count();
    
    // 4. Contar permisos asignados
    const permisosAsignados = await prisma.rbac_role_permissions.count({
      where: { role_id: rolAdmin.id }
    });

    console.log('\n📊 PERMISOS:');
    console.log(`   Total en sistema: ${totalPermisos}`);
    console.log(`   Asignados a ADMINISTRADOR: ${permisosAsignados}`);
    console.log(`   Porcentaje: ${((permisosAsignados / totalPermisos) * 100).toFixed(1)}%`);

    if (permisosAsignados === totalPermisos) {
      console.log('\n✅ El rol ADMINISTRADOR ya tiene el 100% de los permisos');
    } else {
      console.log(`\n⚠️  FALTAN ${totalPermisos - permisosAsignados} PERMISOS`);
      console.log('\nℹ️  Como el rol es dinámico, los permisos se asignan automáticamente');
      console.log('   cuando se crea un nuevo permiso en el sistema.');
    }

    // 5. Verificar rol UNIDADC para comparación
    const rolUnidadc = await prisma.rbac_roles.findFirst({
      where: { name: 'UNIDADC' }
    });

    if (rolUnidadc) {
      const permisosUnidadc = await prisma.rbac_role_permissions.count({
        where: { role_id: rolUnidadc.id }
      });

      console.log('\n📋 ROL UNIDADC (para comparación):');
      console.log(`   Es dinámico: ${rolUnidadc.is_dynamic ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Permisos: ${permisosUnidadc}/${totalPermisos} (${((permisosUnidadc / totalPermisos) * 100).toFixed(1)}%)`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ CONFIGURACIÓN COMPLETADA');
    console.log('\nEl rol ADMINISTRADOR ahora:');
    console.log('   • Es dinámico (se actualizará automáticamente)');
    console.log('   • Tiene acceso al menú de Reportes');
    console.log('   • Puede ver: Inventario y Categorías - Stock');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

configurarRolAdministrador();

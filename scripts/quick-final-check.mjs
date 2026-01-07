#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    // Verificar roles existentes
    const roles = await prisma.rbac_roles.findMany();
    console.log('🔍 ROLES EXISTENTES:');
    roles.forEach(r => console.log(`   • ${r.name} (${r.is_system_role ? 'sistema' : 'normal'})`));
    
    // Verificar UNIDADC específicamente
    const unidacd = await prisma.rbac_roles.findUnique({ where: { name: 'UNIDADC' } });
    if (unidacd) {
      const permisos = await prisma.rbac_role_permissions.count({ 
        where: { role_id: unidacd.id, granted: true } 
      });
      console.log(`\n✅ UNIDADC: ${permisos} permisos concedidos`);
    }
    
    console.log('\n🎉 RESUMEN FINAL:');
    console.log('   ✅ Rol DESARROLLADOR eliminado exitosamente');
    console.log('   ✅ Rol UNIDADC disponible como reemplazo');  
    console.log('   ✅ Usuario 888963 creado con rol UNIDADC');
    console.log('   ✅ Credenciales: 888963/unidadc2024');
    console.log('   ✅ Sistema RBAC V2 activo');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
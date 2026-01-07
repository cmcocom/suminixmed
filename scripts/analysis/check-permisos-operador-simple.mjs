// Script simplificado para verificar permisos OPERADOR
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPermisosOperador() {
  try {
    console.log('\n=== VERIFICACIÓN DE PERMISOS OPERADOR ===\n');

    // 1. Buscar el rol OPERADOR
    const rolOperador = await prisma.rbac_roles.findFirst({
      where: { name: 'OPERADOR' },
      include: {
        rbac_role_permissions: {
          include: {
            rbac_permissions: true
          }
        }
      }
    });

    if (!rolOperador) {
      console.log('❌ No se encontró el rol OPERADOR');
      return;
    }

    console.log(`📋 Rol: ${rolOperador.name} (${rolOperador.description})`);
    console.log(`🔧 Activo: ${rolOperador.is_active}`);
    console.log(`📊 Total permisos asignados: ${rolOperador.rbac_role_permissions.length}\n`);

    // 2. Agrupar permisos por módulo
    const permisosPorModulo = {};
    
    rolOperador.rbac_role_permissions.forEach(rp => {
      const modulo = rp.rbac_permissions.module;
      const accion = rp.rbac_permissions.action;
      
      if (!permisosPorModulo[modulo]) {
        permisosPorModulo[modulo] = [];
      }
      permisosPorModulo[modulo].push(accion);
    });

    // 3. Mostrar permisos organizados
    console.log('🔍 PERMISOS POR MÓDULO:\n');
    
    Object.keys(permisosPorModulo).sort().forEach(modulo => {
      const acciones = permisosPorModulo[modulo].sort();
      console.log(`📂 ${modulo}:`);
      acciones.forEach(accion => {
        console.log(`   ✅ ${accion}`);
      });
      console.log('');
    });

    // 4. Verificar módulos específicos que nos interesan
    const modulosImportantes = [
      'DASHBOARD',
      'INVENTARIO', 
      'CATALOGOS_PRODUCTOS',
      'REPORTES_INVENTARIO'
    ];

    console.log('🎯 MÓDULOS IMPORTANTES PARA PRODUCTOS E INVENTARIO:\n');
    
    modulosImportantes.forEach(modulo => {
      const permisos = permisosPorModulo[modulo];
      if (permisos) {
        console.log(`✅ ${modulo}: ${permisos.join(', ')}`);
      } else {
        console.log(`❌ ${modulo}: Sin permisos`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPermisosOperador();
// Script para verificar permisos del rol OPERADOR
import { PrismaClient } from '@prisma/client';
import { checkUserPermission } from './lib/rbac-dynamic.js';

const prisma = new PrismaClient();

async function verificarPermisosOperador() {
  try {
    console.log('\n=== VERIFICACIÓN DE PERMISOS OPERADOR ===\n');

    // Buscar usuario con rol OPERADOR
    const usuarioOperador = await prisma.users.findFirst({
      where: {
        user_roles: {
          some: {
            rbac_roles: {
              name: 'OPERADOR'
            }
          }
        }
      },
      include: {
        user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });

    if (!usuarioOperador) {
      console.log('❌ No se encontró usuario con rol OPERADOR');
      return;
    }

    console.log(`📋 Usuario encontrado: ${usuarioOperador.clave} (${usuarioOperador.nombre})`);
    console.log(`🔑 Roles: ${usuarioOperador.user_roles.map(ur => ur.rbac_roles.name).join(', ')}\n`);

    // Verificar permisos específicos
    const permisosAVerificar = [
      ['DASHBOARD', 'LEER'],
      ['INVENTARIO', 'LEER'],
      ['CATALOGOS_PRODUCTOS', 'LEER'],
      ['REPORTES_INVENTARIO', 'LEER']
    ];

    console.log('🔍 VERIFICANDO PERMISOS:\n');

    for (const [modulo, accion] of permisosAVerificar) {
      try {
        const tienePermiso = await checkUserPermission(usuarioOperador.id, modulo, accion);
        const emoji = tienePermiso ? '✅' : '❌';
        console.log(`${emoji} ${modulo}.${accion}: ${tienePermiso ? 'SÍ' : 'NO'}`);
      } catch (error) {
        console.log(`❌ ${modulo}.${accion}: ERROR - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPermisosOperador();
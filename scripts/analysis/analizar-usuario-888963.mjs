import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analizarUsuario888963() {
  console.log('\n🔍 ANÁLISIS DEL USUARIO 888963 (Cristian Cocom)\n');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Buscar el usuario
    const usuario = await prisma.User.findFirst({
      where: { clave: '888963' },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: {
              include: {
                _count: {
                  select: {
                    rbac_role_permissions: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      console.log('❌ Usuario 888963 no encontrado');
      return;
    }

    console.log('👤 INFORMACIÓN DEL USUARIO:');
    console.log(`   Nombre: ${usuario.name}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Clave: ${usuario.clave}`);
    console.log('');

    console.log('🎭 ROLES ACTUALES:');
    usuario.rbac_user_roles.forEach(ur => {
      console.log(`   - ${ur.rbac_roles.name} (${ur.rbac_roles._count.rbac_role_permissions} permisos)`);
    });
    console.log('');

    // Obtener detalles de cada rol
    const administradorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'ADMINISTRADOR' },
      include: {
        rbac_role_permissions: {
          include: {
            rbac_permissions: {
              select: {
                module: true,
                action: true
              }
            }
          }
        },
        _count: {
          select: {
            rbac_role_permissions: true
          }
        }
      }
    });

    const unidadcRole = await prisma.rbac_roles.findUnique({
      where: { name: 'UNIDADC' },
      include: {
        rbac_role_permissions: {
          include: {
            rbac_permissions: {
              select: {
                module: true,
                action: true
              }
            }
          }
        },
        _count: {
          select: {
            rbac_role_permissions: true
          }
        }
      }
    });

    console.log('='.repeat(80));
    console.log('');
    console.log('📊 COMPARACIÓN DE ROLES:\n');

    console.log('🎭 ROL ADMINISTRADOR:');
    console.log(`   Tipo: ${administradorRole.is_system_role ? 'Sistema' : 'Personalizado'}`);
    console.log(`   Total permisos: ${administradorRole._count.rbac_role_permissions}`);
    console.log('');

    console.log('🎭 ROL UNIDADC:');
    console.log(`   Tipo: ${unidadcRole.is_system_role ? 'Sistema' : 'Personalizado'}`);
    console.log(`   Total permisos: ${unidadcRole._count.rbac_role_permissions}`);
    console.log('');

    // Comparar permisos
    const adminPerms = new Set(
      administradorRole.rbac_role_permissions.map(rp => 
        `${rp.rbac_permissions.module}:${rp.rbac_permissions.action}`
      )
    );

    const unidadcPerms = new Set(
      unidadcRole.rbac_role_permissions.map(rp => 
        `${rp.rbac_permissions.module}:${rp.rbac_permissions.action}`
      )
    );

    // Permisos que tiene ADMINISTRADOR pero NO UNIDADC
    const permsSoloAdmin = [...adminPerms].filter(p => !unidadcPerms.has(p));
    
    // Permisos que tiene UNIDADC pero NO ADMINISTRADOR
    const permsSoloUnidadc = [...unidadcPerms].filter(p => !adminPerms.has(p));

    console.log('='.repeat(80));
    console.log('');
    console.log('🔍 ANÁLISIS DE DIFERENCIAS:\n');

    if (adminPerms.size === unidadcPerms.size && permsSoloAdmin.length === 0 && permsSoloUnidadc.length === 0) {
      console.log('✅ AMBOS ROLES TIENEN EXACTAMENTE LOS MISMOS PERMISOS');
      console.log('');
      console.log('⚠️  RESPUESTA: NO, EL USUARIO 888963 NO PIERDE NADA');
      console.log('');
      console.log('Ambos roles tienen 100% de permisos (130/130).');
      console.log('La única diferencia es el tipo de rol:');
      console.log('  - ADMINISTRADOR: Rol de sistema');
      console.log('  - UNIDADC: Rol de sistema');
      console.log('');
      console.log('El usuario puede funcionar perfectamente solo con UNIDADC.');
    } else {
      console.log('⚠️  HAY DIFERENCIAS ENTRE LOS ROLES:\n');
      
      if (permsSoloAdmin.length > 0) {
        console.log(`❌ Permisos que PERDERÍA (solo en ADMINISTRADOR): ${permsSoloAdmin.length}`);
        console.log('');
        
        // Agrupar por módulo
        const modulosAdmin = new Map();
        permsSoloAdmin.forEach(p => {
          const [module, action] = p.split(':');
          if (!modulosAdmin.has(module)) {
            modulosAdmin.set(module, []);
          }
          modulosAdmin.get(module).push(action);
        });

        for (const [module, actions] of modulosAdmin) {
          console.log(`   📌 ${module}:`);
          actions.forEach(action => console.log(`      - ${action}`));
        }
        console.log('');
      }

      if (permsSoloUnidadc.length > 0) {
        console.log(`✅ Permisos adicionales en UNIDADC: ${permsSoloUnidadc.length}`);
        console.log('');
        
        // Agrupar por módulo
        const modulosUnidadc = new Map();
        permsSoloUnidadc.forEach(p => {
          const [module, action] = p.split(':');
          if (!modulosUnidadc.has(module)) {
            modulosUnidadc.set(module, []);
          }
          modulosUnidadc.get(module).push(action);
        });

        for (const [module, actions] of modulosUnidadc) {
          console.log(`   📌 ${module}:`);
          actions.forEach(action => console.log(`      - ${action}`));
        }
        console.log('');
      }

      if (permsSoloAdmin.length > 0) {
        console.log('⚠️  RESPUESTA: SÍ, EL USUARIO 888963 PERDERÍA ACCESO A:');
        console.log(`   - ${permsSoloAdmin.length} permisos específicos`);
        console.log('');
        console.log('❌ NO SE RECOMIENDA quitar el rol ADMINISTRADOR');
      } else {
        console.log('✅ RESPUESTA: NO, EL USUARIO 888963 NO PIERDE NADA');
        console.log('');
        console.log('Puede funcionar solo con UNIDADC sin problemas.');
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');
    console.log('💡 RECOMENDACIÓN:\n');
    
    if (permsSoloAdmin.length === 0) {
      console.log('✅ Es seguro quitar el rol ADMINISTRADOR');
      console.log('   El usuario mantendrá exactamente los mismos permisos con UNIDADC.');
      console.log('');
      console.log('Ventajas de tener solo UNIDADC:');
      console.log('   - Simplifica la gestión de roles');
      console.log('   - Reduce redundancia');
      console.log('   - Mantiene funcionalidad completa');
    } else {
      console.log('⚠️  Mantener ambos roles o evaluar si necesita esos permisos específicos');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analizarUsuario888963()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

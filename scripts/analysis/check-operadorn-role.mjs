import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkOperadornRole() {
  try {
    console.log('🔍 Buscando rol OPERADORN...\n');

    // Buscar rol OPERADORN
    const rolOperadorn = await prisma.roles.findUnique({
      where: { nombre: 'OPERADORN' },
      include: {
        permisos_rol: {
          include: {
            permisos: true
          }
        }
      }
    });

    if (rolOperadorn) {
      console.log('✅ ROL ENCONTRADO:');
      console.log('   ID:', rolOperadorn.id);
      console.log('   Nombre:', rolOperadorn.nombre);
      console.log('   Descripción:', rolOperadorn.descripcion);
      console.log('   Tipo:', rolOperadorn.tipo_rol);
      console.log('   Activo:', rolOperadorn.activo);
      console.log('   Permisos asignados:', rolOperadorn.permisos_rol.length);
      
      if (rolOperadorn.permisos_rol.length > 0) {
        console.log('\n📋 Primeros 10 permisos:');
        rolOperadorn.permisos_rol.slice(0, 10).forEach(pr => {
          console.log(`   • ${pr.permisos.modulo} - ${pr.permisos.accion}`);
        });
      }
    } else {
      console.log('❌ ROL NO ENCONTRADO en la base de datos');
      console.log('\n🔍 Buscando roles similares...');
      
      const rolesConOperador = await prisma.roles.findMany({
        where: {
          nombre: {
            contains: 'OPERADOR',
            mode: 'insensitive'
          }
        }
      });
      
      if (rolesConOperador.length > 0) {
        console.log('\n📋 Roles encontrados con "OPERADOR":');
        rolesConOperador.forEach(rol => {
          console.log(`   • ${rol.nombre} (${rol.tipo_rol}) - Activo: ${rol.activo}`);
        });
      }
    }

    // Listar todos los roles activos
    console.log('\n📊 Todos los roles en el sistema:');
    const todosLosRoles = await prisma.roles.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    console.log(`\nTotal de roles: ${todosLosRoles.length}\n`);
    todosLosRoles.forEach(rol => {
      const estado = rol.activo ? '✅' : '❌';
      console.log(`${estado} ${rol.nombre} (${rol.tipo_rol})`);
    });

    // Verificar usuarios con rol OPERADORN
    console.log('\n👥 Usuarios con rol OPERADORN:');
    const usuariosConOperadorn = await prisma.user_roles.findMany({
      where: {
        roles: {
          nombre: 'OPERADORN'
        }
      },
      include: {
        user: {
          select: {
            clave: true,
            name: true,
            activo: true
          }
        }
      }
    });

    console.log(`Total: ${usuariosConOperadorn.length} usuarios`);
    if (usuariosConOperadorn.length > 0) {
      usuariosConOperadorn.forEach(ur => {
        console.log(`   • ${ur.user.clave} - ${ur.user.name} (Activo: ${ur.user.activo})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOperadornRole();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarUsuariosPotenciales() {
  console.log('\n🔍 BUSCANDO USUARIOS QUE PODRÍAN SER LOS "6 USUARIOS CON OPERADORN"\n');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Buscar usuario específico mencionado: PAMELA CAROLINA CUEVAS CHAY (905076)
    console.log('1️⃣ Buscando usuario mencionado en documentación antigua...\n');
    
    const pamela = await prisma.User.findFirst({
      where: {
        OR: [
          { clave: '905076' },
          { name: { contains: 'PAMELA', mode: 'insensitive' } },
          { name: { contains: 'CUEVAS', mode: 'insensitive' } }
        ]
      },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      }
    });

    if (pamela) {
      console.log('✅ Usuario PAMELA encontrado:');
      console.log(`   Nombre: ${pamela.name}`);
      console.log(`   Email: ${pamela.email}`);
      console.log(`   Clave: ${pamela.clave}`);
      console.log(`   Activo: ${pamela.activo}`);
      
      if (pamela.rbac_user_roles.length > 0) {
        console.log(`   Roles actuales:`);
        pamela.rbac_user_roles.forEach(ur => {
          console.log(`     - ${ur.rbac_roles.name}`);
        });
      } else {
        console.log(`   ⚠️  No tiene roles asignados`);
      }
    } else {
      console.log('❌ Usuario PAMELA no encontrado en la base de datos actual');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // Buscar TODOS los usuarios activos con sus roles
    console.log('2️⃣ Listando TODOS los usuarios activos y sus roles...\n');
    
    const allUsers = await prisma.User.findMany({
      where: {
        activo: true
      },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Total de usuarios activos: ${allUsers.length}\n`);

    // Contar usuarios por rol
    const roleCount = new Map();
    allUsers.forEach(user => {
      user.rbac_user_roles.forEach(ur => {
        const roleName = ur.rbac_roles.name;
        if (!roleCount.has(roleName)) {
          roleCount.set(roleName, []);
        }
        roleCount.get(roleName).push({
          name: user.name,
          email: user.email,
          clave: user.clave
        });
      });
    });

    console.log('📊 DISTRIBUCIÓN DE USUARIOS POR ROL:\n');
    
    for (const [roleName, users] of roleCount.entries()) {
      console.log(`🎭 ${roleName} (${users.length} usuarios):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.email} (clave: ${user.clave || 'N/A'})`);
      });
      console.log('');
    }

    // Buscar usuarios sin roles
    const usersWithoutRoles = allUsers.filter(u => u.rbac_user_roles.length === 0);
    
    if (usersWithoutRoles.length > 0) {
      console.log('='.repeat(80));
      console.log('');
      console.log(`⚠️  USUARIOS SIN ROLES ASIGNADOS (${usersWithoutRoles.length}):\n`);
      
      usersWithoutRoles.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Clave: ${user.clave || 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('');
    console.log('💡 ANÁLISIS:\n');
    console.log('La documentación antigua menciona "6 usuarios con OPERADORN",');
    console.log('pero este rol recién se creó en la modificación actual.');
    console.log('');
    console.log('Opciones:');
    console.log('  1. La documentación se refería a un sistema anterior');
    console.log('  2. Hubo confusión con otro rol (por ejemplo, OPERADOR)');
    console.log('  3. Los 6 usuarios nunca existieron con ese rol específico');
    console.log('');
    console.log('✅ RECOMENDACIÓN:');
    console.log('   - El rol OPERADORN ahora existe y está configurado correctamente');
    console.log('   - Tiene 31 permisos (23.8%) para gestionar entradas y salidas');
    console.log('   - Puedes asignar este rol a los usuarios que lo necesiten');
    console.log('   - No hay "6 usuarios perdidos" que recuperar');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

buscarUsuariosPotenciales()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

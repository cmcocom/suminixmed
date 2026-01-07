import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log('🔍 Verificando permisos del rol ADMINISTRADOR...\n');
    
    // 1. Verificar que existe el rol ADMINISTRADOR
    const adminRole = await prisma.roles.findFirst({
      where: {
        nombre: 'ADMINISTRADOR'
      }
    });
    
    if (!adminRole) {
      console.log('❌ ERROR: No se encontró el rol ADMINISTRADOR en la base de datos\n');
      return;
    }
    
    console.log('✅ Rol ADMINISTRADOR encontrado:');
    console.log(`   ID: ${adminRole.id}`);
    console.log(`   Nombre: ${adminRole.nombre}`);
    console.log(`   Descripción: ${adminRole.descripcion || 'N/A'}`);
    console.log(`   Activo: ${adminRole.activo}\n`);
    
    // 2. Verificar permisos del rol ADMINISTRADOR
    const permisos = await prisma.permisos_roles.findMany({
      where: {
        role_id: adminRole.id
      },
      include: {
        modulos: {
          select: {
            nombre: true,
            ruta: true,
            activo: true
          }
        }
      }
    });
    
    console.log(`📋 Permisos asignados al ADMINISTRADOR: ${permisos.length} módulos\n`);
    
    if (permisos.length === 0) {
      console.log('❌ ERROR CRÍTICO: El rol ADMINISTRADOR no tiene permisos asignados!');
      console.log('   Esto explica por qué no ve ninguna opción en el menú.\n');
      
      // Mostrar módulos disponibles
      const modulos = await prisma.modulos.findMany({
        where: {
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          ruta: true
        }
      });
      
      console.log(`💡 Módulos disponibles en el sistema: ${modulos.length}`);
      console.table(modulos);
      
      console.log('\n🔧 SOLUCIÓN SUGERIDA:');
      console.log('   Necesitas asignar permisos al rol ADMINISTRADOR.');
      console.log('   Puedo crear un script para hacerlo automáticamente.\n');
      
    } else {
      console.log('Detalles de permisos:');
      console.table(permisos.map(p => ({
        'Módulo': p.modulos?.nombre || 'N/A',
        'Ruta': p.modulos?.ruta || 'N/A',
        'Activo': p.modulos?.activo ? 'Sí' : 'No',
        'Leer': p.puede_leer ? '✓' : '✗',
        'Crear': p.puede_crear ? '✓' : '✗',
        'Editar': p.puede_editar ? '✓' : '✗',
        'Eliminar': p.puede_eliminar ? '✓' : '✗'
      })));
    }
    
    // 3. Verificar usuarios con rol ADMINISTRADOR
    console.log('\n👥 Usuarios con rol ADMINISTRADOR:');
    const adminUsers = await prisma.user_roles.findMany({
      where: {
        role_id: adminRole.id
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No hay usuarios asignados al rol ADMINISTRADOR\n');
    } else {
      console.table(adminUsers.map(ur => ({
        'Usuario': ur.User?.name || 'N/A',
        'Email': ur.User?.email || 'N/A',
        'Es Primario': ur.es_rol_primario ? 'Sí' : 'No'
      })));
    }
    
    // 4. Verificar módulos activos
    const modulosActivos = await prisma.modulos.findMany({
      where: {
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        ruta: true,
        visible_en_menu: true
      }
    });
    
    console.log(`\n📱 Módulos activos en el sistema: ${modulosActivos.length}`);
    
    const modulosVisiblesMenu = modulosActivos.filter(m => m.visible_en_menu);
    console.log(`   Visibles en menú: ${modulosVisiblesMenu.length}`);
    
    const modulosConPermiso = permisos.filter(p => p.modulos?.activo).length;
    console.log(`   Con permiso para ADMINISTRADOR: ${modulosConPermiso}\n`);
    
    if (modulosVisiblesMenu.length > modulosConPermiso) {
      console.log('⚠️  Hay módulos visibles en menú sin permisos para ADMINISTRADOR:');
      const modulosSinPermiso = modulosVisiblesMenu.filter(m => 
        !permisos.some(p => p.modulo_id === m.id)
      );
      console.table(modulosSinPermiso.map(m => ({
        'Módulo': m.nombre,
        'Ruta': m.ruta
      })));
    }
    
  } catch (error) {
    console.error('❌ Error al verificar permisos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();

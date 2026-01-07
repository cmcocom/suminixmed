/**
 * Script de Diagnóstico - Permisos ADMINISTRADOR
 * 
 * Verifica qué módulos tiene asignados el rol ADMINISTRADOR
 * según rbac_role_permissions.granted = true
 * 
 * Uso: node scripts/verificar-permisos-administrador.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO PERMISOS DEL ROL ADMINISTRADOR\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener información del rol ADMINISTRADOR
    const rolAdmin = await prisma.rbac_roles.findUnique({
      where: { name: 'ADMINISTRADOR' }
    });

    if (!rolAdmin) {
      console.error('❌ No se encontró el rol ADMINISTRADOR');
      return;
    }

    console.log('\n📋 Rol encontrado:');
    console.log(`   ID: ${rolAdmin.id}`);
    console.log(`   Nombre: ${rolAdmin.name}`);
    console.log(`   Nivel: ${rolAdmin.hierarchy_level}`);
    console.log(`   Descripción: ${rolAdmin.description}`);

    // 2. Obtener todos los módulos del sistema
    const todosModulos = await prisma.rbac_permissions.findMany({
      orderBy: { module: 'asc' }
    });

    console.log(`\n📦 Total de módulos en el sistema: ${todosModulos.length}`);

    // 3. Obtener permisos asignados al rol ADMINISTRADOR con granted=true
    const permisosGranted = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: rolAdmin.id,
        granted: true
      },
      include: {
        rbac_permissions: true
      }
    });

    console.log(`\n✅ Módulos con granted=true: ${permisosGranted.length}`);
    console.log('\nMÓDULOS VISIBLES (granted=true):');
    console.log('-'.repeat(80));

    const modulosVisibles = new Set();
    permisosGranted.forEach(p => {
      modulosVisibles.add(p.rbac_permissions.module);
    });

    Array.from(modulosVisibles).sort().forEach((modulo, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${modulo}`);
    });

    // 4. Verificar módulos faltantes
    const todosModulosSet = new Set(todosModulos.map(m => m.module));
    const modulosFaltantes = Array.from(todosModulosSet).filter(m => !modulosVisibles.has(m));

    if (modulosFaltantes.length > 0) {
      console.log(`\n❌ Módulos NO visibles (granted=false o sin asignar): ${modulosFaltantes.length}`);
      console.log('-'.repeat(80));
      modulosFaltantes.sort().forEach((modulo, index) => {
        console.log(`${(index + 1).toString().padStart(2, '0')}. ${modulo}`);
      });
    }

    // 5. Verificar lo que devolvería la API
    console.log('\n🌐 SIMULACIÓN DE RESPUESTA API /api/rbac/modules/visibility');
    console.log('-'.repeat(80));
    
    const apiResponse = {};
    permisosGranted.forEach(p => {
      apiResponse[p.rbac_permissions.module] = true;
    });

    console.log('Objeto que recibiría el frontend:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 6. Verificar usuarios con rol ADMINISTRADOR
    console.log('\n👥 USUARIOS CON ROL ADMINISTRADOR:');
    console.log('-'.repeat(80));

    const usuariosAdmin = await prisma.rbac_user_roles.findMany({
      where: { role_id: rolAdmin.id },
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

    if (usuariosAdmin.length === 0) {
      console.log('⚠️ No hay usuarios asignados a este rol');
    } else {
      usuariosAdmin.forEach((ur, index) => {
        console.log(`${index + 1}. ${ur.User.name} (${ur.User.email || 'Sin email'})`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Diagnóstico completado');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

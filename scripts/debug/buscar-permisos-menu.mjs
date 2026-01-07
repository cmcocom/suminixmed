#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function buscarPermisosMenu() {
  try {
    console.log('\n🔍 BÚSQUEDA DE PERMISOS DEL MENÚ\n');
    console.log('═'.repeat(80));

    // Buscar todos los módulos únicos
    const modulos = await prisma.$queryRaw`
      SELECT DISTINCT module 
      FROM rbac_permissions 
      ORDER BY module;
    `;

    console.log('\n📂 MÓDULOS EN EL SISTEMA:\n');
    modulos.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.module}`);
    });

    // Buscar permisos que puedan ser del menú
    const permisosMenu = await prisma.rbac_permissions.findMany({
      where: {
        OR: [
          { action: 'view_menu' },
          { action: { contains: 'menu' } },
          { action: { contains: 'access' } },
          { module: { contains: 'report' } }
        ]
      },
      orderBy: { module: 'asc' }
    });

    console.log(`\n📋 PERMISOS RELACIONADOS CON MENÚ/ACCESO: ${permisosMenu.length}\n`);
    permisosMenu.forEach(p => {
      console.log(`   ${p.module} - ${p.action}`);
    });

    // Buscar específicamente permisos de informes/reportes
    const todosPermisos = await prisma.rbac_permissions.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    });

    console.log(`\n\n📊 TODOS LOS PERMISOS (${todosPermisos.length}):\n`);
    
    let moduloActual = '';
    todosPermisos.forEach(p => {
      if (p.module !== moduloActual) {
        moduloActual = p.module;
        console.log(`\n${moduloActual}:`);
      }
      console.log(`   - ${p.action}`);
    });

    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarPermisosMenu();

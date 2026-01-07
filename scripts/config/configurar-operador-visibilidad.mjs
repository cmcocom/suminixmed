import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function configurarVisibilidadOperador() {
  console.log('🔧 Configurando visibilidad de módulos para rol OPERADOR...\n');

  try {
    // Módulos que DEBE ver el OPERADOR (según requerimiento)
    const modulosVisibles = [
      'ENTRADAS',           // ✅ Entradas - Gestión de entradas de inventario
      'SALIDAS',            // ✅ Salidas - Gestión de salidas de inventario
      'REPORTES',           // ✅ Reportes - Generación y visualización
      'REPORTE_INVENTARIO', // ✅ Inventario - Reporte de estado actual
      'REPORTE_SALIDAS_CLIENTE', // ✅ Salidas por Cliente
      'STOCK_FIJO',         // ✅ Stock Fijo - Gestión de stock fijo
      'CATALOGOS',          // ✅ Catálogos - Catálogos del sistema
      'PRODUCTOS',          // ✅ Productos (dentro de catálogos)
      'CATEGORIAS',         // ✅ Categorías (dentro de catálogos)
      'CLIENTES',           // ✅ Clientes (dentro de catálogos)
      'PROVEEDORES'         // ✅ Proveedores (dentro de catálogos)
    ];

    // Módulos que NO DEBE ver el OPERADOR
    const modulosOcultos = [
      'USUARIOS',           // ❌ Gestión de usuarios
      'AUDITORIA',          // ❌ Auditoría
      'CONFIGURACION',      // ❌ Configuración
      'ROLES',              // ❌ Roles y permisos
      'ENTIDADES',          // ❌ Entidades
      'UNIDADES_MEDIDA',    // ❌ Unidades de medida
      'ORDENES_COMPRA',     // ❌ Órdenes de compra
      'ALMACENES',          // ❌ Almacenes
      'INVENTARIO_FISICO',  // ❌ Inventario físico
      'AJUSTES_INVENTARIO', // ❌ Ajustes de inventario
      'RESPALDOS'           // ❌ Respaldos
    ];

    // 1. Obtener todos los módulos del sistema
    const todosLosModulos = await prisma.rbac_modules.findMany({
      select: { id: true, slug: true, nombre: true }
    });

    console.log(`📋 Total de módulos en el sistema: ${todosLosModulos.length}\n`);

    // 2. Verificar configuración actual
    const configActual = await prisma.rbac_role_modules.findMany({
      where: { role_id: 'role_operador' },
      include: { rbac_modules: true }
    });

    console.log('📊 Configuración actual del rol OPERADOR:');
    console.log(`   Visible: ${configActual.filter(c => c.visible).length} módulos`);
    console.log(`   Oculto: ${configActual.filter(c => !c.visible).length} módulos\n`);

    // 3. Actualizar visibilidad para cada módulo
    let actualizados = 0;
    let creados = 0;

    for (const modulo of todosLosModulos) {
      const debeSerVisible = modulosVisibles.includes(modulo.slug);
      
      // Verificar si ya existe la configuración
      const existente = await prisma.rbac_role_modules.findUnique({
        where: {
          role_id_module_id: {
            role_id: 'role_operador',
            module_id: modulo.id
          }
        }
      });

      if (existente) {
        // Actualizar si es diferente
        if (existente.visible !== debeSerVisible) {
          await prisma.rbac_role_modules.update({
            where: {
              role_id_module_id: {
                role_id: 'role_operador',
                module_id: modulo.id
              }
            },
            data: { visible: debeSerVisible }
          });
          
          console.log(`   ${debeSerVisible ? '✅' : '❌'} ${modulo.slug.padEnd(25)} - ${debeSerVisible ? 'VISIBLE' : 'OCULTO'} (actualizado)`);
          actualizados++;
        }
      } else {
        // Crear nueva configuración
        await prisma.rbac_role_modules.create({
          data: {
            role_id: 'role_operador',
            module_id: modulo.id,
            visible: debeSerVisible
          }
        });
        
        console.log(`   ${debeSerVisible ? '✅' : '❌'} ${modulo.slug.padEnd(25)} - ${debeSerVisible ? 'VISIBLE' : 'OCULTO'} (creado)`);
        creados++;
      }
    }

    console.log('\n📈 Resumen de cambios:');
    console.log(`   ✏️  Actualizados: ${actualizados}`);
    console.log(`   ➕ Creados: ${creados}`);

    // 4. Verificar resultado final
    const configFinal = await prisma.rbac_role_modules.findMany({
      where: { 
        role_id: 'role_operador',
        visible: true 
      },
      include: { rbac_modules: true }
    });

    console.log('\n✅ Módulos VISIBLES para rol OPERADOR:');
    configFinal.forEach(config => {
      console.log(`   📌 ${config.rbac_modules.slug} - ${config.rbac_modules.nombre}`);
    });

    console.log('\n✅ Configuración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

configurarVisibilidadOperador();

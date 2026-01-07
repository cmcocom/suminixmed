#!/usr/bin/env node

/**
 * Script para crear datos de prueba variados y probar el sistema completo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🎭 CREANDO DATOS DE PRUEBA PARA DEMOSTRACIÓN\n');

  try {
    // Obtener usuario existente
    const user = await prisma.user.findFirst({
      where: { activo: true }
    });

    if (!user) {
      console.log('❌ No hay usuarios activos para las pruebas');
      return;
    }

    // Establecer contexto de usuario
    await prisma.$executeRaw`SELECT set_audit_user(${user.id})`;

    // 1. Crear varios productos
    console.log('1️⃣ Creando productos variados...');
    
    const productos = [
      {
        id: `demo_prod_${Date.now()}_1`,
        nombre: 'Paracetamol 500mg',
        categoria: 'Medicamentos',
        cantidad: 200,
        precio: 12.50,
        cantidad_minima: 50
      },
      {
        id: `demo_prod_${Date.now()}_2`,
        nombre: 'Jeringa Desechable 5ml',
        categoria: 'Material Médico',
        cantidad: 500,
        precio: 2.80,
        cantidad_minima: 100
      },
      {
        id: `demo_prod_${Date.now()}_3`,
        nombre: 'Gasas Estériles Pack x10',
        categoria: 'Curación',
        cantidad: 75,
        precio: 8.30,
        cantidad_minima: 25
      }
    ];

    for (const prod of productos) {
      await prisma.inventario.create({
        data: {
          ...prod,
          descripcion: `Producto de demostración: ${prod.nombre}`,
          estado: 'disponible',
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ ${prod.nombre} creado`);
      
      // Pequeña pausa entre creaciones
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. Crear clientes
    console.log('\n2️⃣ Creando clientes...');
    
    const timestamp = Date.now();
    const clientes = [
      {
        id: `demo_client_${timestamp}_1`,
        nombre: 'Hospital General Norte',
        email: `compras_${timestamp}@hgn.com`,
        telefono: '555-1001'
      },
      {
        id: `demo_client_${timestamp}_2`,
        nombre: 'Clínica San Rafael',
        email: `admin_${timestamp}@clinicasr.com`,
        telefono: '555-1002'
      }
    ];

    for (const client of clientes) {
      await prisma.clientes.create({
        data: {
          ...client,
          activo: true,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ ${client.nombre} creado`);
    }

    // 3. Simular movimientos de stock (entradas)
    console.log('\n3️⃣ Simulando entradas de inventario...');
    
    const entrada1 = await prisma.entradas_inventario.create({
      data: {
        id: `demo_entrada_${Date.now()}_1`,
        motivo: 'Compra mensual de medicamentos',
        observaciones: 'Entrada de stock regular - Proveedor ABC Medical',
        total: 2500.00,
        estado: 'COMPLETADA',
        user_id: user.id,
        updatedAt: new Date()
      }
    });

    // Incrementar stock del primer producto
    await prisma.inventario.update({
      where: { id: productos[0].id },
      data: { cantidad: { increment: 100 } }
    });

    console.log(`   ✅ Entrada creada: ${entrada1.motivo}`);

    // 4. Simular salidas de inventario
    console.log('\n4️⃣ Simulando salidas de inventario...');
    
    const salida1 = await prisma.salidas_inventario.create({
      data: {
        id: `demo_salida_${Date.now()}_1`,
        motivo: 'Pedido Hospital General Norte',
        observaciones: 'Entrega de material médico según orden de compra #1234',
        total: 1200.00,
        estado: 'COMPLETADA',
        user_id: user.id,
        updatedAt: new Date()
      }
    });

    // Decrementar stock de varios productos
    await prisma.inventario.update({
      where: { id: productos[1].id },
      data: { cantidad: { decrement: 150 } }
    });

    await prisma.inventario.update({
      where: { id: productos[2].id },
      data: { cantidad: { decrement: 30 } }
    });

    console.log(`   ✅ Salida creada: ${salida1.motivo}`);

    // 5. Simular actualizaciones de precios
    console.log('\n5️⃣ Simulando cambios de precios...');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await prisma.inventario.update({
      where: { id: productos[0].id },
      data: { precio: 13.75 }
    });

    await prisma.inventario.update({
      where: { id: productos[1].id },
      data: { precio: 3.10 }
    });

    console.log('   ✅ Precios actualizados');

    // 6. Simular stock bajo (alertas)
    console.log('\n6️⃣ Simulando alertas de stock bajo...');
    
    await prisma.inventario.update({
      where: { id: productos[2].id },
      data: { 
        cantidad: 20, // Menor que cantidad_minima (25)
        cantidad_minima: 25 
      }
    });

    console.log('   ⚠️  Stock bajo simulado para Gasas Estériles');

    // 7. Simular eliminación de cliente inactivo
    console.log('\n7️⃣ Simulando desactivación de cliente...');
    
    await prisma.clientes.update({
      where: { id: clientes[1].id },
      data: { activo: false }
    });

    console.log('   ✅ Cliente desactivado');

    // 8. Verificar registros generados
    console.log('\n8️⃣ Verificando registros de auditoría...');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoRecords = await prisma.audit_log.findMany({
      where: {
        OR: [
          { record_id: { contains: 'demo_' } },
          { user_id: user.id }
        ],
        changed_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      },
      orderBy: { changed_at: 'desc' },
      select: {
        table_name: true,
        action: true,
        level: true,
        description: true,
        changed_at: true
      }
    });

    console.log(`   📊 Registros generados: ${demoRecords.length}`);

    // Agrupar por tipo de operación
    const operationStats = {};
    demoRecords.forEach(record => {
      const key = `${record.table_name}:${record.action}`;
      operationStats[key] = (operationStats[key] || 0) + 1;
    });

    console.log('\n   📋 Resumen de operaciones auditadas:');
    Object.entries(operationStats).forEach(([operation, count]) => {
      console.log(`      • ${operation}: ${count} eventos`);
    });

    // 9. Mostrar información para probar en la UI
    console.log('\n9️⃣ INFORMACIÓN PARA PROBAR EN LA UI:');
    console.log('=====================================');
    console.log('🌐 Servidor corriendo en: http://localhost:3001');
    console.log('📱 Página de auditoría: http://localhost:3001/dashboard/auditoria');
    console.log('');
    console.log('🔍 PRUEBAS RECOMENDADAS EN LA UI:');
    console.log('1. Filtrar por tabla "Inventario"');
    console.log('2. Filtrar por acción "UPDATE"');
    console.log('3. Buscar registros de "LOW_STOCK_ALERT"');
    console.log('4. Exportar CSV con filtros aplicados');
    console.log('5. Ver detalles de cambios (old_values vs new_values)');
    console.log('');
    console.log('📊 DATOS DE PRUEBA CREADOS:');
    console.log(`   • ${productos.length} productos en inventario`);
    console.log(`   • ${clientes.length} clientes`);
    console.log('   • 1 entrada de inventario');
    console.log('   • 1 salida de inventario');
    console.log('   • Cambios de precios');
    console.log('   • Alerta de stock bajo');
    console.log('   • Desactivación de cliente');

    console.log('\n✨ DATOS DE DEMOSTRACIÓN CREADOS EXITOSAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR CREANDO DATOS:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para limpiar datos de demostración
async function cleanupDemoData() {
  console.log('🧹 LIMPIANDO DATOS DE DEMOSTRACIÓN...');

  try {
    // Eliminar en orden correcto para evitar foreign key constraints
    await prisma.$executeRaw`DELETE FROM "Inventario" WHERE id LIKE 'demo_%'`;
    await prisma.clientes.deleteMany({ where: { id: { contains: 'demo_' } } });
    await prisma.entradas_inventario.deleteMany({ where: { id: { contains: 'demo_' } } });
    await prisma.salidas_inventario.deleteMany({ where: { id: { contains: 'demo_' } } });
    
    console.log('✅ Datos de demostración eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    await cleanupDemoData();
  } else {
    await createTestData();
  }
}

main().catch(console.error);
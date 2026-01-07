#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function generarResumen() {
  try {
    console.log('📊 RESUMEN DE DATOS ACTUALES - PRODUCCIÓN');
    console.log('='.repeat(60));
    console.log(`Fecha/Hora: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
    console.log('='.repeat(60));

    // Usuarios y Roles
    console.log('\n👥 USUARIOS Y AUTENTICACIÓN');
    const totalUsuarios = await prisma.user.count();
    const usuariosActivos = await prisma.user.count({ where: { activo: true } });
    const totalRoles = await prisma.rbac_roles.count();
    const totalPermisosAsignados = await prisma.rbac_permissions.count();
    const totalUserRoles = await prisma.rbac_user_roles.count();
    
    console.log(`   • Total usuarios: ${totalUsuarios}`);
    console.log(`   • Usuarios activos: ${usuariosActivos}`);
    console.log(`   • Total roles RBAC: ${totalRoles}`);
    console.log(`   • Total permisos definidos: ${totalPermisosAsignados}`);
    console.log(`   • Total asignaciones usuario-rol: ${totalUserRoles}`);

    // Clientes
    console.log('\n🏥 CLIENTES');
    const totalClientes = await prisma.clientes.count();
    const clientesActivos = await prisma.clientes.count({ where: { activo: true } });
    console.log(`   • Total clientes: ${totalClientes}`);
    console.log(`   • Clientes activos: ${clientesActivos}`);

    // Proveedores
    console.log('\n🚚 PROVEEDORES');
    const totalProveedores = await prisma.proveedores.count();
    const proveedoresActivos = await prisma.proveedores.count({ where: { activo: true } });
    console.log(`   • Total proveedores: ${totalProveedores}`);
    console.log(`   • Proveedores activos: ${proveedoresActivos}`);

    // Empleados
    console.log('\n👔 EMPLEADOS');
    const totalEmpleados = await prisma.empleados.count();
    const empleadosActivos = await prisma.empleados.count({ where: { activo: true } });
    console.log(`   • Total empleados: ${totalEmpleados}`);
    console.log(`   • Empleados activos: ${empleadosActivos}`);

    // Categorías e Inventario
    console.log('\n📦 INVENTARIO Y CATÁLOGOS');
    const totalCategorias = await prisma.categorias.count();
    const categoriasActivas = await prisma.categorias.count({ where: { activo: true } });
    const totalProductos = await prisma.inventario.count();
    const totalUnidadesMedida = await prisma.unidades_medida.count();
    const totalAlmacenes = await prisma.almacenes.count();
    
    console.log(`   • Total categorías: ${totalCategorias}`);
    console.log(`   • Categorías activas: ${categoriasActivas}`);
    console.log(`   • Total productos en inventario: ${totalProductos}`);
    console.log(`   • Total unidades de medida: ${totalUnidadesMedida}`);
    console.log(`   • Total almacenes: ${totalAlmacenes}`);

    // Entradas de Inventario
    console.log('\n📥 ENTRADAS DE INVENTARIO');
    const totalEntradas = await prisma.entradas_inventario.count();
    const totalPartidasEntrada = await prisma.partidas_entrada_inventario.count();
    const ultimaEntrada = await prisma.entradas_inventario.findFirst({
      orderBy: { fecha_creacion: 'desc' },
      select: { folio: true, fecha_creacion: true, total: true }
    });
    
    console.log(`   • Total entradas: ${totalEntradas}`);
    console.log(`   • Total partidas de entrada: ${totalPartidasEntrada}`);
    if (ultimaEntrada) {
      console.log(`   • Último folio entrada: ${ultimaEntrada.folio}`);
      console.log(`   • Fecha última entrada: ${new Date(ultimaEntrada.fecha_creacion).toLocaleString('es-MX')}`);
      console.log(`   • Total última entrada: $${ultimaEntrada.total.toFixed(2)}`);
    }

    // Salidas de Inventario
    console.log('\n📤 SALIDAS DE INVENTARIO');
    const totalSalidas = await prisma.salidas_inventario.count();
    const totalPartidasSalida = await prisma.partidas_salida_inventario.count();
    const ultimaSalida = await prisma.salidas_inventario.findFirst({
      orderBy: { fecha_creacion: 'desc' },
      select: { folio: true, fecha_creacion: true, total: true }
    });
    
    console.log(`   • Total salidas: ${totalSalidas}`);
    console.log(`   • Total partidas de salida: ${totalPartidasSalida}`);
    if (ultimaSalida) {
      console.log(`   • Último folio salida: ${ultimaSalida.folio}`);
      console.log(`   • Fecha última salida: ${new Date(ultimaSalida.fecha_creacion).toLocaleString('es-MX')}`);
      console.log(`   • Total última salida: $${ultimaSalida.total.toFixed(2)}`);
    }

    // Órdenes de Compra
    console.log('\n🛒 ÓRDENES DE COMPRA');
    const totalOrdenes = await prisma.ordenes_compra.count();
    const ordenesActivas = await prisma.ordenes_compra.count({ 
      where: { estado: { not: 'cancelada' } } 
    });
    console.log(`   • Total órdenes de compra: ${totalOrdenes}`);
    console.log(`   • Órdenes activas: ${ordenesActivas}`);

    // Inventarios Físicos
    console.log('\n📋 INVENTARIOS FÍSICOS');
    const totalInventariosFisicos = await prisma.inventarios_fisicos.count();
    const ultimoInventarioFisico = await prisma.inventarios_fisicos.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nombre: true, createdAt: true }
    });
    
    console.log(`   • Total inventarios físicos: ${totalInventariosFisicos}`);
    if (ultimoInventarioFisico) {
      console.log(`   • Último inventario físico: ${ultimoInventarioFisico.nombre}`);
      console.log(`   • Fecha: ${new Date(ultimoInventarioFisico.createdAt).toLocaleString('es-MX')}`);
    }

    // Activo Fijo
    console.log('\n🏢 ACTIVO FIJO');
    const totalActivoFijo = await prisma.ffijo.count();
    const activoFijoActivo = await prisma.ffijo.count({ where: { estado: 'activo' } });
    console.log(`   • Total activos fijos: ${totalActivoFijo}`);
    console.log(`   • Activos fijos activos (estado): ${activoFijoActivo}`);

    // Auditoría
    console.log('\n📝 AUDITORÍA Y SEGURIDAD');
    const totalAuditLogs = await prisma.audit_log.count();
    const totalSesionesActivas = await prisma.active_sessions.count();
    const totalBackupConfigs = await prisma.backup_config.count();
    const totalBackupHistory = await prisma.backup_history.count();
    
    console.log(`   • Total registros de auditoría: ${totalAuditLogs}`);
    console.log(`   • Sesiones activas actuales: ${totalSesionesActivas}`);
    console.log(`   • Configuraciones de backup: ${totalBackupConfigs}`);
    console.log(`   • Historial de backups: ${totalBackupHistory}`);

    // Dashboard y Configuraciones
    console.log('\n⚙️ CONFIGURACIONES');
    let totalModulosRBAC = 0;
    let totalModuleVisibility = 0;
    
    try {
      totalModulosRBAC = await prisma.rbac_modules.count();
      totalModuleVisibility = await prisma.rbac_module_visibility.count();
      console.log(`   • Módulos RBAC definidos: ${totalModulosRBAC}`);
      console.log(`   • Visibilidad de módulos: ${totalModuleVisibility}`);
    } catch (err) {
      console.log(`   • Error consultando configuraciones: ${err.message}`);
    }

    // Resumen de tablas
    console.log('\n📊 RESUMEN GENERAL DE TABLAS');
    const tablas = [
      { nombre: 'user', total: totalUsuarios },
      { nombre: 'clientes', total: totalClientes },
      { nombre: 'proveedores', total: totalProveedores },
      { nombre: 'empleados', total: totalEmpleados },
      { nombre: 'categorias', total: totalCategorias },
      { nombre: 'inventario', total: totalProductos },
      { nombre: 'entradas_inventario', total: totalEntradas },
      { nombre: 'partidas_entrada_inventario', total: totalPartidasEntrada },
      { nombre: 'salidas_inventario', total: totalSalidas },
      { nombre: 'partidas_salida_inventario', total: totalPartidasSalida },
      { nombre: 'ordenes_compra', total: totalOrdenes },
      { nombre: 'inventarios_fisicos', total: totalInventariosFisicos },
      { nombre: 'ffijo', total: totalActivoFijo },
      { nombre: 'audit_log', total: totalAuditLogs }
    ];

    tablas.forEach(tabla => {
      console.log(`   • ${tabla.nombre.padEnd(35)}: ${tabla.total.toLocaleString()}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Resumen generado exitosamente');
    console.log('='.repeat(60));

    // Generar archivo JSON con el resumen
    const resumen = {
      fecha: new Date().toISOString(),
      usuarios: { total: totalUsuarios, activos: usuariosActivos },
      clientes: { total: totalClientes, activos: clientesActivos },
      proveedores: { total: totalProveedores, activos: proveedoresActivos },
      empleados: { total: totalEmpleados, activos: empleadosActivos },
      categorias: { total: totalCategorias, activas: categoriasActivas },
      inventario: totalProductos,
      entradas: { total: totalEntradas, partidas: totalPartidasEntrada, ultimoFolio: ultimaEntrada?.folio },
      salidas: { total: totalSalidas, partidas: totalPartidasSalida, ultimoFolio: ultimaSalida?.folio },
      ordenesCompra: { total: totalOrdenes, activas: ordenesActivas },
      inventariosFisicos: totalInventariosFisicos,
      activoFijo: { total: totalActivoFijo, activos: activoFijoActivo },
      auditoria: totalAuditLogs,
      rbac: { roles: totalRoles, permisos: totalPermisosAsignados, asignaciones: totalUserRoles }
    };

    return resumen;

  } catch (error) {
    console.error('❌ Error generando resumen:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generarResumen()
  .then(resumen => {
    // Guardar resumen en archivo JSON
    import('fs').then(fs => {
      const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `resumen-datos-${fecha}.json`;
      fs.promises.writeFile(filename, JSON.stringify(resumen, null, 2))
        .then(() => console.log(`\n💾 Resumen guardado en: ${filename}`));
    });
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

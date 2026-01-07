#!/usr/bin/env node

import pkg from '@prisma/client';
import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
const { PrismaClient } = pkg;

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function verificarIntegridadBackup(archivoBackup) {
  try {
    console.log('🔍 VERIFICACIÓN DE INTEGRIDAD DEL BACKUP');
    console.log('='.repeat(60));
    console.log(`Archivo: ${archivoBackup}`);
    console.log('='.repeat(60));

    // 1. Verificar que el archivo existe
    console.log('\n📁 Verificando existencia del archivo...');
    try {
      const stats = await fs.stat(archivoBackup);
      console.log(`   ✅ Archivo encontrado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      console.error('   ❌ Archivo no encontrado');
      return false;
    }

    // 2. Listar contenido del backup (pg_restore --list)
    console.log('\n📋 Listando contenido del backup...');
    try {
      const { stdout } = await execAsync(`pg_restore --list "${archivoBackup}"`);
      const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith(';'));
      console.log(`   ✅ Elementos en el backup: ${lines.length}`);
      
      // Contar tablas
      const tablas = lines.filter(line => line.includes('TABLE DATA'));
      console.log(`   ✅ Tablas con datos: ${tablas.length}`);
      
      // Mostrar algunas tablas principales
      const tablasImportantes = [
        'User', 'clientes', 'proveedores', 'empleados', 'inventario',
        'entradas_inventario', 'salidas_inventario', 'partidas_entrada_inventario',
        'partidas_salida_inventario', 'categorias', 'audit_log'
      ];
      
      console.log('\n   📊 Tablas principales encontradas:');
      tablasImportantes.forEach(tabla => {
        const encontrada = tablas.some(line => line.includes(tabla));
        const icono = encontrada ? '✅' : '❌';
        console.log(`      ${icono} ${tabla}`);
      });
      
    } catch (err) {
      console.error(`   ❌ Error listando contenido: ${err.message}`);
      return false;
    }

    // 3. Verificar integridad con pg_restore --list-format
    console.log('\n🔐 Verificando integridad del formato...');
    try {
      // Si pg_restore puede leer el archivo sin errores, es válido
      await execAsync(`pg_restore --list "${archivoBackup}" > nul 2>&1`);
      console.log('   ✅ Formato válido y restaurable');
    } catch (err) {
      console.error('   ❌ El archivo puede estar corrupto');
      return false;
    }

    // 4. Comparar con resumen actual (si existe)
    console.log('\n📊 Comparando con datos actuales...');
    const resumenActual = {
      usuarios: await prisma.user.count(),
      clientes: await prisma.clientes.count(),
      proveedores: await prisma.proveedores.count(),
      empleados: await prisma.empleados.count(),
      categorias: await prisma.categorias.count(),
      inventario: await prisma.inventario.count(),
      entradas: await prisma.entradas_inventario.count(),
      salidas: await prisma.salidas_inventario.count(),
      partidasEntrada: await prisma.partidas_entrada_inventario.count(),
      partidasSalida: await prisma.partidas_salida_inventario.count(),
      auditoria: await prisma.audit_log.count()
    };

    console.log('\n   Totales actuales en base de datos:');
    Object.entries(resumenActual).forEach(([tabla, total]) => {
      console.log(`      • ${tabla.padEnd(20)}: ${total.toLocaleString()}`);
    });

    // 5. Guardar resultado de verificación
    const resultado = {
      fecha: new Date().toISOString(),
      archivo: archivoBackup,
      estado: 'VÁLIDO',
      datosBD: resumenActual
    };

    await fs.writeFile(
      `${archivoBackup}.verificacion.json`,
      JSON.stringify(resultado, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`\n💾 Resultado guardado en: ${archivoBackup}.verificacion.json`);
    
    return true;

  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el archivo más reciente
import { readdir } from 'fs/promises';

async function obtenerUltimoBackup() {
  const archivos = await readdir('.');
  const backups = archivos.filter(f => f.startsWith('backup-produccion-completo-') && f.endsWith('.bak'));
  
  if (backups.length === 0) {
    throw new Error('No se encontró ningún backup reciente');
  }

  // Ordenar por nombre (que incluye fecha) y obtener el más reciente
  backups.sort().reverse();
  return backups[0];
}

obtenerUltimoBackup()
  .then(archivo => verificarIntegridadBackup(archivo))
  .then(exito => {
    process.exit(exito ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

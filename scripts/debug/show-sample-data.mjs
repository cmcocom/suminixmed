#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showSampleData() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MUESTRA DE DATOS ACTUALES - ENTRADAS Y SALIDAS');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. CONTEO GENERAL
    console.log('📈 CONTEO GENERAL:\n');
    
    const totalSalidas = await prisma.salidas_inventario.count();
    const totalEntradas = await prisma.entradas_inventario.count();
    
    const salidasDespues = await prisma.salidas_inventario.count({
      where: {
        fecha_creacion: {
          gt: new Date('2025-10-17T03:20:00')
        }
      }
    });
    
    const entradasDespues = await prisma.entradas_inventario.count({
      where: {
        fecha_creacion: {
          gt: new Date('2025-10-17T03:20:00')
        }
      }
    });

    console.log(`   SALIDAS:  ${totalSalidas} total | ${salidasDespues} después de 03:20 AM`);
    console.log(`   ENTRADAS: ${totalEntradas} total | ${entradasDespues} después de 03:20 AM\n`);

    // 2. MUESTRA DE SALIDAS
    console.log('─'.repeat(80));
    console.log('🚪 ÚLTIMAS 10 SALIDAS (datos potencialmente cruzados):\n');
    
    const salidas = await prisma.salidas_inventario.findMany({
      take: 10,
      orderBy: {
        fecha_creacion: 'desc'
      },
      include: {
        tipos_salida: true
      }
    });

    if (salidas.length === 0) {
      console.log('   ⚠️  No hay salidas en la base de datos\n');
    } else {
      salidas.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ID: ${s.id.substring(0, 8)}...`);
        console.log(`      Folio: ${s.folio || 'N/A'}`);
        console.log(`      Tipo: ${s.tipos_salida?.nombre || 'N/A'}`);
        console.log(`      Fecha Salida: ${s.fecha_salida?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`      Fecha Creación: ${s.fecha_creacion?.toISOString() || 'N/A'}`);
        console.log(`      Observaciones: ${s.observaciones?.substring(0, 50) || 'N/A'}${s.observaciones?.length > 50 ? '...' : ''}`);
        console.log('');
      });
    }

    // 3. MUESTRA DE ENTRADAS
    console.log('─'.repeat(80));
    console.log('📥 ÚLTIMAS 10 ENTRADAS:\n');
    
    const entradas = await prisma.entradas_inventario.findMany({
      take: 10,
      orderBy: {
        fecha_creacion: 'desc'
      },
      include: {
        tipos_entrada: true,
        proveedores: true
      }
    });

    if (entradas.length === 0) {
      console.log('   ⚠️  No hay entradas en la base de datos\n');
    } else {
      entradas.forEach((e, idx) => {
        console.log(`   ${idx + 1}. ID: ${e.id.substring(0, 8)}...`);
        console.log(`      Folio: ${e.folio || 'N/A'}`);
        console.log(`      Tipo: ${e.tipos_entrada?.nombre || 'N/A'}`);
        console.log(`      Proveedor: ${e.proveedores?.nombre || 'N/A'}`);
        console.log(`      Fecha Entrada: ${e.fecha_entrada?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`      Fecha Creación: ${e.fecha_creacion?.toISOString() || 'N/A'}`);
        console.log(`      Observaciones: ${e.observaciones?.substring(0, 50) || 'N/A'}${e.observaciones?.length > 50 ? '...' : ''}`);
        console.log('');
      });
    }

    // 4. PARTIDAS DE LAS ÚLTIMAS 3 SALIDAS
    console.log('─'.repeat(80));
    console.log('📦 PARTIDAS DE LAS ÚLTIMAS 3 SALIDAS:\n');
    
    const ultimasSalidas = await prisma.salidas_inventario.findMany({
      take: 3,
      orderBy: {
        fecha_creacion: 'desc'
      },
      include: {
        partidas_salida_inventario: {
          include: {
            Inventario: true
          }
        }
      }
    });

    if (ultimasSalidas.length === 0) {
      console.log('   ⚠️  No hay salidas con partidas\n');
    } else {
      ultimasSalidas.forEach((salida, idx) => {
        console.log(`   📋 Salida ${idx + 1}: ${salida.folio || 'Sin folio'} (${salida.id.substring(0, 8)}...)`);
        if (salida.partidas_salida_inventario.length === 0) {
          console.log('      ⚠️  Sin partidas\n');
        } else {
          salida.partidas_salida_inventario.forEach((partida, pIdx) => {
            console.log(`      ${pIdx + 1}. ${partida.Inventario?.producto?.nombre || 'Producto desconocido'}`);
            console.log(`         Cantidad: ${partida.cantidad} | Precio: $${partida.precio_unitario} | Subtotal: $${partida.subtotal}`);
          });
          console.log('');
        }
      });
    }

    // 5. RANGO DE FECHAS
    console.log('─'.repeat(80));
    console.log('📅 RANGO DE FECHAS:\n');
    
    const primeraEntrada = await prisma.entradas_inventario.findFirst({
      orderBy: {
        fecha_creacion: 'asc'
      }
    });
    
    const ultimaEntrada = await prisma.entradas_inventario.findFirst({
      orderBy: {
        fecha_creacion: 'desc'
      }
    });
    
    const primeraSalida = await prisma.salidas_inventario.findFirst({
      orderBy: {
        fecha_creacion: 'asc'
      }
    });
    
    const ultimaSalida = await prisma.salidas_inventario.findFirst({
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    console.log(`   ENTRADAS:`);
    console.log(`      Primera: ${primeraEntrada?.fecha_creacion?.toISOString() || 'N/A'}`);
    console.log(`      Última:  ${ultimaEntrada?.fecha_creacion?.toISOString() || 'N/A'}`);
    console.log('');
    console.log(`   SALIDAS:`);
    console.log(`      Primera: ${primeraSalida?.fecha_creacion?.toISOString() || 'N/A'}`);
    console.log(`      Última:  ${ultimaSalida?.fecha_creacion?.toISOString() || 'N/A'}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Análisis completado');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

showSampleData();

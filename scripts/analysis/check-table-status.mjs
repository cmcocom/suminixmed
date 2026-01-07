#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTableStatus() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICANDO ESTADO ACTUAL DE LAS TABLAS');
  console.log('='.repeat(80) + '\n');

  try {
    const entradas = await prisma.entradas_inventario.count();
    const salidas = await prisma.salidas_inventario.count();
    const partidasEntrada = await prisma.partidas_entrada_inventario.count();
    const partidasSalida = await prisma.partidas_salida_inventario.count();

    console.log('📊 CONTEO ACTUAL:\n');
    console.log(`   entradas_inventario:           ${entradas}`);
    console.log(`   partidas_entrada_inventario:   ${partidasEntrada}`);
    console.log(`   salidas_inventario:            ${salidas}`);
    console.log(`   partidas_salida_inventario:    ${partidasSalida}`);
    console.log('');

    if (entradas === 0 && salidas === 0) {
      console.log('❌ LAS TABLAS ESTÁN VACÍAS - Se necesita restaurar desde backup de seguridad\n');
    } else {
      console.log('✅ Las tablas tienen datos\n');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStatus();

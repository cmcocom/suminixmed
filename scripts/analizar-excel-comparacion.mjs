#!/usr/bin/env node

/**
 * Comparación detallada de archivos Excel de inventario
 * Lee los dos Excel y genera reporte completo
 */

import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║           ANÁLISIS COMPARATIVO DE ARCHIVOS EXCEL                          ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

const archivoProduccion = join(__dirname, '..', 'tmp', 'inventario-produccion.xlsx');
const archivoActual = join(__dirname, '..', 'tmp', 'inventario-actual.xlsx');

// Leer archivos
console.log('📖 Leyendo archivos Excel...\n');
const wbProd = XLSX.readFile(archivoProduccion);
const wbActual = XLSX.readFile(archivoActual);

// Convertir a JSON
const sheetProd = wbProd.Sheets[wbProd.SheetNames[0]];
const sheetActual = wbActual.Sheets[wbActual.SheetNames[0]];

const datosProduccion = XLSX.utils.sheet_to_json(sheetProd);
const datosActual = XLSX.utils.sheet_to_json(sheetActual);

console.log(`   ✅ Archivo Producción: ${datosProduccion.length} productos`);
console.log(`   ✅ Archivo Actual:     ${datosActual.length} productos\n`);

// Crear mapas por ID
const mapaProd = new Map(datosProduccion.map(p => [p.ID, p]));
const mapaActual = new Map(datosActual.map(p => [p.ID, p]));

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                          ANÁLISIS DETALLADO');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

// 1. Verificar coincidencia de IDs
const idsProduccion = new Set(mapaProd.keys());
const idsActual = new Set(mapaActual.keys());

const soloEnProd = [...idsProduccion].filter(id => !idsActual.has(id));
const soloEnActual = [...idsActual].filter(id => !idsProduccion.has(id));
const enAmbos = [...idsProduccion].filter(id => idsActual.has(id));

console.log('1️⃣  COINCIDENCIA DE PRODUCTOS:\n');
console.log(`   Total en Producción:  ${idsProduccion.size}`);
console.log(`   Total en Actual:      ${idsActual.size}`);
console.log(`   En ambos:             ${enAmbos.length}`);
console.log(`   Solo en Producción:   ${soloEnProd.length}`);
console.log(`   Solo en Actual:       ${soloEnActual.length}\n`);

if (soloEnProd.length > 0) {
  console.log('   ⚠️  Productos SOLO en Producción:');
  soloEnProd.slice(0, 5).forEach(id => {
    const prod = mapaProd.get(id);
    console.log(`      • ${id}: ${prod.CLAVE} - ${prod.NOMBRE}`);
  });
  if (soloEnProd.length > 5) {
    console.log(`      ... y ${soloEnProd.length - 5} más\n`);
  }
}

if (soloEnActual.length > 0) {
  console.log('   ⚠️  Productos SOLO en Actual:');
  soloEnActual.slice(0, 5).forEach(id => {
    const prod = mapaActual.get(id);
    console.log(`      • ${id}: ${prod.CLAVE} - ${prod.NOMBRE}`);
  });
  if (soloEnActual.length > 5) {
    console.log(`      ... y ${soloEnActual.length - 5} más\n`);
  }
}

// 2. Comparar campos de productos en ambos
console.log('\n2️⃣  COMPARACIÓN DE DATOS:\n');

const diferencias = [];
const camposComparar = ['CANTIDAD', 'PRECIO', 'CANT_MINIMA', 'CANT_MAXIMA', 'PUNTO_REORDEN'];

for (const id of enAmbos) {
  const prodProd = mapaProd.get(id);
  const prodActual = mapaActual.get(id);
  
  const difs = {};
  let tieneDiferencias = false;
  
  for (const campo of camposComparar) {
    const valorProd = prodProd[campo];
    const valorActual = prodActual[campo];
    
    if (valorProd !== valorActual) {
      difs[campo] = { produccion: valorProd, actual: valorActual };
      tieneDiferencias = true;
    }
  }
  
  if (tieneDiferencias) {
    diferencias.push({
      id,
      clave: prodProd.CLAVE || prodActual.CLAVE,
      nombre: prodProd.NOMBRE,
      diferencias: difs
    });
  }
}

console.log(`   Productos con diferencias: ${diferencias.length}`);

if (diferencias.length > 0) {
  console.log('\n   📋 PRIMERAS 10 DIFERENCIAS ENCONTRADAS:\n');
  
  diferencias.slice(0, 10).forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.clave} - ${item.nombre}`);
    console.log(`      ID: ${item.id}`);
    
    for (const [campo, valores] of Object.entries(item.diferencias)) {
      const dif = valores.actual - valores.produccion;
      const simbolo = dif > 0 ? '+' : '';
      console.log(`      ${campo}: ${valores.produccion} → ${valores.actual} (${simbolo}${dif})`);
    }
    console.log('');
  });
  
  if (diferencias.length > 10) {
    console.log(`   ... y ${diferencias.length - 10} productos más con diferencias\n`);
  }
} else {
  console.log('   ✅ TODOS los productos tienen valores idénticos\n');
}

// 3. Estadísticas de cantidades
console.log('\n3️⃣  ESTADÍSTICAS DE CANTIDADES:\n');

const cantidadesProd = datosProduccion.map(p => p.CANTIDAD || 0);
const cantidadesActual = datosActual.map(p => p.CANTIDAD || 0);

const totalProd = cantidadesProd.reduce((sum, c) => sum + c, 0);
const totalActual = cantidadesActual.reduce((sum, c) => sum + c, 0);

const promProd = totalProd / cantidadesProd.length;
const promActual = totalActual / cantidadesActual.length;

const maxProd = Math.max(...cantidadesProd);
const maxActual = Math.max(...cantidadesActual);

const conStockProd = cantidadesProd.filter(c => c > 0).length;
const conStockActual = cantidadesActual.filter(c => c > 0).length;

console.log('   PRODUCCIÓN:');
console.log(`      Total unidades:        ${totalProd.toLocaleString()}`);
console.log(`      Promedio por producto: ${promProd.toFixed(2)}`);
console.log(`      Cantidad máxima:       ${maxProd.toLocaleString()}`);
console.log(`      Productos con stock:   ${conStockProd} (${(conStockProd/datosProduccion.length*100).toFixed(1)}%)\n`);

console.log('   ACTUAL:');
console.log(`      Total unidades:        ${totalActual.toLocaleString()}`);
console.log(`      Promedio por producto: ${promActual.toFixed(2)}`);
console.log(`      Cantidad máxima:       ${maxActual.toLocaleString()}`);
console.log(`      Productos con stock:   ${conStockActual} (${(conStockActual/datosActual.length*100).toFixed(1)}%)\n`);

console.log('   DIFERENCIA:');
const difTotal = totalActual - totalProd;
console.log(`      Total unidades:        ${difTotal >= 0 ? '+' : ''}${difTotal.toLocaleString()}`);
console.log(`      Productos con stock:   ${difTotal >= 0 ? '+' : ''}${conStockActual - conStockProd}\n`);

// 4. Top 10 productos con más stock
console.log('\n4️⃣  TOP 10 PRODUCTOS CON MÁS STOCK:\n');

const top10Prod = [...datosProduccion]
  .sort((a, b) => (b.CANTIDAD || 0) - (a.CANTIDAD || 0))
  .slice(0, 10);

const top10Actual = [...datosActual]
  .sort((a, b) => (b.CANTIDAD || 0) - (a.CANTIDAD || 0))
  .slice(0, 10);

console.log('   PRODUCCIÓN:');
top10Prod.forEach((p, i) => {
  console.log(`   ${i + 1}. ${(p.CANTIDAD || 0).toLocaleString().padStart(8)} - ${p.CLAVE} ${p.NOMBRE.substring(0, 50)}`);
});

console.log('\n   ACTUAL:');
top10Actual.forEach((p, i) => {
  console.log(`   ${i + 1}. ${(p.CANTIDAD || 0).toLocaleString().padStart(8)} - ${p.CLAVE} ${p.NOMBRE.substring(0, 50)}`);
});

// 5. Productos con diferencias en claves
console.log('\n\n5️⃣  VERIFICACIÓN DE CLAVES:\n');

const diferenciasClaves = [];
for (const id of enAmbos) {
  const prodProd = mapaProd.get(id);
  const prodActual = mapaActual.get(id);
  
  if (prodProd.CLAVE !== prodActual.CLAVE || prodProd.CLAVE2 !== prodActual.CLAVE2) {
    diferenciasClaves.push({
      id,
      nombre: prodProd.NOMBRE,
      clave_prod: prodProd.CLAVE,
      clave_actual: prodActual.CLAVE,
      clave2_prod: prodProd.CLAVE2,
      clave2_actual: prodActual.CLAVE2
    });
  }
}

if (diferenciasClaves.length > 0) {
  console.log(`   ⚠️  ${diferenciasClaves.length} productos con claves diferentes:\n`);
  diferenciasClaves.slice(0, 5).forEach(item => {
    console.log(`   • ${item.nombre}`);
    console.log(`     CLAVE:  "${item.clave_prod}" → "${item.clave_actual}"`);
    console.log(`     CLAVE2: "${item.clave2_prod}" → "${item.clave2_actual}"\n`);
  });
} else {
  console.log('   ✅ Todas las claves coinciden perfectamente\n');
}

// Resumen final
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                          RESUMEN EJECUTIVO');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

if (diferencias.length === 0 && soloEnProd.length === 0 && soloEnActual.length === 0 && diferenciasClaves.length === 0) {
  console.log('   🎉 ¡MIGRACIÓN 100% EXITOSA!');
  console.log('   ✅ Todos los productos coinciden perfectamente');
  console.log('   ✅ Todas las cantidades son idénticas');
  console.log('   ✅ Todos los precios coinciden');
  console.log('   ✅ Todas las claves están correctas\n');
} else {
  console.log('   ⚠️  Se encontraron algunas diferencias:\n');
  if (soloEnProd.length > 0) {
    console.log(`   • ${soloEnProd.length} productos solo en producción`);
  }
  if (soloEnActual.length > 0) {
    console.log(`   • ${soloEnActual.length} productos solo en actual`);
  }
  if (diferencias.length > 0) {
    console.log(`   • ${diferencias.length} productos con diferencias en cantidades/precios`);
  }
  if (diferenciasClaves.length > 0) {
    console.log(`   • ${diferenciasClaves.length} productos con claves diferentes`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════════════════════\n');

#!/usr/bin/env node

/**
 * Script de Limpieza Automatizada de Console.logs
 * 
 * Elimina logs de debug pero preserva console.error importantes
 * 
 * Uso:
 *   node cleanup-logs.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Patrones de logs a ELIMINAR (debug)
const DEBUG_PATTERNS = [
  /console\.log\('🔍.*?\);?\n?/g,
  /console\.log\('📝.*?\);?\n?/g,
  /console\.log\('✅.*?\);?\n?/g,
  /console\.log\('📦.*?\);?\n?/g,
  /console\.log\('📊.*?\);?\n?/g,
  /console\.log\('\[.*?\] Fetching.*?\);?\n?/g,
  /console\.log\('\[.*?\] Cargando.*?\);?\n?/g,
  /console\.log\('\[.*?\] Datos.*?\);?\n?/g,
  /console\.log\('=+'\);?\n?/g, // Separadores de debug
];

// Archivos a procesar
const FILES_TO_CLEAN = [
  'app/components/sidebar/utils/permissions.ts',
  'app/dashboard/salidas/hooks/useSalidasList.ts',
  'app/dashboard/reportes/salidas-cliente/page.tsx',
  'app/api/salidas/[id]/route.ts',
  'app/api/solicitudes/route.ts',
  'app/api/rbac/roles/[id]/modules/[moduleKey]/toggle/route.ts',
  'app/api/rbac/roles/[id]/modules/toggle-all/route.ts',
];

async function cleanFile(filePath) {
  try {
    console.log(`Limpiando ${filePath}...`);
    
    let content = readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Aplicar cada patrón
    for (const pattern of DEBUG_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, '');
      }
    }
    
    if (changes > 0) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ ${changes} logs eliminados`);
      return changes;
    } else {
      console.log(`  ⏭️  Sin cambios`);
      return 0;
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🧹 Iniciando limpieza de logs de debug...\n');
  
  let totalChanges = 0;
  
  for (const file of FILES_TO_CLEAN) {
    const changes = await cleanFile(file);
    totalChanges += changes;
  }
  
  console.log(`\n📊 Total: ${totalChanges} logs eliminados\n`);
  console.log('✅ Limpieza completada');
  console.log('\n⚠️  NOTA: Este script elimina solo patrones básicos.');
  console.log('   Revisa manualmente los archivos para console.error que deben permanecer.');
}

main().catch(console.error);

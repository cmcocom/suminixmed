#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

// Patrones de logs que queremos limpiar (NO críticos)
const LOG_PATTERNS = [
  // Logs de debug con emojis
  /console\.log\(['"`]🔍.*?\);?\s*$/gm,
  /console\.log\(['"`]✅.*?\);?\s*$/gm,
  /console\.log\(['"`]📊.*?\);?\s*$/gm,
  /console\.log\(['"`]📦.*?\);?\s*$/gm,
  /console\.log\(['"`]🔄.*?\);?\s*$/gm,
  /console\.log\(['"`]➕.*?\);?\s*$/gm,
  /console\.log\(['"`]🛒.*?\);?\s*$/gm,
  /console\.log\(['"`]🗑️.*?\);?\s*$/gm,
  /console\.log\(['"`]📝.*?\);?\s*$/gm,
  
  // Logs simples de debug sin información crítica
  /console\.log\(\`\[.*?\] .*?loaded.*?\`\);?\s*$/gm,
  /console\.log\(\`\[.*?\] .*?cargad.*?\`\);?\s*$/gm,
  /console\.log\(\`\[.*?\] .*?completad.*?\`\);?\s*$/gm,
  /console\.log\(\`\[.*?\] .*?iniciand.*?\`\);?\s*$/gm,
];

// Patrones de logs que queremos MANTENER (críticos)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn.*auth/i,
  /console\.warn.*security/i,
  /console\.warn.*backup/i,
  /logger\./,
  /Error.*:/,
  /\[AUTH\]/,
  /\[SECURITY\]/,
  /\[BACKUP\]/,
  /\[RBAC\]/,
];

// Función para verificar si un log debe mantenerse
function shouldKeepLog(line) {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

// Función para procesar un archivo
function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;

    // Aplicar cada patrón
    for (const pattern of LOG_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        // Verificar si algún match debe mantenerse
        const filteredMatches = matches.filter(match => !shouldKeepLog(match));
        if (filteredMatches.length > 0) {
          newContent = newContent.replace(pattern, '');
          changes += filteredMatches.length;
        }
      }
    }

    // Limpiar líneas vacías múltiples
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (changes > 0) {
      writeFileSync(filePath, newContent);
      console.log(`✅ ${filePath}: ${changes} logs limpiados`);
      return changes;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return 0;
  }
}

// Función recursiva para encontrar archivos
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Saltar directorios que no queremos procesar
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          continue;
        }
        files = files.concat(findFiles(fullPath, extensions));
      } else if (extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error leyendo directorio ${dir}:`, error.message);
  }
  
  return files;
}

// Función principal
function main() {
  const projectDir = process.cwd();
  console.log(`🧹 Iniciando limpieza de logs en: ${projectDir}`);

  // Buscar archivos TypeScript y JavaScript
  const files = findFiles(projectDir);
  console.log(`📁 Archivos encontrados: ${files.length}`);

  let totalChanges = 0;
  let processedFiles = 0;

  for (const file of files) {
    const changes = processFile(file);
    if (changes > 0) {
      processedFiles++;
      totalChanges += changes;
    }
  }

  console.log(`\n📊 Limpieza completada:`);
  console.log(`   📄 Archivos procesados: ${processedFiles}`);
  console.log(`   🧹 Logs eliminados: ${totalChanges}`);
  console.log(`   ✅ Logs críticos mantenidos`);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
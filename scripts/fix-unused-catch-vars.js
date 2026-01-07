#!/usr/bin/env node

/**
 * Script para corregir variables no utilizadas en catch blocks
 * Solo agrega _ si la variable realmente no se usa en el bloque
 */

const fs = require('fs');
const path = require('path');

function shouldRename(fileContent, catchVarName, startPos) {
  // Encontrar el cierre del catch block
  let braceCount = 0;
  let inCatch = false;
  let catchContent = '';
  
  for (let i = startPos; i < fileContent.length; i++) {
    const char = fileContent[i];
    
    if (char === '{') {
      braceCount++;
      inCatch = true;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && inCatch) {
        catchContent = fileContent.substring(startPos, i);
        break;
      }
    }
  }
  
  // Buscar si la variable se usa en el bloque (excluyendo la declaración)
  const usagePattern = new RegExp(`\\b${catchVarName}\\b`, 'g');
  const matches = catchContent.match(usagePattern) || [];
  
  // Si aparece más de 1 vez (la declaración es 1), entonces se usa
  return matches.length <= 1;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Patrones de catch a buscar
  const catchPatterns = [
    { regex: /catch\s*\(\s*error\s*\)\s*{/g, varName: 'error' },
    { regex: /catch\s*\(\s*err\s*\)\s*{/g, varName: 'err' },
    { regex: /catch\s*\(\s*e\s*\)\s*{/g, varName: 'e' },
  ];
  
  catchPatterns.forEach(({ regex, varName }) => {
    let match;
    const newContent = content;
    const replacements = [];
    
    while ((match = regex.exec(content)) !== null) {
      const matchPos = match.index;
      
      if (shouldRename(content, varName, matchPos)) {
        replacements.push({
          start: matchPos,
          end: matchPos + match[0].length,
          original: match[0],
          replacement: match[0].replace(varName, `_${varName}`)
        });
      }
    }
    
    // Aplicar reemplazos de atrás hacia adelante para no afectar índices
    replacements.reverse().forEach(rep => {
      content = content.substring(0, rep.start) + rep.replacement + content.substring(rep.end);
      modified = true;
    });
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Procesar archivos
const dirsToProcess = ['app', 'lib'];
let totalFixed = 0;

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (processFile(filePath)) {
        totalFixed++;
      }
    }
  });
}

console.log('🔍 Buscando catch blocks con variables no utilizadas...\n');

dirsToProcess.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log(`\n✅ Procesados ${totalFixed} archivos`);

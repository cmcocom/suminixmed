/**
 * Script de verificación completa del código
 * Ejecuta todas las verificaciones necesarias antes de commit o deploy
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// Función para ejecutar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Verificaciones a ejecutar
const checks = [
  {
    name: 'ESLint (Errores y Warnings)',
    description: 'Verificando calidad del código con ESLint...',
    command: 'npm',
    args: ['run', 'lint:eslint'],
    critical: true
  },
  {
    name: 'TypeScript Type Checking',
    description: 'Verificando tipos de TypeScript...',
    command: 'npm',
    args: ['run', 'lint:types'],
    critical: true
  },
  {
    name: 'Next.js Build',
    description: 'Verificando que el proyecto compila correctamente...',
    command: 'npm',
    args: ['run', 'build'],
    critical: true
  },
  {
    name: 'Prisma Schema Validation',
    description: 'Validando esquema de Prisma...',
    command: 'npx',
    args: ['prisma', 'validate'],
    critical: false,
    skip: !existsSync('./prisma/schema.prisma')
  }
];

async function runChecks() {
  console.log('🔍 Iniciando verificación completa del código...\n');

  let totalChecks = 0;
  let passedChecks = 0;
  let criticalFailed = false;

  for (const check of checks) {
    if (check.skip) {
      log.info(`Saltando: ${check.name} (archivo no encontrado)`);
      continue;
    }

    totalChecks++;
    
    console.log(`\n📋 ${check.description}`);
    
    try {
      await runCommand(check.command, check.args);
      log.success(`${check.name} - PASÓ`);
      passedChecks++;
    } catch {
      if (check.critical) {
        log.error(`${check.name} - FALLÓ (CRÍTICO)`);
        criticalFailed = true;
      } else {
        log.warning(`${check.name} - FALLÓ (NO CRÍTICO)`);
      }
    }
  }

  // Reporte final
  console.log('\n' + '='.repeat(50));
  console.log('📊 REPORTE FINAL');
  console.log('='.repeat(50));
  
  if (criticalFailed) {
    log.error(`Verificaciones críticas fallaron. El código no está listo.`);
    console.log(`\nVerificaciones pasadas: ${passedChecks}/${totalChecks}`);
    console.log('\nAcciones recomendadas:');
    console.log('1. Ejecuta npm run lint:fix para corregir errores automáticamente');
    console.log('2. Revisa y corrige errores de TypeScript manualmente');
    console.log('3. Ejecuta npm run build para verificar la compilación');
    process.exit(1);
  } else {
    log.success(`Todas las verificaciones críticas pasaron exitosamente!`);
    console.log(`\nVerificaciones pasadas: ${passedChecks}/${totalChecks}`);
    console.log('\n🚀 El código está listo para commit/deploy');
  }

  // Verificaciones adicionales (no bloquean)
  console.log('\n' + '-'.repeat(30));
  console.log('🔍 Verificaciones adicionales:');
  console.log('-'.repeat(30));

  // Verificar archivos grandes
  try {
    const { stdout } = await import('child_process').then(cp => 
      new Promise((resolve, reject) => {
        cp.exec('find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./dist/*"', 
          (error, stdout) => {
            if (error && error.code !== 1) reject(error); // code 1 = no files found
            else resolve({ stdout });
          }
        );
      })
    );
    
    if (stdout.trim()) {
      log.warning('Archivos grandes encontrados (>1MB):');
      console.log(stdout);
    } else {
      log.success('No se encontraron archivos grandes');
    }
  } catch {
    log.info('No se pudo verificar archivos grandes (puede ser Windows)');
  }

  // Verificar console.log en archivos principales
  try {
    const { stdout } = await import('child_process').then(cp => 
      new Promise((resolve) => {
        cp.exec('grep -r "console\\.log" app/ lib/ hooks/ --include="*.ts" --include="*.tsx" || true', 
          (_error, stdout) => {
            resolve({ stdout });
          }
        );
      })
    );
    
    if (stdout.trim()) {
      log.warning('console.log encontrado en código de producción:');
      console.log(stdout);
    } else {
      log.success('No se encontraron console.log en código de producción');
    }
  } catch {
    log.info('No se pudo verificar console.log (puede ser Windows)');
  }
}

// Ejecutar verificaciones
runChecks().catch((error) => {
  log.error(`Error ejecutando verificaciones: ${error.message}`);
  process.exit(1);
});
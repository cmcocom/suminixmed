#!/usr/bin/env node

/**
 * ANÁLISIS RÁPIDO DE DIFERENCIAS
 * Identifica las diferencias principales entre esquemas
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 [ANÁLISIS RÁPIDO] Diferencias de esquema...\n');

// 1. Obtener esquema actual
console.log('📋 Obteniendo esquema actual...');
try {
    const esquemaActual = execSync('pg_dump -h localhost -U postgres -d suminix --schema-only --no-owner --no-privileges', { 
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'inherit']
    });
    
    fs.writeFileSync('esquema-actual.sql', esquemaActual);
    console.log('✅ Esquema actual guardado: esquema-actual.sql');
} catch (error) {
    console.error('❌ Error obteniendo esquema actual:', error.message);
}

// 2. Crear base temporal
console.log('\n🔧 Creando base temporal...');
try {
    execSync('dropdb -h localhost -U postgres temp_esquema --if-exists', { stdio: 'inherit' });
    execSync('createdb -h localhost -U postgres temp_esquema', { stdio: 'inherit' });
    console.log('✅ Base temporal creada');
} catch (error) {
    console.error('❌ Error creando base temporal:', error.message);
}

// 3. Restaurar respaldo en temporal
console.log('\n📦 Restaurando respaldo en temporal...');
try {
    execSync('pg_restore -h localhost -U postgres -d temp_esquema --clean --if-exists backups/suminix-2025-11-04T13-22-20-929Z.backup', { 
        stdio: ['inherit', 'pipe', 'inherit']
    });
    console.log('✅ Respaldo restaurado en temporal');
} catch (error) {
    console.log('⚠️ Respaldo restaurado con advertencias (normal)');
}

// 4. Obtener esquema del respaldo
console.log('\n📋 Obteniendo esquema del respaldo...');
try {
    const esquemaRespaldo = execSync('pg_dump -h localhost -U postgres -d temp_esquema --schema-only --no-owner --no-privileges', { 
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'inherit']
    });
    
    fs.writeFileSync('esquema-respaldo.sql', esquemaRespaldo);
    console.log('✅ Esquema respaldo guardado: esquema-respaldo.sql');
} catch (error) {
    console.error('❌ Error obteniendo esquema respaldo:', error.message);
}

// 5. Limpiar
console.log('\n🗑️ Limpiando temporal...');
try {
    execSync('dropdb -h localhost -U postgres temp_esquema', { stdio: 'inherit' });
    console.log('✅ Temporal eliminada');
} catch (error) {
    console.error('⚠️ Error eliminando temporal:', error.message);
}

console.log('\n🎉 [COMPLETADO] Archivos generados:');
console.log('   - esquema-actual.sql');
console.log('   - esquema-respaldo.sql');
console.log('\nAhora puedes comparar manualmente los archivos.');
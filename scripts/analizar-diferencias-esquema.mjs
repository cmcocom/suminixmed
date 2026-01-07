#!/usr/bin/env node

/**
 * ANÁLISIS DE DIFERENCIAS DE ESQUEMA
 * Compara el esquema actual de suminix vs el respaldo del 4 nov
 * Para adaptar datos sin conflictos
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 [ESQUEMA] Analizando diferencias entre base actual y respaldo...\n');

/**
 * Obtener esquema de la base actual
 */
async function obtenerEsquemaActual() {
    try {
        console.log('📋 Obteniendo esquema actual de suminix...');
        
        const comando = `pg_dump -h localhost -U postgres -d suminix --schema-only --no-owner --no-privileges`;
        const esquemaActual = execSync(comando, { 
            encoding: 'utf8',
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        fs.writeFileSync('esquema-actual-suminix.sql', esquemaActual);
        console.log('✅ Esquema actual guardado en: esquema-actual-suminix.sql');
        
        return esquemaActual;
    } catch (error) {
        console.error('❌ Error obteniendo esquema actual:', error.message);
        throw error;
    }
}

/**
 * Obtener esquema del respaldo
 */
async function obtenerEsquemaRespaldo() {
    try {
        console.log('📋 Obteniendo esquema del respaldo nov 4...');
        
        // Crear base temporal para extraer esquema del respaldo
        console.log('🔧 Creando base temporal...');
        try {
            execSync('createdb -h localhost -U postgres suminix_esquema_temp', { 
                stdio: ['inherit', 'pipe', 'pipe'] 
            });
        } catch {
            // Si ya existe, la eliminamos y creamos nueva
            console.log('🗑️ Eliminando base temporal existente...');
            execSync('dropdb -h localhost -U postgres suminix_esquema_temp --if-exists', { 
                stdio: ['inherit', 'pipe', 'pipe'] 
            });
            execSync('createdb -h localhost -U postgres suminix_esquema_temp', { 
                stdio: ['inherit', 'pipe', 'pipe'] 
            });
        }
        
        console.log('📦 Restaurando respaldo en base temporal...');
        const comandoRestaurar = `pg_restore -h localhost -U postgres -d suminix_esquema_temp --clean --if-exists backups/suminix-2025-11-04T13-22-20-929Z.backup`;
        execSync(comandoRestaurar, { 
            stdio: ['inherit', 'pipe', 'pipe'] 
        });
        
        console.log('📋 Extrayendo esquema del respaldo...');
        const comandoEsquema = `pg_dump -h localhost -U postgres -d suminix_esquema_temp --schema-only --no-owner --no-privileges`;
        const esquemaRespaldo = execSync(comandoEsquema, { 
            encoding: 'utf8',
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        fs.writeFileSync('esquema-respaldo-nov4.sql', esquemaRespaldo);
        console.log('✅ Esquema respaldo guardado en: esquema-respaldo-nov4.sql');
        
        // Limpiar base temporal
        console.log('🗑️ Limpiando base temporal...');
        execSync('dropdb -h localhost -U postgres suminix_esquema_temp', { 
            stdio: ['inherit', 'pipe', 'pipe'] 
        });
        
        return esquemaRespaldo;
    } catch (error) {
        console.error('❌ Error obteniendo esquema respaldo:', error.message);
        throw error;
    }
}

/**
 * Analizar diferencias críticas
 */
function analizarDiferencias(esquemaActual, esquemaRespaldo) {
    console.log('\n🔍 [ANÁLISIS] Identificando diferencias críticas...\n');
    
    const diferencias = {
        columnasExtras: [],
        columnasFaltantes: [],
        tiposDiferentes: [],
        tablasSoloEnRespaldo: [],
        tablasSoloEnActual: []
    };
    
    // Extraer definiciones de tablas
    const tablasActuales = extraerTablas(esquemaActual);
    const tablasRespaldo = extraerTablas(esquemaRespaldo);
    
    // Tablas que están solo en respaldo o solo en actual
    const nombresActuales = Object.keys(tablasActuales);
    const nombresRespaldo = Object.keys(tablasRespaldo);
    
    diferencias.tablasSoloEnRespaldo = nombresRespaldo.filter(t => !nombresActuales.includes(t));
    diferencias.tablasSoloEnActual = nombresActuales.filter(t => !nombresRespaldo.includes(t));
    
    // Analizar tablas comunes
    const tablasComunes = nombresActuales.filter(t => nombresRespaldo.includes(t));
    
    console.log(`📊 Tablas en análisis: ${tablasComunes.length}`);
    console.log(`📊 Solo en respaldo: ${diferencias.tablasSoloEnRespaldo.length}`);
    console.log(`📊 Solo en actual: ${diferencias.tablasSoloEnActual.length}\n`);
    
    for (const tabla of tablasComunes) {
        const columnasActuales = tablasActuales[tabla];
        const columnasRespaldo = tablasRespaldo[tabla];
        
        if (!columnasActuales || !columnasRespaldo) continue;
        
        // Columnas que están en respaldo pero no en actual
        const extrasEnRespaldo = Object.keys(columnasRespaldo).filter(
            col => !columnasActuales.hasOwnProperty(col)
        );
        
        // Columnas que están en actual pero no en respaldo  
        const faltantesEnRespaldo = Object.keys(columnasActuales).filter(
            col => !columnasRespaldo.hasOwnProperty(col)
        );
        
        if (extrasEnRespaldo.length > 0) {
            diferencias.columnasExtras.push({
                tabla,
                columnas: extrasEnRespaldo
            });
        }
        
        if (faltantesEnRespaldo.length > 0) {
            diferencias.columnasFaltantes.push({
                tabla,
                columnas: faltantesEnRespaldo
            });
        }
    }
    
    return diferencias;
}

/**
 * Extraer definiciones de tablas del SQL
 */
function extraerTablas(sql) {
    const tablas = {};
    const lineas = sql.split('\n');
    let tablaActual = null;
    let enDefinicionTabla = false;
    
    for (const linea of lineas) {
        const trimmed = linea.trim();
        
        // Detectar inicio de tabla
        const matchTabla = trimmed.match(/^CREATE TABLE (?:public\.)?([a-zA-Z_"]+) \(/);
        if (matchTabla) {
            tablaActual = matchTabla[1].replace(/"/g, '');
            tablas[tablaActual] = {};
            enDefinicionTabla = true;
            continue;
        }
        
        // Detectar fin de tabla
        if (trimmed === ');' && enDefinicionTabla) {
            enDefinicionTabla = false;
            tablaActual = null;
            continue;
        }
        
        // Extraer columnas
        if (enDefinicionTabla && tablaActual && trimmed && !trimmed.startsWith('CONSTRAINT') && !trimmed.startsWith('UNIQUE') && !trimmed.startsWith('CHECK')) {
            const matchColumna = trimmed.match(/^([a-zA-Z_"]+)\s+([a-zA-Z_\(\)0-9,\s]+?)(?:\s+(?:NOT\s+NULL|DEFAULT|REFERENCES).*)?[,]?$/);
            if (matchColumna) {
                const nombreCol = matchColumna[1].replace(/"/g, '');
                const tipoCol = matchColumna[2].trim();
                tablas[tablaActual][nombreCol] = tipoCol;
            }
        }
    }
    
    return tablas;
}

/**
 * Generar reporte de diferencias
 */
function generarReporte(diferencias) {
    console.log('📝 [REPORTE] Generando análisis de diferencias...\n');
    
    let reporte = `# ANÁLISIS DE DIFERENCIAS DE ESQUEMA
# Fecha: ${new Date().toISOString()}
# Base actual: suminix (desarrollo)  
# Respaldo: suminix-2025-11-04T13-22-20-929Z.backup

## RESUMEN EJECUTIVO

`;

    // Tablas solo en respaldo
    if (diferencias.tablasSoloEnRespaldo.length > 0) {
        reporte += `### ⚠️ TABLAS SOLO EN RESPALDO (${diferencias.tablasSoloEnRespaldo.length})\n`;
        reporte += `Estas tablas existen en el respaldo pero NO en la base actual:\n\n`;
        diferencias.tablasSoloEnRespaldo.forEach(tabla => {
            reporte += `- ${tabla}\n`;
        });
        reporte += `\n📋 **ACCIÓN**: Evaluar si necesitamos crear estas tablas o son obsoletas.\n\n`;
    }

    // Tablas solo en actual
    if (diferencias.tablasSoloEnActual.length > 0) {
        reporte += `### ✅ TABLAS SOLO EN ACTUAL (${diferencias.tablasSoloEnActual.length})\n`;
        reporte += `Estas tablas son nuevas en desarrollo (probablemente RBAC V2):\n\n`;
        diferencias.tablasSoloEnActual.forEach(tabla => {
            reporte += `- ${tabla}\n`;
        });
        reporte += `\n📋 **ACCIÓN**: MANTENER - No migrar datos de estas tablas.\n\n`;
    }

    // Columnas extras en respaldo
    if (diferencias.columnasExtras.length > 0) {
        reporte += `### 🔧 COLUMNAS EXTRAS EN RESPALDO (${diferencias.columnasExtras.length} tablas)\n`;
        reporte += `Columnas que existen en respaldo pero NO en actual:\n\n`;
        diferencias.columnasExtras.forEach(({ tabla, columnas }) => {
            reporte += `**${tabla}**:\n`;
            columnas.forEach(col => {
                reporte += `  - ${col}\n`;
            });
            reporte += `\n`;
        });
        reporte += `📋 **ACCIÓN**: OMITIR estas columnas en la migración.\n\n`;
    }

    // Columnas faltantes en respaldo
    if (diferencias.columnasFaltantes.length > 0) {
        reporte += `### ➕ COLUMNAS NUEVAS EN ACTUAL (${diferencias.columnasFaltantes.length} tablas)\n`;
        reporte += `Columnas que NO existen en respaldo pero SÍ en actual:\n\n`;
        diferencias.columnasFaltantes.forEach(({ tabla, columnas }) => {
            reporte += `**${tabla}**:\n`;
            columnas.forEach(col => {
                reporte += `  - ${col}\n`;
            });
            reporte += `\n`;
        });
        reporte += `📋 **ACCIÓN**: Usar valores DEFAULT o NULL para estas columnas.\n\n`;
    }

    // Escribir reporte
    fs.writeFileSync('reporte-diferencias-esquema.md', reporte);
    console.log('✅ Reporte generado: reporte-diferencias-esquema.md\n');
    
    // Mostrar resumen en consola
    console.log('📊 [RESUMEN]');
    console.log(`   Tablas solo en respaldo: ${diferencias.tablasSoloEnRespaldo.length}`);
    console.log(`   Tablas solo en actual: ${diferencias.tablasSoloEnActual.length}`);
    console.log(`   Tablas con columnas extras: ${diferencias.columnasExtras.length}`);
    console.log(`   Tablas con columnas faltantes: ${diferencias.columnasFaltantes.length}\n`);
    
    return diferencias;
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🚀 [INICIO] Análisis de diferencias de esquema\n');
        
        // 1. Obtener esquemas
        const esquemaActual = await obtenerEsquemaActual();
        const esquemaRespaldo = await obtenerEsquemaRespaldo();
        
        // 2. Analizar diferencias
        const diferencias = analizarDiferencias(esquemaActual, esquemaRespaldo);
        
        // 3. Generar reporte
        generarReporte(diferencias);
        
        console.log('🎉 [COMPLETADO] Análisis de diferencias terminado');
        console.log('📁 Archivos generados:');
        console.log('   - esquema-actual-suminix.sql');
        console.log('   - esquema-respaldo-nov4.sql');
        console.log('   - reporte-diferencias-esquema.md');
        
    } catch (error) {
        console.error('💥 [ERROR]', error.message);
        process.exit(1);
    }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
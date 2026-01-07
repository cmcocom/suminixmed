#!/usr/bin/env node

/**
 * MIGRACIÓN DE ADAPTACIÓN INTELIGENTE
 * Extrae datos del respaldo y los adapta al esquema actual
 * Preserva RBAC V2 y solo migra datos operacionales
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔄 [MIGRACIÓN ADAPTIVA] Iniciando migración inteligente...\n');

/**
 * CONFIGURACIÓN DE MIGRACIÓN
 */
const CONFIG = {
    // Tablas a migrar (solo datos operacionales)
    tablasMigrar: [
        'categorias',
        'unidades_medida', 
        'proveedores',
        'clientes',
        'almacenes',
        'ubicaciones_almacen',
        'Inventario',
        'entradas_inventario',
        'partidas_entrada_inventario',
        'salidas_inventario', 
        'partidas_salida_inventario',
        'inventario_almacen',
        'tipos_entrada',
        'tipos_salida',
        'empleados',
        'config_folios',
        'configuracion_salidas'
    ],
    
    // Tablas a NO migrar (mantener RBAC V2)
    tablasExcluir: [
        'users',
        'rbac_roles',
        'rbac_modules', 
        'rbac_permissions',
        'rbac_role_permissions',
        'rbac_user_roles',
        'sidebar_modules',
        'active_sessions',
        'audit_log',
        'backup_config'
    ],
    
    // Mapeos de columnas (respaldo -> actual)
    mapeoColumnas: {
        'unidades_medida': {
            'omitir': ['abreviatura'], // Existe en respaldo pero no en actual
            'mapear': {
                'nombre': 'nombre',
                'descripcion': 'descripcion', 
                'activo': 'activo',
                'clave': 'clave'
            },
            'defaults': {
                // Columnas que existen en actual pero no en respaldo
            }
        }
    }
};

/**
 * Crear base temporal para extracción
 */
async function crearBaseTemporal() {
    console.log('🔧 Creando base temporal para extracción...');
    
    try {
        // Eliminar si existe
        execSync('dropdb -h localhost -U postgres temp_migracion --if-exists', { 
            stdio: ['inherit', 'pipe', 'pipe'] 
        });
        
        // Crear nueva
        execSync('createdb -h localhost -U postgres temp_migracion', { 
            stdio: ['inherit', 'pipe', 'pipe'] 
        });
        
        // Restaurar respaldo
        console.log('📦 Restaurando respaldo en temporal...');
        execSync('pg_restore -h localhost -U postgres -d temp_migracion --clean --if-exists backups/suminix-2025-11-04T13-22-20-929Z.backup', { 
            stdio: ['inherit', 'pipe', 'pipe'] 
        });
        
        console.log('✅ Base temporal lista');
        return true;
    } catch (error) {
        console.error('❌ Error creando base temporal:', error.message);
        return false;
    }
}

/**
 * Generar queries de migración adaptadas
 */
function generarQueriesMigracion() {
    console.log('📝 Generando queries de migración adaptadas...\n');
    
    const queries = [];
    
    for (const tabla of CONFIG.tablasMigrar) {
        console.log(`🔍 Procesando tabla: ${tabla}`);
        
        // Verificar si hay mapeo especial
        const mapeo = CONFIG.mapeoColumnas[tabla];
        
        if (mapeo) {
            // Tabla con mapeo especial
            const columnasSelect = [];
            const columnasInsert = [];
            
            for (const [colRespaldo, colActual] of Object.entries(mapeo.mapear)) {
                columnasSelect.push(colRespaldo);
                columnasInsert.push(colActual);
            }
            
            // Agregar defaults si hay columnas nuevas en actual
            for (const [col, valor] of Object.entries(mapeo.defaults || {})) {
                columnasSelect.push(`'${valor}' as ${col}`);
                columnasInsert.push(col);
            }
            
            const querySelect = `SELECT ${columnasSelect.join(', ')} FROM ${tabla}`;
            const queryInsert = `INSERT INTO ${tabla} (${columnasInsert.join(', ')})`;
            
            queries.push({
                tabla,
                tipo: 'MAPEADA',
                query: `${queryInsert} (${querySelect});`
            });
            
            console.log(`   ✅ Mapeada - ${columnasSelect.length} columnas`);
        } else {
            // Tabla sin mapeo especial - migración directa
            queries.push({
                tabla,
                tipo: 'DIRECTA', 
                query: `INSERT INTO ${tabla} SELECT * FROM temp_${tabla};`
            });
            
            console.log(`   ✅ Directa - migración completa`);
        }
    }
    
    return queries;
}

/**
 * Crear tablas temporales para migración
 */
async function crearTablasTemporales() {
    console.log('\n🔗 Creando tablas temporales en suminix...');
    
    for (const tabla of CONFIG.tablasMigrar) {
        try {
            const query = `
                CREATE TEMP TABLE temp_${tabla} AS 
                SELECT * FROM dblink(
                    'host=localhost port=5432 dbname=temp_migracion user=postgres',
                    'SELECT * FROM ${tabla}'
                ) AS t(${await obtenerEstructuraTabla(tabla)});
            `;
            
            console.log(`   📋 Creando temp_${tabla}...`);
            // Esta query se ejecutará después en el script SQL
        } catch (error) {
            console.log(`   ⚠️ Error con ${tabla}: ${error.message}`);
        }
    }
    
    console.log('✅ Preparación de tablas temporales lista');
}

/**
 * Obtener estructura de tabla
 */
async function obtenerEstructuraTabla(tabla) {
    try {
        const resultado = execSync(`psql -h localhost -U postgres -d temp_migracion -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tabla}' ORDER BY ordinal_position;"`, {
            encoding: 'utf8',
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        const lineas = resultado.trim().split('\n');
        return lineas.map(linea => {
            const [nombre, tipo] = linea.trim().split(' | ');
            return `${nombre} ${tipo}`;
        }).join(', ');
    } catch (error) {
        console.log(`⚠️ No se pudo obtener estructura de ${tabla}`);
        return '*'; // Fallback
    }
}

/**
 * Generar script SQL completo
 */
function generarScriptSQL(queries) {
    console.log('\n📄 Generando script SQL de migración...');
    
    let script = `-- MIGRACIÓN ADAPTIVA - ${new Date().toISOString()}
-- Migra datos del respaldo nov 4 al esquema actual
-- Preserva RBAC V2 y sistema de permisos

\\echo 'Iniciando migración adaptiva...'

-- Habilitar dblink si no está disponible
CREATE EXTENSION IF NOT EXISTS dblink;

-- Comenzar transacción
BEGIN;

\\echo 'Conectando a base temporal...'

-- Verificar conexión a base temporal
SELECT dblink_connect('temp_conn', 'host=localhost port=5432 dbname=temp_migracion user=postgres password=postgres');

`;

    // Generar queries específicas
    for (const { tabla, tipo, query } of queries) {
        script += `
\\echo 'Migrando tabla: ${tabla} (${tipo})'

-- Limpiar datos existentes de ${tabla} si es necesario
-- DELETE FROM ${tabla}; -- Descomenta si quieres limpiar

`;
        
        if (tipo === 'MAPEADA') {
            // Para tablas mapeadas, usar queries específicas
            script += `-- Migración mapeada para ${tabla}
${query}

`;
        } else {
            // Para tablas directas, usar dblink
            script += `-- Migración directa para ${tabla}
INSERT INTO ${tabla} 
SELECT * FROM dblink('temp_conn', 'SELECT * FROM ${tabla}') 
AS remote_${tabla}(LIKE ${tabla});

`;
        }
    }

    script += `
-- Cerrar conexión temporal
SELECT dblink_disconnect('temp_conn');

-- Confirmar transacción
COMMIT;

\\echo 'Migración adaptiva completada!'

-- Mostrar estadísticas
${CONFIG.tablasMigrar.map(tabla => `SELECT COUNT(*) as total_${tabla} FROM ${tabla};`).join('\n')}
`;

    fs.writeFileSync('migracion-adaptiva.sql', script);
    console.log('✅ Script generado: migracion-adaptiva.sql');
    
    return script;
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🚀 [INICIO] Migración Adaptiva Inteligente\n');
        
        // 1. Crear base temporal
        const temporalOk = await crearBaseTemporal();
        if (!temporalOk) {
            throw new Error('No se pudo crear base temporal');
        }
        
        // 2. Generar queries adaptadas
        const queries = generarQueriesMigracion();
        
        // 3. Generar script SQL
        const script = generarScriptSQL(queries);
        
        console.log('\n🎉 [PREPARACIÓN COMPLETA]');
        console.log('📁 Archivos generados:');
        console.log('   - migracion-adaptiva.sql');
        
        console.log('\n🔄 [SIGUIENTE PASO]:');
        console.log('   Ejecutar: psql -h localhost -U postgres -d suminix -f migracion-adaptiva.sql');
        
        console.log('\n⚠️ [IMPORTANTE]:');
        console.log('   - Se preservará el sistema RBAC V2 actual');
        console.log('   - Solo se migrarán datos operacionales');
        console.log('   - Los ceros a la izquierda en claves se mantendrán');
        
    } catch (error) {
        console.error('💥 [ERROR]', error.message);
        process.exit(1);
    }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
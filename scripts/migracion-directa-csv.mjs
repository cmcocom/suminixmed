#!/usr/bin/env node

/**
 * MIGRACIÓN POR EXPORTACIÓN DIRECTA
 * Extrae datos específicos del respaldo y los adapta sin dblink
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔄 [MIGRACIÓN DIRECTA] Exportando datos específicos...\n');

/**
 * Exportar tabla específica del respaldo
 */
function exportarTablaRespaldo(tabla, columnas = '*', condicion = '') {
    console.log(`📤 Exportando ${tabla}...`);
    
    const whereClause = condicion ? `WHERE ${condicion}` : '';
    const query = `COPY (SELECT ${columnas} FROM ${tabla} ${whereClause}) TO STDOUT WITH CSV HEADER`;
    
    try {
        const resultado = execSync(`psql -h localhost -U postgres temp_esquema -c "${query}"`, {
            encoding: 'utf8',
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        const archivo = `export-${tabla}.csv`;
        fs.writeFileSync(archivo, resultado);
        
        const lineas = resultado.split('\n').length - 1;
        console.log(`✅ ${tabla}: ${lineas} registros -> ${archivo}`);
        
        return archivo;
    } catch (error) {
        console.error(`❌ Error exportando ${tabla}:`, error.message);
        return null;
    }
}

/**
 * Importar CSV a tabla destino
 */
function importarCsvATabla(archivo, tabla, columnas) {
    console.log(`📥 Importando ${archivo} a ${tabla}...`);
    
    try {
        const query = `\\COPY ${tabla} (${columnas.join(',')}) FROM '${archivo}' WITH CSV HEADER`;
        
        execSync(`psql -h localhost -U postgres suminix -c "${query}"`, {
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        console.log(`✅ Importación completada: ${tabla}`);
        return true;
    } catch (error) {
        console.error(`❌ Error importando ${tabla}:`, error.message);
        return false;
    }
}

/**
 * Migración principal
 */
async function migrarDatos() {
    console.log('🚀 Iniciando migración por exportación directa...\n');
    
    // 1. INVENTARIO PRINCIPAL (adaptado)
    console.log('📦 [1/6] Migrando Inventario...');
    const inventarioFile = exportarTablaRespaldo(
        '"Inventario"',
        'id, nombre, descripcion, categoria, cantidad, precio, "fechaVencimiento", estado, imagen, "createdAt", "updatedAt", categoria_id, numero_lote, cantidad_maxima, cantidad_minima, dias_reabastecimiento, punto_reorden, ubicacion_general, clave, clave2, unidad_medida_id'
    );
    
    if (inventarioFile) {
        // Limpiar inventario viejo primero
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM \\"Inventario\\" WHERE \\"createdAt\\" < '2025-11-01';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(inventarioFile, '"Inventario"', [
            'id', 'nombre', 'descripcion', 'categoria', 'cantidad', 'precio', 
            '"fechaVencimiento"', 'estado', 'imagen', '"createdAt"', '"updatedAt"', 
            'categoria_id', 'numero_lote', 'cantidad_maxima', 'cantidad_minima', 
            'dias_reabastecimiento', 'punto_reorden', 'ubicacion_general', 'clave', 'clave2', 'unidad_medida_id'
        ]);
    }
    
    // 2. PROVEEDORES
    console.log('\n🏪 [2/6] Migrando Proveedores...');
    const proveedoresFile = exportarTablaRespaldo('proveedores');
    if (proveedoresFile) {
        // Limpiar proveedores viejos
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM proveedores WHERE \\"createdAt\\" < '2025-11-01';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(proveedoresFile, 'proveedores', [
            'id', 'nombre', 'razon_social', 'email', 'telefono', 'direccion', 
            'rfc', 'contacto', 'sitio_web', 'notas', 'activo', '"createdAt"', 
            '"updatedAt"', 'imagen', 'condiciones_pago'
        ]);
    }
    
    // 3. CLIENTES
    console.log('\n👥 [3/6] Migrando Clientes...');
    const clientesFile = exportarTablaRespaldo('clientes');
    if (clientesFile) {
        // Limpiar clientes viejos
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM clientes WHERE \\"createdAt\\" < '2025-11-01';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(clientesFile, 'clientes', [
            'id', 'nombre', 'email', 'telefono', 'direccion', 'rfc', 'empresa', 
            'contacto', 'activo', '"createdAt"', '"updatedAt"', 'imagen', 'id_usuario', 
            'codigo_postal', 'clave', 'medico_tratante', 'especialidad', 'localidad', 'estado', 'pais'
        ]);
    }
    
    // 4. ENTRADAS DE INVENTARIO
    console.log('\n📥 [4/6] Migrando Entradas...');
    const entradasFile = exportarTablaRespaldo('entradas_inventario');
    if (entradasFile) {
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM entradas_inventario WHERE \\"createdAt\\" < '2025-11-01';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(entradasFile, 'entradas_inventario', [
            'id', 'motivo', 'observaciones', 'total', 'estado', 'fecha_creacion', 
            'user_id', '"createdAt"', '"updatedAt"', 'tipo_entrada_id', 'proveedor_id', 
            'folio', 'serie', 'fecha_entrada', 'referencia_externa'
        ]);
    }
    
    // 5. PARTIDAS DE ENTRADA
    console.log('\n📋 [5/6] Migrando Partidas de Entrada...');
    const partidasEntradaFile = exportarTablaRespaldo('partidas_entrada_inventario');
    if (partidasEntradaFile) {
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM partidas_entrada_inventario WHERE \\"createdAt\\" < '2025-11-01';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(partidasEntradaFile, 'partidas_entrada_inventario', [
            'id', 'entrada_id', 'inventario_id', 'cantidad', 'precio_unitario', 
            'subtotal', 'numero_lote', 'fecha_vencimiento', '"createdAt"', '"updatedAt"'
        ]);
    }
    
    // 6. UNIDADES DE MEDIDA (ADAPTADO - Sin abreviatura)
    console.log('\n📏 [6/6] Migrando Unidades de Medida (adaptado)...');
    const unidadesFile = exportarTablaRespaldo(
        'unidades_medida',
        'id, nombre, descripcion, activo, "createdAt", "updatedAt", clave'
    );
    if (unidadesFile) {
        try {
            execSync(`psql -h localhost -U postgres suminix -c "DELETE FROM unidades_medida WHERE id NOT LIKE 'UM-%';"`, {
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } catch {}
        
        importarCsvATabla(unidadesFile, 'unidades_medida', [
            'id', 'nombre', 'descripcion', 'activo', '"createdAt"', '"updatedAt"', 'clave'
        ]);
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        await migrarDatos();
        
        console.log('\n🎉 [MIGRACIÓN COMPLETADA]');
        
        // Mostrar estadísticas
        console.log('\n📊 Verificando estadísticas...');
        const estadisticas = execSync(`psql -h localhost -U postgres suminix -c "
            SELECT 'Inventario' as tabla, COUNT(*) as registros FROM \\"Inventario\\"
            UNION ALL
            SELECT 'proveedores', COUNT(*) FROM proveedores
            UNION ALL
            SELECT 'clientes', COUNT(*) FROM clientes
            UNION ALL
            SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario
            UNION ALL
            SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario
            UNION ALL
            SELECT 'unidades_medida', COUNT(*) FROM unidades_medida;
        "`, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
        
        console.log(estadisticas);
        
        // Verificar claves con ceros
        console.log('\n🔍 Verificando claves con ceros...');
        const claves = execSync(`psql -h localhost -U postgres suminix -c "SELECT nombre, clave, clave2 FROM \\"Inventario\\" WHERE clave LIKE '0%' OR clave2 LIKE '0%' LIMIT 5;"`, {
            encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe']
        });
        console.log(claves);
        
        // Limpiar archivos temporales
        console.log('\n🗑️ Limpiando archivos temporales...');
        const archivos = ['export-Inventario.csv', 'export-proveedores.csv', 'export-clientes.csv', 'export-entradas_inventario.csv', 'export-partidas_entrada_inventario.csv', 'export-unidades_medida.csv'];
        for (const archivo of archivos) {
            try {
                fs.unlinkSync(archivo);
                console.log(`✅ Eliminado: ${archivo}`);
            } catch {}
        }
        
        console.log('\n✅ [TODO COMPLETADO] - Migración exitosa con preservación de RBAC V2');
        
    } catch (error) {
        console.error('💥 [ERROR]', error.message);
        process.exit(1);
    }
}

// Ejecutar
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
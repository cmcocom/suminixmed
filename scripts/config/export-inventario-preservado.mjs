// Script para exportar inventario preservando ceros a la izquierda
import fs from 'fs';
import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgres://postgres:notaR.psql@localhost:5432/suminix_temp_prod'
});

async function exportInventario() {
  try {
    await client.connect();
    
    // Obtener los datos preservando el formato exacto de texto
    const result = await client.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        categoria,
        cantidad,
        precio,
        "fechaVencimiento",
        estado,
        imagen,
        "createdAt",
        "updatedAt",
        categoria_id,
        numero_lote,
        cantidad_maxima,
        cantidad_minima,
        dias_reabastecimiento,
        punto_reorden,
        ubicacion_general,
        clave,
        clave2,
        unidad_medida_id
      FROM "Inventario" 
      ORDER BY clave
    `);
    
    console.log(`✅ Encontrados ${result.rows.length} productos en el inventario`);
    
    // Verificar productos con claves que podrían tener ceros a la izquierda
    console.log('\n📋 Primeros 10 productos por clave:');
    result.rows.slice(0, 10).forEach((producto, index) => {
      console.log(`  ${index + 1}. Clave: "${producto.clave}" | ID: ${producto.id} | Nombre: ${producto.nombre.substring(0, 40)}...`);
    });
    
    // Buscar específicamente claves que empiecen con 0
    const productosConCeros = result.rows.filter(row => 
      row.clave && row.clave.toString().startsWith('0')
    );
    
    console.log(`\n🔍 Productos con clave que empieza en 0: ${productosConCeros.length}`);
    if (productosConCeros.length > 0) {
      console.log('📋 Muestra de productos con ceros a la izquierda:');
      productosConCeros.slice(0, 5).forEach(producto => {
        console.log(`  - Clave: "${producto.clave}" | Nombre: ${producto.nombre}`);
      });
    }
    
    // Crear las columnas exactas
    const headers = [
      'id', 'nombre', 'descripcion', 'categoria', 'cantidad', 'precio',
      'fechaVencimiento', 'estado', 'imagen', 'createdAt', 'updatedAt',
      'categoria_id', 'numero_lote', 'cantidad_maxima', 'cantidad_minima',
      'dias_reabastecimiento', 'punto_reorden', 'ubicacion_general', 
      'clave', 'clave2', 'unidad_medida_id'
    ];
    
    // Crear archivo SQL INSERT preservando formato
    let sqlContent = `-- Inventario de productos (preservando ceros a la izquierda)
-- Total de productos: ${result.rows.length}
-- IMPORTANTE: Las claves mantienen su formato original

-- Primero limpiamos la tabla
TRUNCATE TABLE "Inventario" CASCADE;

-- Insertamos los productos preservando el formato exacto de las claves
`;
    
    result.rows.forEach((row, index) => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') {
          // Para claves, preservamos el formato exacto
          return `'${value.replace(/'/g, "''")}'`;
        }
        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        return value;
      });
      
      sqlContent += `INSERT INTO "Inventario" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
      
      // Progreso cada 100 productos
      if ((index + 1) % 100 === 0) {
        console.log(`📦 Procesados ${index + 1}/${result.rows.length} productos...`);
      }
    });
    
    fs.writeFileSync('inventario_productos_completo.sql', sqlContent, 'utf8');
    console.log('\n✅ Archivo SQL guardado como: inventario_productos_completo.sql');
    
    // También crear archivo CSV preservando formato
    let csvContent = headers.join(',') + '\n';
    
    result.rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        // Escapar comillas y envolver en comillas todos los campos de texto
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    fs.writeFileSync('inventario_productos_completo.csv', csvContent, 'utf8');
    console.log('✅ Archivo CSV guardado como: inventario_productos_completo.csv');
    
    console.log(`\n🎉 Exportación completada: ${result.rows.length} productos exportados con ceros a la izquierda preservados`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

exportInventario();
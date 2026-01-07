// Script para obtener la estructura de la tabla Inventario
import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgres://postgres:notaR.psql@localhost:5432/suminix_temp_prod'
});

async function getTableStructure() {
  try {
    await client.connect();
    
    // Obtener estructura de la tabla
    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Inventario' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla Inventario:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // También verificar algunos datos de muestra
    const sample = await client.query('SELECT * FROM "Inventario" LIMIT 3');
    console.log('\n📊 Muestra de datos:');
    console.log(JSON.stringify(sample.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

getTableStructure();
#!/usr/bin/env node
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:notaR.psql@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, name, is_system_role FROM rbac_roles 
      WHERE is_active = true
      ORDER BY name
    `);

    console.log('\n📋 Roles en el sistema:\n');
    result.rows.forEach(r => {
      const system = r.is_system_role ? '🔒 SISTEMA' : '👤 NORMAL';
      console.log(`${system} ${r.name} (${r.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

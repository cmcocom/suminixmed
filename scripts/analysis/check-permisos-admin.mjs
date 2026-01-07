#!/usr/bin/env node
/**
 * Verificar permisos del rol ADMINISTRADOR
 */

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:notaR.psql@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();

    // Permisos asignados al rol ADMINISTRADOR
    const result = await client.query(`
      SELECT 
        p.module, 
        p.action, 
        rp.assigned,
        rp.granted
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON rp.permission_id = p.id
      INNER JOIN rbac_roles r ON r.id = rp.role_id
      WHERE r.name ILIKE '%administrador%'
        AND p.is_active = true
        AND (p.module ILIKE '%USUARIO%' OR p.module ILIKE '%RBAC%' OR p.module ILIKE '%AJUSTE%')
      ORDER BY p.module, p.action
    `);

    console.log(`\n📋 Permisos del rol ADMINISTRADOR relacionados a usuarios/RBAC:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ NO se encontraron permisos');
    } else {
      result.rows.forEach((p) => {
        const assigned = p.assigned ? '✅ ASSIGNED' : '❌ NOT ASSIGNED';
        const granted = p.granted ? '👁️ GRANTED' : '🚫 NOT GRANTED';
        console.log(`${assigned} ${granted} ${p.module}.${p.action}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

#!/usr/bin/env node
/**
 * Verificar qué permisos LEER tiene asignados el rol OPERADOR
 */

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();

    // 1. Permisos LEER del rol OPERADOR
    const result = await client.query(`
      SELECT 
        p.module, 
        p.action, 
        p.name, 
        rp.assigned,
        rp.granted
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = (SELECT id FROM rbac_roles WHERE slug = 'role_operador')
        AND p.action = 'LEER'
        AND p.is_active = true
      ORDER BY p.module
      LIMIT 20
    `);

    console.log(`\n📋 Permisos LEER del rol OPERADOR (${result.rows.length}):\n`);
    
    result.rows.forEach((p) => {
      const status = p.assigned ? '✅ ASSIGNED' : '❌ NOT ASSIGNED';
      const visible = p.granted ? '👁️ VISIBLE' : '🚫 HIDDEN';
      console.log(`${status} ${visible} ${p.module}.${p.action}`);
      console.log(`   name: "${p.name}"`);
      console.log('');
    });

    // 2. Verificar permisos específicos
    const stockResult = await client.query(`
      SELECT p.module, p.action, p.name, rp.assigned, rp.granted
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = (SELECT id FROM rbac_roles WHERE slug = 'role_operador')
        AND p.module IN ('STOCK_FIJO', 'CATALOGOS', 'REPORTES_INVENTARIO')
        AND p.action = 'LEER'
    `);

    console.log(`\n🔍 Permisos críticos:\n`);
    if (stockResult.rows.length === 0) {
      console.log('❌ NO se encontraron permisos LEER para STOCK_FIJO, CATALOGOS, REPORTES_INVENTARIO');
    } else {
      stockResult.rows.forEach((p) => {
        console.log(`${p.module}.${p.action} - assigned: ${p.assigned}, granted: ${p.granted}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

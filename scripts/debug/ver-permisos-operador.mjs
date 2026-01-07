#!/usr/bin/env node
/**
 * Script para ver los permisos exactos del usuario OPERADOR (clave 904171)
 * Para diagnosticar el formato de los permisos cargados
 */

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Obtener ID del usuario OPERADOR
    const userResult = await client.query(`
      SELECT id, clave, nombre
      FROM users
      WHERE clave = '904171'
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró usuario con clave 904171');
      return;
    }

    const usuario = userResult.rows[0];
    console.log('👤 Usuario:', usuario.nombre);
    console.log('🔑 ID:', usuario.id);
    console.log('');

    // 2. Obtener permisos asignados (con assigned=true)
    const permisosResult = await client.query(`
      SELECT 
        p.name,
        p.module,
        p.action,
        p.description
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = $1
        AND rp.assigned = true
        AND p.is_active = true
      ORDER BY p.module, p.action
      LIMIT 20
    `, [usuario.id]);

    console.log(`📋 Primeros 20 permisos asignados (de ${permisosResult.rows.length}):\n`);
    
    permisosResult.rows.forEach((p, i) => {
      console.log(`${i + 1}. name: "${p.name}"`);
      console.log(`   module: "${p.module}"`);
      console.log(`   action: "${p.action}"`);
      console.log(`   Formato esperado: ${p.module}.${p.action}`);
      console.log(`   Formato alternativo: ${p.module}_${p.action}`);
      console.log('');
    });

    // 3. Buscar permisos específicos de STOCK_FIJO y CATALOGOS
    console.log('\n🔍 Buscando permisos de STOCK_FIJO y CATALOGOS:\n');
    
    const criticalResult = await client.query(`
      SELECT 
        p.name,
        p.module,
        p.action
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = $1
        AND rp.assigned = true
        AND p.is_active = true
        AND (p.module ILIKE '%STOCK%' OR p.module ILIKE '%CATALOG%')
      ORDER BY p.module, p.action
    `, [usuario.id]);

    if (criticalResult.rows.length === 0) {
      console.log('❌ NO se encontraron permisos de STOCK_FIJO o CATALOGOS');
    } else {
      criticalResult.rows.forEach((p) => {
        console.log(`✅ ${p.module}.${p.action} (name: "${p.name}")`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

#!/usr/bin/env node
/**
 * Configurar permisos de AJUSTES_USUARIOS y AJUSTES_RBAC para rol ADMINISTRADOR
 */

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:notaR.psql@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // PASO 1: Dar permisos de AJUSTES_USUARIOS
    const result1 = await client.query(`
      UPDATE rbac_role_permissions
      SET granted = true
      WHERE role_id = (SELECT id FROM rbac_roles WHERE name = 'Administrador' LIMIT 1)
        AND permission_id IN (
          SELECT id FROM rbac_permissions 
          WHERE module = 'AJUSTES_USUARIOS'
            AND action IN ('LEER', 'CREAR', 'EDITAR', 'ELIMINAR')
        )
    `);
    console.log(`✅ Permisos AJUSTES_USUARIOS asignados: ${result1.rowCount} registros actualizados`);

    // PASO 2: Dar permisos de AJUSTES_RBAC
    const result2 = await client.query(`
      UPDATE rbac_role_permissions
      SET granted = true
      WHERE role_id = (SELECT id FROM rbac_roles WHERE name = 'Administrador' LIMIT 1)
        AND permission_id IN (
          SELECT id FROM rbac_permissions 
          WHERE module = 'AJUSTES_RBAC'
            AND action IN ('LEER', 'CREAR', 'EDITAR', 'ELIMINAR')
        )
    `);
    console.log(`✅ Permisos AJUSTES_RBAC asignados: ${result2.rowCount} registros actualizados\n`);

    // PASO 3: Verificar
    const verification = await client.query(`
      SELECT 
        r.name as rol,
        p.module,
        p.action,
        rp.granted
      FROM rbac_roles r
      INNER JOIN rbac_role_permissions rp ON rp.role_id = r.id
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      WHERE r.name = 'Administrador'
        AND p.module IN ('AJUSTES_USUARIOS', 'AJUSTES_RBAC')
      ORDER BY p.module, p.action
    `);

    console.log('📋 Permisos configurados para ADMINISTRADOR:\n');
    verification.rows.forEach(row => {
      const status = row.granted ? '✅' : '❌';
      console.log(`${status} ${row.module}.${row.action} - granted: ${row.granted}`);
    });

    console.log('\n✅ Configuración completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

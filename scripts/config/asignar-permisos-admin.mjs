#!/usr/bin/env node
/**
 * Verificar y crear permisos faltantes para ADMINISTRADOR
 */

import pkg from 'pg';
const { Client } = pkg;
import { randomUUID } from 'crypto';

const client = new Client({
  connectionString: 'postgresql://postgres:notaR.psql@localhost:5432/suminix'
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener ID del rol ADMINISTRADOR
    const rolResult = await client.query(`
      SELECT id, name FROM rbac_roles WHERE name = 'ADMINISTRADOR' LIMIT 1
    `);

    if (rolResult.rows.length === 0) {
      console.log('❌ No se encontró rol Administrador');
      return;
    }

    const roleId = rolResult.rows[0].id;
    console.log(`📋 Rol encontrado: ${rolResult.rows[0].name} (${roleId})\n`);

    // Obtener todos los permisos que necesita el ADMINISTRADOR
    const permissionsNeeded = [
      'AJUSTES_USUARIOS.LEER',
      'AJUSTES_USUARIOS.CREAR',
      'AJUSTES_USUARIOS.EDITAR',
      'AJUSTES_USUARIOS.ELIMINAR',
      'AJUSTES_RBAC.LEER',
      'AJUSTES_RBAC.CREAR',
      'AJUSTES_RBAC.EDITAR',
      'AJUSTES_RBAC.ELIMINAR'
    ];

    console.log('🔍 Verificando permisos necesarios...\n');

    for (const perm of permissionsNeeded) {
      const [module, action] = perm.split('.');
      
      // Verificar si existe el permiso en rbac_permissions
      const permResult = await client.query(`
        SELECT id, name FROM rbac_permissions 
        WHERE module = $1 AND action = $2 AND is_active = true
      `, [module, action]);

      if (permResult.rows.length === 0) {
        console.log(`❌ Permiso NO existe en BD: ${perm}`);
        continue;
      }

      const permissionId = permResult.rows[0].id;
      
      // Verificar si ya está asignado al rol
      const rolePermResult = await client.query(`
        SELECT id, granted FROM rbac_role_permissions
        WHERE role_id = $1 AND permission_id = $2
      `, [roleId, permissionId]);

      if (rolePermResult.rows.length === 0) {
        // NO EXISTE - Crearlo
        await client.query(`
          INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by, granted_at)
          VALUES ($1, $2, $3, true, 'sistema', NOW())
        `, [randomUUID(), roleId, permissionId]);
        console.log(`✅ CREADO: ${perm}`);
      } else {
        // YA EXISTE - Actualizar a granted=true si es necesario
        if (!rolePermResult.rows[0].granted) {
          await client.query(`
            UPDATE rbac_role_permissions 
            SET granted = true 
            WHERE id = $1
          `, [rolePermResult.rows[0].id]);
          console.log(`✅ ACTUALIZADO: ${perm} (granted=false -> granted=true)`);
        } else {
          console.log(`✅ OK: ${perm} (ya estaba granted=true)`);
        }
      }
    }

    console.log('\n✅ Configuración completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();

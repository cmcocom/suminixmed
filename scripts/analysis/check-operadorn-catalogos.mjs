#!/usr/bin/env node
import pkg from 'pg';
const { Client } = pkg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('\n🔍 ANÁLISIS DEL ROL OPERADORN - MÓDULO CATÁLOGOS\n');
    console.log('='.repeat(80));

    // 1. Buscar el rol OPERADORN
    const rolQuery = await client.query(`
      SELECT id, name, type, description
      FROM rbac_roles
      WHERE name = 'OPERADORN' OR id LIKE '%operadorn%'
    `);

    if (rolQuery.rows.length === 0) {
      console.log('❌ Rol OPERADORN no encontrado');
      await client.end();
      return;
    }

    const rol = rolQuery.rows[0];
    console.log(`📋 ROL: ${rol.name}`);
    console.log(`   ID: ${rol.id}`);

    // 2. Obtener permisos del rol OPERADORN
    const permisosQuery = await client.query(`
      SELECT 
        p.id,
        p.name,
        p.module,
        p.action
      FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      AND p.is_active = true
      ORDER BY p.module, p.action
    `, [rol.id]);

    console.log(`   Total de permisos: ${permisosQuery.rows.length}`);

    // 3. Agrupar por módulo
    const permisosPorModulo = {};
    permisosQuery.rows.forEach(p => {
      if (!permisosPorModulo[p.module]) {
        permisosPorModulo[p.module] = [];
      }
      permisosPorModulo[p.module].push(p);
    });

    // 4. Módulos de catálogos
    const modulosCatalogos = [
      'PRODUCTOS',
      'CLIENTES', 
      'PROVEEDORES',
      'CATEGORIAS',
      'ALMACENES',
      'UBICACIONES',
      'GESTION_CATALOGOS'
    ];

    console.log('\n📊 PERMISOS DE CATÁLOGOS EN OPERADORN:');
    for (const modulo of modulosCatalogos) {
      if (permisosPorModulo[modulo]) {
        console.log(`\n   ✅ ${modulo} (${permisosPorModulo[modulo].length} permisos):`);
        permisosPorModulo[modulo].forEach(p => {
          console.log(`      - ${p.action}: ${p.name}`);
        });
      } else {
        console.log(`\n   ❌ ${modulo} - NO TIENE PERMISOS`);
      }
    }

    // 5. Ver todos los permisos disponibles para catálogos
    console.log('\n\n📋 PERMISOS DISPONIBLES EN EL SISTEMA:');
    for (const modulo of modulosCatalogos) {
      const disponiblesQuery = await client.query(`
        SELECT id, name, action
        FROM rbac_permissions
        WHERE module = $1
        AND is_active = true
        ORDER BY action
      `, [modulo]);

      if (disponiblesQuery.rows.length > 0) {
        console.log(`\n   📦 ${modulo} (${disponiblesQuery.rows.length} permisos disponibles):`);
        disponiblesQuery.rows.forEach(p => {
          const tiene = permisosPorModulo[modulo]?.some(pm => pm.action === p.action);
          const simbolo = tiene ? '✅' : '❌';
          console.log(`      ${simbolo} ${p.action}: ${p.name}`);
        });
      }
    }

    // 6. Identificar faltantes
    console.log('\n\n⚠️  PERMISOS FALTANTES EN OPERADORN:');
    let hayFaltantes = false;

    for (const modulo of modulosCatalogos) {
      const disponiblesQuery = await client.query(`
        SELECT id, name, action
        FROM rbac_permissions
        WHERE module = $1
        AND is_active = true
      `, [modulo]);

      const faltantes = disponiblesQuery.rows.filter(p =>
        !permisosPorModulo[modulo]?.some(pm => pm.action === p.action)
      );

      if (faltantes.length > 0) {
        hayFaltantes = true;
        console.log(`\n   ❌ ${modulo} - Faltan ${faltantes.length} permisos:`);
        faltantes.forEach(p => {
          console.log(`      - ${p.action}: ${p.name}`);
        });
      }
    }

    if (!hayFaltantes) {
      console.log('\n   ✅ OPERADORN tiene todos los permisos de catálogos');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'suminix',
  user: 'postgres',
  password: 'notaR.psql'
});

async function simularAPIVisibility() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Simular lo que hace GET /api/rbac/modules/visibility para el usuario 904171
    const userId = 'aa14583c-037a-4179-ba75-23ecfc65b1a0';  // Usuario KEVIN (904171)
    
    console.log(`🎯 Simulando API para usuario: ${userId}`);
    console.log('='.repeat(80));

    // Paso 1: Obtener roles del usuario
    console.log('\n📋 PASO 1: Obtener roles del usuario');
    const userRolesQuery = `
      SELECT role_id FROM rbac_user_roles WHERE user_id = $1
    `;
    
    const userRoles = await client.query(userRolesQuery, [userId]);
    const roleIds = userRoles.rows.map(ur => ur.role_id);
    
    console.log(`Roles encontrados: ${JSON.stringify(roleIds)}`);

    // Paso 2: Obtener permisos LEER de esos roles
    console.log('\n📋 PASO 2: Obtener permisos LEER de los roles');
    const permissionsQuery = `
      SELECT 
        rp.granted,
        p.module,
        p.action,
        p.is_active
      FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ANY($1)
        AND p.action = 'LEER'
        AND p.is_active = true
      ORDER BY p.module
    `;
    
    const permissions = await client.query(permissionsQuery, [roleIds]);
    
    console.log(`Total permisos LEER encontrados: ${permissions.rows.length}`);
    
    // Paso 3: Procesar permisos según lógica de la API
    console.log('\n📋 PASO 3: Procesar permisos (OR lógico entre roles)');
    const moduleVisibility = {};
    
    permissions.rows.forEach((rp) => {
      const moduleName = rp.module;
      
      // Si ya está en true, mantenerlo (OR lógico entre roles)
      if (moduleVisibility[moduleName] !== true) {
        moduleVisibility[moduleName] = rp.granted;
      }
    });
    
    console.log('\n✅ moduleVisibility resultante:');
    console.log(JSON.stringify(moduleVisibility, null, 2));
    
    // Paso 4: Verificar módulos específicos
    console.log('\n\n📋 PASO 4: Verificar módulos específicos del sidebar');
    console.log('='.repeat(80));
    
    const modulosImportantes = [
      'DASHBOARD',
      'ENTRADAS', 
      'SALIDAS',
      'REPORTES',
      'GESTION_REPORTES',
      'REPORTES_INVENTARIO',
      'REPORTES_SALIDAS_CLIENTE',
      'STOCK_FIJO',
      'CATALOGOS',
      'GESTION_CATALOGOS',
      'CATALOGOS_PRODUCTOS',
      'INVENTARIO',
      'CATALOGOS_CATEGORIAS',
      'CATALOGOS_CLIENTES',
      'CATALOGOS_PROVEEDORES'
    ];
    
    console.log('\nEstado de cada módulo:');
    modulosImportantes.forEach(modulo => {
      const estado = moduleVisibility[modulo];
      if (estado === true) {
        console.log(`   ✅ ${modulo}: VISIBLE (granted=true)`);
      } else if (estado === false) {
        console.log(`   ❌ ${modulo}: OCULTO (granted=false)`);
      } else {
        console.log(`   ⚠️  ${modulo}: NO DEFINIDO (undefined)`);
      }
    });
    
    // Paso 5: Verificar qué muestra getFilteredMenuItems
    console.log('\n\n📋 PASO 5: Simular filtrado del sidebar');
    console.log('='.repeat(80));
    
    const menuItems = [
      { title: 'Dashboard', modulo: 'DASHBOARD' },
      { title: 'Solicitudes', modulo: 'SOLICITUDES' },
      { title: 'Surtido', modulo: 'SURTIDO' },
      { title: 'Entradas', modulo: 'ENTRADAS' },
      { title: 'Salidas', modulo: 'SALIDAS' },
      { title: 'Reportes', modulo: 'REPORTES', submenu: [
        { title: 'Inventario', modulo: 'REPORTES_INVENTARIO' },
        { title: 'Salidas por Cliente', modulo: 'REPORTES_SALIDAS_CLIENTE' }
      ]},
      { title: 'Stock Fijo', modulo: 'STOCK_FIJO' },
      { title: 'Inventarios Físicos', modulo: 'INVENTARIOS_FISICOS' },
      { title: 'Catálogos', modulo: 'CATALOGOS', submenu: [
        { title: 'Productos', modulo: 'CATALOGOS_PRODUCTOS' },
        { title: 'Categorías', modulo: 'CATALOGOS_CATEGORIAS' },
        { title: 'Clientes', modulo: 'CATALOGOS_CLIENTES' },
        { title: 'Proveedores', modulo: 'CATALOGOS_PROVEEDORES' },
        { title: 'Empleados', modulo: 'CATALOGOS_EMPLEADOS' },
        { title: 'Tipos de Entrada', modulo: 'CATALOGOS_TIPOS_ENTRADA' },
        { title: 'Tipos de Salida', modulo: 'CATALOGOS_TIPOS_SALIDA' },
        { title: 'Almacenes', modulo: 'CATALOGOS_ALMACENES' }
      ]},
      { title: 'Ajustes', modulo: 'AJUSTES' }
    ];
    
    console.log('\n🔍 Items del menú que DEBERÍAN mostrarse:');
    menuItems.forEach(item => {
      const isVisible = moduleVisibility[item.modulo] === true;
      const hasModuleVisibility = Object.keys(moduleVisibility).length > 0;
      
      // Lógica del código: if (isVisible !== true) { return false; }
      if (hasModuleVisibility && isVisible !== true) {
        console.log(`   ❌ ${item.title} (${item.modulo}): OCULTO - isVisible=${isVisible}`);
      } else {
        console.log(`   ✅ ${item.title} (${item.modulo}): VISIBLE - isVisible=${isVisible}`);
        
        if (item.submenu) {
          item.submenu.forEach(subitem => {
            const subVisible = moduleVisibility[subitem.modulo] === true;
            if (hasModuleVisibility && subVisible !== true) {
              console.log(`      ❌ └─ ${subitem.title} (${subitem.modulo}): OCULTO`);
            } else {
              console.log(`      ✅ └─ ${subitem.title} (${subitem.modulo}): VISIBLE`);
            }
          });
        }
      }
    });
    
    console.log('\n\n' + '='.repeat(80));
    console.log('🏁 SIMULACIÓN API COMPLETADA');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

simularAPIVisibility();

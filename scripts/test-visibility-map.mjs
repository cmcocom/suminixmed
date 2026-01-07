#!/usr/bin/env node

// Simular el resultado del API y el mapa de visibilidad

const rawModuleVisibility = {
  'DASHBOARD': true,
  'ENTRADAS': true,
  'SALIDAS': true,
  'SOLICITUDES': true,
  'SURTIDO': true,
  'PRODUCTOS': true,
  'STOCK_FIJO': true,
  'CATEGORIAS': true,
  'CLIENTES': true,
  'PROVEEDORES': true,
  'EMPLEADOS': true,
  'REPORTES': true,
  'REPORTES_INVENTARIO': true,
  'AJUSTES': true,
  'USUARIOS': true,
  'SISTEMA': true,
  'INVENTARIOS_FISICOS': true,
  'ORDENES_COMPRA': true,
  'ALMACENES': true,
  'FONDOS_FIJOS': true,
  'INVENTARIO': true,
  'UBICACIONES': true,
  'RESPALDOS': true,
  'PERFIL_PROPIO': true,
  // Ocultos
  'RBAC': false,
  'PERMISOS_INDICADORES': false,
  'GESTION_CATALOGOS': false,
  'GESTION_REPORTES': false,
  'ENTIDADES': false,
  'GESTION_INDICADORES': false,
  'AUDITORIA': false
};

const MODULE_VISIBILITY_MAP = {
  DASHBOARD: ['DASHBOARD'],
  ORDENES_COMPRA: ['ORDENES_COMPRA'],
  ENTRADAS: ['ENTRADAS'],
  SALIDAS: ['SALIDAS'],
  SOLICITUDES: ['SOLICITUDES'],
  SURTIDO: ['SURTIDO'],
  INVENTARIO: ['INVENTARIO'],
  INVENTARIOS_FISICOS: ['INVENTARIOS_FISICOS'],
  PRODUCTOS: ['PRODUCTOS'],
  STOCK_FIJO: ['STOCK_FIJO'],
  CATEGORIAS: ['CATEGORIAS'],
  CLIENTES: ['CLIENTES'],
  PROVEEDORES: ['PROVEEDORES'],
  EMPLEADOS: ['EMPLEADOS'],
  REPORTES: ['REPORTES'],
  AJUSTES: ['AJUSTES'],
  USUARIOS: ['USUARIOS'],
  RBAC: ['RBAC'],
  AUDITORIA: ['AUDITORIA'],
  PERMISOS_INDICADORES: ['PERMISOS_INDICADORES'],
  GESTION_CATALOGOS: ['GESTION_CATALOGOS'],
  GESTION_REPORTES: ['GESTION_REPORTES'],
  ENTIDADES: ['ENTIDADES'],
  ALMACENES: ['ALMACENES'],
  FONDOS_FIJOS: ['FONDOS_FIJOS'],
  UBICACIONES: ['UBICACIONES'],
  RESPALDOS: ['RESPALDOS'],
  PERFIL_PROPIO: ['PERFIL_PROPIO'],
  REPORTES_INVENTARIO: ['REPORTES'],
  SISTEMA: ['SISTEMA'],
};

function deriveEffectiveVisibility(raw) {
  const effective = {};
  
  // PASO 1: Procesar todos los módulos que están en TRUE primero
  for (const [key, visible] of Object.entries(raw)) {
    if (visible === true) {
      const targets = MODULE_VISIBILITY_MAP[key] || [key];
      for (const target of targets) {
        if (effective[target] === undefined) {
          effective[target] = true;
        }
      }
    }
  }
  
  // PASO 2: Sobrescribir con FALSE solo si es explícito
  for (const [key, visible] of Object.entries(raw)) {
    if (visible === false) {
      const targets = MODULE_VISIBILITY_MAP[key] || [key];
      for (const target of targets) {
        // Solo ocultar si es el mismo módulo, no si es un mapeo indirecto
        if (key === target || MODULE_VISIBILITY_MAP[key]?.length === 1) {
          effective[target] = false;
        }
      }
    }
  }
  
  return effective;
}

console.log('📊 RAW MODULE VISIBILITY (de BD):');
console.log('  Total:', Object.keys(rawModuleVisibility).length);
console.log('  Visibles:', Object.entries(rawModuleVisibility).filter(([, v]) => v).length);
console.log('  Ocultos:', Object.entries(rawModuleVisibility).filter(([, v]) => !v).length);
console.log('');

const effective = deriveEffectiveVisibility(rawModuleVisibility);

console.log('🎯 EFFECTIVE VISIBILITY (para sidebar):');
console.log('  Total:', Object.keys(effective).length);
console.log('  Visibles:', Object.entries(effective).filter(([, v]) => v).length);
console.log('  Ocultos:', Object.entries(effective).filter(([, v]) => !v).length);
console.log('');

console.log('✅ Módulos VISIBLES en effectiveVisibility:');
Object.entries(effective)
  .filter(([, v]) => v)
  .forEach(([key]) => console.log(`   ✓ ${key}`));

console.log('');
console.log('❌ Módulos OCULTOS en effectiveVisibility:');
Object.entries(effective)
  .filter(([, v]) => !v)
  .forEach(([key]) => console.log(`   ✗ ${key}`));

console.log('');
console.log('⚠️  Módulos en RAW que NO están en el MODULE_VISIBILITY_MAP:');
Object.keys(rawModuleVisibility).forEach(key => {
  if (!MODULE_VISIBILITY_MAP[key]) {
    console.log(`   ? ${key}`);
  }
});

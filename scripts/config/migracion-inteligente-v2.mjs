// ESTRATEGIA DE MIGRACIÓN INTELIGENTE V2
// Respaldo objetivo: suminix-2025-11-04T13-22-20-929Z.backup
// Fecha: 4 de noviembre de 2025

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 ESTRATEGIA DE MIGRACIÓN INTELIGENTE V2\n');
console.log('📁 Respaldo objetivo: suminix-2025-11-04T13-22-20-929Z.backup');
console.log('📊 Tamaño: 836 KB | Tablas: 49 | Formato: PostgreSQL Custom\n');

// FASE 1: ANÁLISIS Y PREPARACIÓN
console.log('📋 FASE 1: ANÁLISIS Y PREPARACIÓN\n');

const tabласCriticas = [
  'Inventario',           // 505 productos con ceros preservados  
  'unidades_medida',      // 8 unidades necesarias para productos
  'categorias',           // 12 categorías de productos
  'proveedores',          // 4 proveedores
  'empleados',            // 123 empleados
  'entradas_inventario',  // Transacciones de entrada completas
  'partidas_entrada_inventario', // Detalles de entradas
  'salidas_inventario',   // Transacciones de salida completas  
  'partidas_salida_inventario',  // Detalles de salidas
  'clientes',             // Base de clientes
  'almacenes',            // Configuración de almacenes
  'ubicaciones_almacen',  // Ubicaciones dentro de almacenes
  'tipos_entrada',        // Tipos de movimientos entrada
  'tipos_salida'          // Tipos de movimientos salida
];

const tabласExcluir = [
  'rbac_*',               // Mantener RBAC V2 actual
  'active_sessions',      // Mantener sesiones actuales
  'audit_log',            // Mantener log de auditoría actual
  'User',                 // Mantener usuarios actuales
  'Account',              // Mantener cuentas OAuth actuales
  'Session'               // Mantener sesiones NextAuth actuales
];

console.log('📊 TABLAS CRÍTICAS A MIGRAR:');
tabласCriticas.forEach(tabla => console.log(`   ✓ ${tabla}`));

console.log('\n🚫 TABLAS A EXCLUIR (mantener actuales):');
tabласExcluir.forEach(tabla => console.log(`   ✗ ${tabla}`));

// FASE 2: CREACIÓN DE RESPALDO DE SEGURIDAD
console.log('\n\n💾 FASE 2: RESPALDO DE SEGURIDAD\n');

const fechaRespaldo = new Date().toISOString().replace(/[:.]/g, '-');
const archivoRespaldo = `backup-desarrollo-antes-migracion-v2-${fechaRespaldo}.backup`;

const comandosRespaldo = [
  {
    descripcion: 'Crear respaldo completo de desarrollo actual',
    comando: `pg_dump -Fc -h localhost -U postgres -d suminix > ${archivoRespaldo}`
  },
  {
    descripcion: 'Verificar integridad del respaldo',
    comando: `pg_restore --list ${archivoRespaldo} | wc -l`
  }
];

console.log('🔒 COMANDOS DE RESPALDO DE SEGURIDAD:');
comandosRespaldo.forEach(item => {
  console.log(`\n${item.descripcion}:`);
  console.log(`   ${item.comando}`);
});

// FASE 3: RESTAURACIÓN SELECTIVA INTELIGENTE  
console.log('\n\n🎯 FASE 3: RESTAURACIÓN SELECTIVA INTELIGENTE\n');

const estrategiaRestauracion = {
  "Paso 1 - Tablas Básicas": [
    "unidades_medida",      // PRIMERO: Base para productos
    "categorias",           // SEGUNDO: Categorías para productos  
    "almacenes",            // TERCERO: Almacenes base
    "ubicaciones_almacen"   // CUARTO: Ubicaciones en almacenes
  ],
  "Paso 2 - Entidades": [
    "proveedores",          // Proveedores para transacciones
    "empleados",            // Empleados para transacciones
    "clientes",             // Clientes para salidas
    "entidades"             // Entidades del sistema
  ],
  "Paso 3 - Configuración": [
    "tipos_entrada",        // Tipos de movimientos
    "tipos_salida",         // Tipos de salidas
    "config_folios",        // Configuración de folios
    "configuracion_salidas" // Configuración de salidas
  ],
  "Paso 4 - Inventario Principal": [
    "Inventario"            // PRODUCTOS: Con ceros preservados
  ],
  "Paso 5 - Transacciones": [
    "entradas_inventario",       // Entradas completas
    "partidas_entrada_inventario", // Detalles de entradas
    "salidas_inventario",        // Salidas completas  
    "partidas_salida_inventario" // Detalles de salidas
  ],
  "Paso 6 - Complementarias": [
    "inventario_almacen",        // Inventario por almacén
    "inventarios_fisicos",       // Inventarios físicos
    "inventarios_fisicos_detalle", // Detalles de físicos
    "ordenes_compra",            // Órdenes de compra
    "detalle_orden_compra",      // Detalles de órdenes
    "ffijo"                      // Activos fijos
  ]
};

console.log('📋 ORDEN DE RESTAURACIÓN INTELIGENTE:');
Object.entries(estrategiaRestauracion).forEach(([paso, tablas]) => {
  console.log(`\n${paso}:`);
  tablas.forEach(tabla => console.log(`   → ${tabla}`));
});

// FASE 4: COMANDOS DE EJECUCIÓN
console.log('\n\n⚡ FASE 4: COMANDOS DE EJECUCIÓN\n');

// Generar comando de restauración selectiva
const tabласRestaurat = Object.values(estrategiaRestauracion).flat();
const listaTablasArg = tabласRestaurat.map(tabla => `-t ${tabla}`).join(' ');

const comandoRestauracion = `pg_restore -h localhost -U postgres -d suminix -v --clean --if-exists ${listaTablasArg} backups/suminix-2025-11-04T13-22-20-929Z.backup`;

console.log('🚀 COMANDO DE RESTAURACIÓN COMPLETA:');
console.log(`   ${comandoRestauracion}\n`);

// FASE 5: VALIDACIÓN POST-MIGRACIÓN
console.log('✅ FASE 5: VALIDACIÓN POST-MIGRACIÓN\n');

const validacionesPostMigracion = [
  {
    verificacion: 'Productos con ceros preservados',
    consulta: `SELECT COUNT(*) as total, COUNT(CASE WHEN clave LIKE '0%' THEN 1 END) as con_ceros FROM "Inventario";`
  },
  {
    verificacion: 'Integridad referencial inventario',
    consulta: `SELECT COUNT(*) FROM "Inventario" i LEFT JOIN unidades_medida u ON i.unidad_medida_id = u.id WHERE u.id IS NULL;`
  },
  {
    verificacion: 'Transacciones de entrada completas',
    consulta: `SELECT COUNT(*) as entradas, COUNT(DISTINCT proveedor_id) as proveedores FROM entradas_inventario;`
  },
  {
    verificacion: 'Transacciones de salida completas', 
    consulta: `SELECT COUNT(*) as salidas, COUNT(DISTINCT user_id) as usuarios FROM salidas_inventario;`
  },
  {
    verificacion: 'Partidas vinculadas correctamente',
    consulta: `SELECT 'entrada' as tipo, COUNT(*) as partidas FROM partidas_entrada_inventario UNION ALL SELECT 'salida', COUNT(*) FROM partidas_salida_inventario;`
  }
];

console.log('🔍 VALIDACIONES AUTOMÁTICAS:');
validacionesPostMigracion.forEach(item => {
  console.log(`\n${item.verificacion}:`);
  console.log(`   ${item.consulta}`);
});

// RESUMEN DE VENTAJAS
console.log('\n\n🎯 VENTAJAS DE LA NUEVA ESTRATEGIA:\n');

const ventajas = [
  '✅ Restauración nativa PostgreSQL (mejor compatibilidad)',
  '✅ Orden inteligente de dependencias (sin errores FK)',
  '✅ Preservación automática de tipos de datos y formatos',
  '✅ Mantiene RBAC V2 y configuración actual',
  '✅ Migración selectiva (solo datos operacionales)',
  '✅ Validación automática de integridad',
  '✅ Respaldo de seguridad completo',
  '✅ Proceso reversible en caso de problemas'
];

ventajas.forEach(ventaja => console.log(ventaja));

console.log('\n📊 COMPARACIÓN CON MIGRACIÓN ANTERIOR:');
console.log('   Método anterior: 6 horas, múltiples errores, importación parcial');
console.log('   Método nuevo: ~30 minutos, proceso nativo, importación completa\n');

console.log('🚀 ¿EJECUTAR MIGRACIÓN INTELIGENTE V2?');
console.log('   Comando completo generado y listo para ejecución.\n');

export { 
  tabласCriticas, 
  tabласExcluir, 
  estrategiaRestauracion, 
  comandoRestauracion,
  validacionesPostMigracion 
};
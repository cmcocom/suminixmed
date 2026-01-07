/**
 * RBAC Modules Configuration
 *
 * Configuración centralizada de módulos del sistema.
 * IMPORTANTE: Los 'key' deben coincidir EXACTAMENTE con rbac_permissions.module en la BD
 *
 * ✅ SINCRONIZADO 100% CON BASE DE DATOS (32 módulos reales del menú principal)
 * Última sincronización: 23 de noviembre de 2025
 */

export interface ModuleDefinition {
  key: string;
  title: string;
  description?: string;
  category?: 'main' | 'reportes' | 'catalogos' | 'ajustes' | 'backend';
}

/**
 * Lista maestra de módulos del sistema
 * Esta es la única fuente de verdad para todos los módulos.
 * Sincronizado con la tabla rbac_permissions de la base de datos.
 *
 * Estructura del menú principal:
 * - 10 opciones principales
 * - 4 opciones en submenú REPORTES
 * - 8 opciones en submenú CATALOGOS
 * - 7 opciones en submenú AJUSTES
 * - 1 módulo backend (INVENTARIO) - no visible en UI
 */
export const SYSTEM_MODULES: ModuleDefinition[] = [
  // ========================================
  // PRINCIPALES (10 módulos visibles en menú)
  // ========================================
  { key: 'DASHBOARD', title: 'Dashboard', category: 'main' },
  { key: 'SOLICITUDES', title: 'Solicitudes', category: 'main' },
  { key: 'SURTIDO', title: 'Surtido', category: 'main' },
  { key: 'ENTRADAS', title: 'Entradas', category: 'main' },
  { key: 'SALIDAS', title: 'Salidas', category: 'main' },
  { key: 'REPORTES', title: 'Reportes (Menú)', category: 'main' },
  { key: 'STOCK_FIJO', title: 'Stock Fijo', category: 'main' },
  { key: 'INVENTARIOS_FISICOS', title: 'Inventarios Físicos', category: 'main' },
  { key: 'CATALOGOS', title: 'Catálogos (Menú)', category: 'main' },
  { key: 'AJUSTES', title: 'Ajustes (Menú)', category: 'main' },

  // ========================================
  // REPORTES (4 módulos en submenú)
  // ========================================
  { key: 'REPORTES_INVENTARIO', title: 'Inventario', category: 'reportes' },
  { key: 'REPORTES_ENTRADAS_CLIENTE', title: 'Entradas por Proveedor', category: 'reportes' },
  { key: 'REPORTES_SALIDAS_CLIENTE', title: 'Salidas por Cliente', category: 'reportes' },
  { key: 'REPORTES_ROTACION_PRODUCTOS', title: 'Rotación de Productos', category: 'reportes' },

  // ========================================
  // CATÁLOGOS (8 módulos en submenú)
  // ========================================
  { key: 'CATALOGOS_PRODUCTOS', title: 'Productos', category: 'catalogos' },
  { key: 'CATALOGOS_CATEGORIAS', title: 'Categorías', category: 'catalogos' },
  { key: 'CATALOGOS_CLIENTES', title: 'Clientes', category: 'catalogos' },
  { key: 'CATALOGOS_PROVEEDORES', title: 'Proveedores', category: 'catalogos' },
  { key: 'CATALOGOS_EMPLEADOS', title: 'Empleados', category: 'catalogos' },
  { key: 'CATALOGOS_TIPOS_ENTRADA', title: 'Tipos de Entrada', category: 'catalogos' },
  { key: 'CATALOGOS_TIPOS_SALIDA', title: 'Tipos de Salida', category: 'catalogos' },
  { key: 'CATALOGOS_ALMACENES', title: 'Almacenes', category: 'catalogos' },

  // ========================================
  // AJUSTES (7 módulos en submenú)
  // ========================================
  { key: 'AJUSTES_USUARIOS', title: 'Usuarios', category: 'ajustes' },
  { key: 'AJUSTES_RBAC', title: 'Roles y Permisos (RBAC)', category: 'ajustes' },
  { key: 'AJUSTES_AUDITORIA', title: 'Auditoría', category: 'ajustes' },
  { key: 'GESTION_CATALOGOS', title: 'Gestión de Catálogos', category: 'ajustes' },
  { key: 'GESTION_REPORTES', title: 'Gestión de Reportes', category: 'ajustes' },
  { key: 'AJUSTES_ENTIDAD', title: 'Entidades', category: 'ajustes' },
  { key: 'GESTION_RESPALDOS', title: 'Gestión de Respaldos', category: 'ajustes' },

  // ========================================
  // BACKEND (1 módulo - no visible en UI)
  // ========================================
  { key: 'INVENTARIO', title: 'Inventario (Backend)', category: 'backend' },
];

/**
 * Array de claves de módulos (para compatibilidad con código existente)
 */
export const ALL_MODULES = SYSTEM_MODULES.map((m) => m.key);

/**
 * Mapa de módulos por clave (para búsquedas rápidas)
 */
export const MODULES_MAP = SYSTEM_MODULES.reduce(
  (acc, module) => {
    acc[module.key] = module;
    return acc;
  },
  {} as Record<string, ModuleDefinition>
);

/**
 * Obtener módulos por categoría
 */
export function getModulesByCategory(category: ModuleDefinition['category']) {
  return SYSTEM_MODULES.filter((m) => m.category === category);
}

/**
 * Verificar si un módulo existe
 */
export function isValidModule(moduleKey: string): boolean {
  return ALL_MODULES.includes(moduleKey);
}

/**
 * Obtener título de un módulo
 */
export function getModuleTitle(moduleKey: string): string {
  return MODULES_MAP[moduleKey]?.title || moduleKey;
}

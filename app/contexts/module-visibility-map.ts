// Mapa de equivalencias entre keys de la estructura RBAC y los módulos usados en permisos del sidebar
// Permite que toggles de visibilidad impacten correctamente elementos del menú

export const MODULE_VISIBILITY_MAP: Record<string, string[]> = {
  // Módulos principales (5)
  DASHBOARD: ['DASHBOARD'],
  SOLICITUDES: ['SOLICITUDES'],
  SURTIDO: ['SURTIDO'],
  ENTRADAS: ['ENTRADAS'],
  SALIDAS: ['SALIDAS'],

  // Reportes (2)
  REPORTES: ['REPORTES'],
  REPORTES_INVENTARIO: ['REPORTES_INVENTARIO'],
  REPORTES_SALIDAS_CLIENTE: ['REPORTES_SALIDAS_CLIENTE'],

  // Gestión (3)
  STOCK_FIJO: ['STOCK_FIJO'],
  INVENTARIOS_FISICOS: ['INVENTARIOS_FISICOS'],
  INVENTARIO: ['INVENTARIO'],

  // Catálogos principales (2)
  CATALOGOS: ['CATALOGOS'], // ✅ AGREGADO
  GESTION_CATALOGOS: ['GESTION_CATALOGOS'],

  // Catálogos específicos (8) - ✅ ACTUALIZADOS CON PREFIJO
  CATALOGOS_PRODUCTOS: ['CATALOGOS_PRODUCTOS'],
  CATALOGOS_CATEGORIAS: ['CATALOGOS_CATEGORIAS'],
  CATALOGOS_CLIENTES: ['CATALOGOS_CLIENTES'],
  CATALOGOS_PROVEEDORES: ['CATALOGOS_PROVEEDORES'],
  CATALOGOS_EMPLEADOS: ['CATALOGOS_EMPLEADOS'],
  CATALOGOS_TIPOS_ENTRADA: ['CATALOGOS_TIPOS_ENTRADA'],
  CATALOGOS_TIPOS_SALIDA: ['CATALOGOS_TIPOS_SALIDA'],
  CATALOGOS_ALMACENES: ['CATALOGOS_ALMACENES'],

  // Ajustes principales (2)
  AJUSTES: ['AJUSTES'],
  GESTION_REPORTES: ['GESTION_REPORTES'],

  // Ajustes específicos (4) - ✅ ACTUALIZADOS CON PREFIJO
  AJUSTES_USUARIOS: ['AJUSTES_USUARIOS'],
  AJUSTES_RBAC: ['AJUSTES_RBAC'],
  AJUSTES_AUDITORIA: ['AJUSTES_AUDITORIA'],
  AJUSTES_ENTIDAD: ['AJUSTES_ENTIDAD'],

  // Gestión (1)
  GESTION_RESPALDOS: ['GESTION_RESPALDOS'],
};

export function deriveEffectiveVisibility(raw: Record<string, boolean>): Record<string, boolean> {
  const effective: Record<string, boolean> = {};

  // DENY BY DEFAULT - Solo procesar módulos explícitamente configurados
  // Si un módulo no está en raw, NO debe aparecer en effective
  for (const [key, visible] of Object.entries(raw)) {
    const targets = MODULE_VISIBILITY_MAP[key] || [key];

    for (const target of targets) {
      // Si es true, mostrar (pero puede ser sobrescrito por false más adelante)
      // Si es false, ocultar (definitivo)
      // Si es undefined, NO agregarlo (deny by default)
      if (visible === true) {
        // Solo establecer en true si no ha sido establecido aún
        // Esto permite que un false posterior sobrescriba
        if (effective[target] === undefined) {
          effective[target] = true;
        }
      } else if (visible === false) {
        // False siempre sobrescribe (deny explícito)
        effective[target] = false;
      }
    }
  }

  return effective;
}

import { logger } from '@/lib/logger';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { menuItems } from '../constants';
import { GeneratedReport, MenuItem } from '../types';

// Mapa de iconos disponibles para reportes dinámicos
const iconMap: Record<string, any> = {
  ChartBarIcon,
};

/**
 * 🆕 NUEVA ARQUITECTURA RBAC v2
 *
 * Utilitarios para manejo de VISIBILIDAD en el sidebar (separado de permisos)
 *
 * CAMBIOS CRÍTICOS:
 * ✅ PERMISOS: Siempre garantizados (no se verifican aquí)
 * ✅ VISIBILIDAD: Única fuente de filtrado del sidebar
 * ✅ DEPENDENCIAS: Ya no se rompen al ocultar módulos
 */

/**
 * ⚠️ DEPRECATED en v2: Los permisos siempre están garantizados
 * Mantener por compatibilidad temporal hasta migración completa
 */
export const hasPermissionForMenuItem = (
  _permission: { modulo: string; accion: string } | undefined,
  _tienePermiso: (modulo: string, accion: string) => boolean
): boolean => {
  // 🆕 EN V2: Siempre retorna true (permisos garantizados)
  // Solo mantener para compatibilidad durante transición
  return true;
};

/**
 * 🆕 NUEVA FUNCIÓN: Filtra elementos SOLO por VISIBILIDAD
 *
 * @param generatedReports - Array de reportes generados dinámicamente
 * @param moduleVisibility - Mapa de visibilidad de módulos (nueva tabla)
 * @param isSystemUser - Si es usuario de sistema (ve todo)
 * @returns Array de elementos de menú filtrados por visibilidad
 */
export const getFilteredMenuItemsByVisibility = (
  generatedReports: GeneratedReport[],
  moduleVisibility: Record<string, boolean> = {},
  isSystemUser: boolean = false
): MenuItem[] => {
  // 👑 USUARIOS DE SISTEMA: Ven TODO siempre
  if (isSystemUser) {
    return getMenuItemsWithReports(menuItems, generatedReports);
  }

  // 🎯 FILTRADO SOLO POR VISIBILIDAD
  const filtered = menuItems.filter((item) => {
    // Sin configuración de permiso = mostrar por defecto
    if (!item.permission) return true;

    const moduleKey = item.permission.modulo;

    // ✅ NUEVA LÓGICA: Solo verificar visibilidad
    // Si no está configurado en moduleVisibility = visible por defecto
    const isVisible = moduleVisibility[moduleKey] ?? true;

    return isVisible;
  });

  // Procesar submenús y reportes dinámicos
  return getMenuItemsWithReports(filtered, generatedReports, moduleVisibility, isSystemUser);
};

/**
 * ⚠️ DEPRECATED: Función original mantenida para compatibilidad
 * Usar getFilteredMenuItemsByVisibility() en nueva arquitectura
 */
export const getFilteredMenuItems = (
  generatedReports: GeneratedReport[],
  _tienePermiso: (modulo: string, accion: string) => boolean,
  moduleVisibility?: Record<string, boolean>,
  isSystemUser: boolean = false
): MenuItem[] => {
  // 🔄 TRANSICIÓN: Delegar a nueva función
  logger.info('[SIDEBAR] Usando función deprecated - migrar a getFilteredMenuItemsByVisibility');

  return getFilteredMenuItemsByVisibility(generatedReports, moduleVisibility || {}, isSystemUser);
};

/**
 * Procesa elementos del menú añadiendo reportes dinámicos y filtrando submenús
 */
function getMenuItemsWithReports(
  items: MenuItem[],
  generatedReports: GeneratedReport[],
  moduleVisibility: Record<string, boolean> = {},
  isSystemUser: boolean = false
): MenuItem[] {
  return items.map((item) => {
    // Procesar elemento "Reportes" con reportes dinámicos
    if (item.title === 'Reportes' && item.submenu) {
      return processReportsMenu(item, generatedReports, moduleVisibility, isSystemUser);
    }

    // Procesar otros elementos con submenu
    if (item.submenu) {
      return processSubmenu(item, moduleVisibility, isSystemUser);
    }

    return item;
  });
}

/**
 * Procesa el menú de Reportes añadiendo elementos dinámicos
 */
function processReportsMenu(
  item: MenuItem,
  generatedReports: GeneratedReport[],
  moduleVisibility: Record<string, boolean>,
  isSystemUser: boolean
): MenuItem {
  if (!item.submenu) return item;

  // Filtrar subítems estáticos por visibilidad
  const filteredStaticSubmenu = item.submenu.filter((subItem) => {
    if (!subItem.permission) return true;

    const moduleKey = subItem.permission.modulo;
    const isVisible = moduleVisibility[moduleKey] ?? true;

    // Usuarios de sistema ven todo
    return isSystemUser || isVisible;
  });

  // Crear elementos de reportes dinámicos
  const dynamicReportItems = generatedReports
    .filter((_report) => true) // Todos los reportes (remover filtro is_active si no existe)
    .map((report) => ({
      title: report.name,
      href: `/dashboard/reportes/${report.slug}`,
      icon: iconMap['ChartBarIcon'] || ChartBarIcon,
      description: report.description || `Reporte: ${report.name}`,
    }));

  // Evitar duplicados
  const existingHrefs = new Set(filteredStaticSubmenu.map((subItem) => subItem.href));
  const uniqueDynamicReports = dynamicReportItems.filter(
    (reportItem) => !existingHrefs.has(reportItem.href)
  );

  // Reports processing completed

  return {
    ...item,
    submenu: [...filteredStaticSubmenu, ...uniqueDynamicReports],
  };
}

/**
 * Procesa submenús filtrando por visibilidad
 */
function processSubmenu(
  item: MenuItem,
  moduleVisibility: Record<string, boolean>,
  isSystemUser: boolean
): MenuItem {
  if (!item.submenu) return item;

  const filteredSubmenu = item.submenu.filter((subItem) => {
    if (!subItem.permission) return true;

    const moduleKey = subItem.permission.modulo;
    const isVisible = moduleVisibility[moduleKey] ?? true;

    return isSystemUser || isVisible;
  });

  return {
    ...item,
    submenu: filteredSubmenu,
  };
}

/**
 * 🆕 Hook personalizado para obtener visibilidad del sidebar
 */
export async function fetchSidebarVisibility(
  userId?: string,
  roleId?: string
): Promise<Record<string, boolean>> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (roleId) params.append('roleId', roleId);

    const response = await fetch(`/api/rbac/sidebar/visibility?${params.toString()}`);

    if (!response.ok) {
      console.error('[SIDEBAR-V2] Error fetching visibility:', response.statusText);
      return {};
    }

    const data = await response.json();
    return data.moduleVisibility || {};
  } catch (error) {
    console.error('[SIDEBAR-V2] Error in fetchSidebarVisibility:', error);
    return {};
  }
}

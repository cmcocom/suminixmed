import { logger } from '@/lib/logger';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { menuItems } from '../constants';
import { GeneratedReport, MenuItem } from '../types';

// Mapa de iconos disponibles para reportes dinámicos
const iconMap: Record<string, any> = {
  ChartBarIcon,
};

/**
 * Utilitarios para manejo de permisos en el sidebar
 *
 * CRÍTICO: Esta lógica NO debe modificarse - preserva exactamente la lógica original
 * del componente Sidebar para verificación de permisos y filtrado de menús
 */

/**
 * Verifica si el usuario tiene permisos para un elemento del menú
 * @param permission - Objeto con módulo y acción requeridos
 * @param tienePermiso - Función de verificación de permisos del hook useAuth
 * @returns boolean - true si tiene permiso o no hay permiso especificado
 */
export const hasPermissionForMenuItem = (
  permission: { modulo: string; accion: string } | undefined,
  tienePermiso: (modulo: string, accion: string) => boolean
): boolean => {
  if (!permission) return true; // Si no hay permiso especificado, mostrar por defecto

  return tienePermiso(permission.modulo, permission.accion);
};

/**
 * Filtra elementos del menú según permisos, visibilidad e incluye reportes dinámicos
 * @param generatedReports - Array de reportes generados dinámicamente
 * @param tienePermiso - Función de verificación de permisos
 * @param moduleVisibility - Mapa de visibilidad de módulos (opcional)
 * @returns Array de elementos de menú filtrados con reportes dinámicos incluidos
 */
export const getFilteredMenuItems = (
  generatedReports: GeneratedReport[],
  tienePermiso: (modulo: string, accion: string) => boolean,
  moduleVisibility?: Record<string, boolean>,
  isSystemUser: boolean = false
): MenuItem[] => {
  const filtered = menuItems
    .filter((item) => {
      // ✅ PASO 1: Verificar permisos (esto incluye usuarios sistema)
      if (!hasPermissionForMenuItem(item.permission, tienePermiso)) {
        return false;
      }

      // ✅ PASO 2: Verificar visibilidad RBAC
      // Nota: aplicar la verificación SOLO si el módulo está explícitamente presente
      // en el mapa `moduleVisibility`. Evita que un mapa parcial (p.ej. solo algunos
      // módulos configurados) provoque un "deny by default" global sobre el resto
      // de módulos. Si el mapa está vacío o el módulo no está presente, se respeta
      // la decisión basada en permisos únicamente.
      if (
        !isSystemUser &&
        moduleVisibility &&
        item.permission &&
        Object.prototype.hasOwnProperty.call(moduleVisibility, item.permission.modulo)
      ) {
        const moduleKey = item.permission.modulo;
        const isVisible = moduleVisibility[moduleKey];

        if (isVisible !== true) {
          return false;
        }
      }

      return true;
    })
    .map((item) => {
      // Si es el item de Reportes, agregar los reportes dinámicos al submenu
      if (item.title === 'Reportes' && item.submenu) {
        // Filtrar subítems estáticos según permisos y visibilidad
        const filteredStaticSubmenu = item.submenu.filter((subItem) => {
          // Verificar permisos para subítems
          if (!hasPermissionForMenuItem(subItem.permission, tienePermiso)) {
            return false;
          }

          // Verificar visibilidad para subítems - DENEGAR POR DEFECTO
          if (
            !isSystemUser &&
            moduleVisibility &&
            subItem.permission &&
            Object.prototype.hasOwnProperty.call(moduleVisibility, subItem.permission.modulo)
          ) {
            const moduleKey = subItem.permission.modulo;
            const isVisible = moduleVisibility[moduleKey];
            // Solo mostrar si está explícitamente visible (granted=true)
            if (isVisible !== true) {
              return false;
            }
          }
          return true;
        });

        // Obtener todos los href existentes de los subítems estáticos para evitar duplicados
        const existingHrefs = new Set(filteredStaticSubmenu.map((subItem) => subItem.href));

        logger.debug('🔍 DEBUG REPORTES - Hrefs estáticos:', Array.from(existingHrefs));
        logger.debug(
          '🔍 DEBUG REPORTES - Reportes dinámicos recibidos:',
          generatedReports.map((r) => ({ name: r.name, slug: r.slug }))
        );

        // Crear reportes dinámicos y filtrar duplicados
        const dynamicReportItems = generatedReports
          .map((report) => {
            const href = `/dashboard/reportes/${report.slug}`;
            const isDuplicate = existingHrefs.has(href);
            logger.debug(
              `🔍 DEBUG - Reporte "${report.name}": href=${href}, isDuplicate=${isDuplicate}`
            );
            return {
              title: report.name,
              href,
              icon: report.icon ? iconMap[report.icon] : ChartBarIcon,
              permission: { modulo: 'REPORTES', accion: 'LEER' },
            };
          })
          .filter(
            (dynamicItem) =>
              // Solo incluir si tiene permisos Y no es duplicado
              hasPermissionForMenuItem(dynamicItem.permission, tienePermiso) &&
              !existingHrefs.has(dynamicItem.href)
          );

        logger.debug(
          '🔍 DEBUG REPORTES - Items finales del submenu:',
          [...filteredStaticSubmenu, ...dynamicReportItems].map((i) => ({
            title: i.title,
            href: i.href,
          }))
        );

        return {
          ...item,
          submenu: [...filteredStaticSubmenu, ...dynamicReportItems],
        };
      }

      // Para otros items con submenu, filtrar según permisos y visibilidad
      if (item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem) => {
          // Verificar permisos para subítems
          if (!hasPermissionForMenuItem(subItem.permission, tienePermiso)) {
            return false;
          }

          // Verificar visibilidad para subítems - aplicar solo si existe la clave
          if (
            !isSystemUser &&
            moduleVisibility &&
            subItem.permission &&
            Object.prototype.hasOwnProperty.call(moduleVisibility, subItem.permission.modulo)
          ) {
            const moduleKey = subItem.permission.modulo;
            const isVisible = moduleVisibility[moduleKey];
            // Solo mostrar si está explícitamente visible (granted=true)
            if (isVisible !== true) {
              return false;
            }
          }

          return true;
        });

        return {
          ...item,
          submenu: filteredSubmenu,
        };
      }

      return item;
    })
    // Filtrar items que pueden haber quedado sin submenu después del filtrado
    .filter((item) => !item.submenu || item.submenu.length > 0);

  return filtered;
};

/**
 * Verifica si un menú debe estar expandido basado en la ruta actual
 * @param item - Elemento del menú
 * @param pathname - Ruta actual
 * @returns boolean - true si debe estar expandido
 */
export const shouldMenuBeExpanded = (item: MenuItem, pathname: string): boolean => {
  if (!item.submenu) return false;

  return item.submenu.some((subItem) => pathname.startsWith(subItem.href));
};

/**
 * Verifica si una ruta está activa
 * @param href - Ruta a verificar
 * @param pathname - Ruta actual
 * @returns boolean - true si está activa
 */
export const isRouteActive = (href: string, pathname: string): boolean => {
  // Si el href es un ancla (#), nunca está activo (es solo un contenedor de submenú)
  if (href.startsWith('#')) {
    return false;
  }

  // Verificación exacta
  if (pathname === href) {
    return true;
  }

  // Solo permitir coincidencias con parámetros de query, no con subrutas
  if (href !== '/dashboard' && pathname.startsWith(href)) {
    const nextChar = pathname.charAt(href.length);
    // Solo permitir ? para query params, no / para subrutas
    return nextChar === '?' || nextChar === '';
  }

  return false;
};

/**
 * Obtiene la clase CSS para un elemento del menú basado en si está activo
 * @param href - Ruta del elemento del menú
 * @param pathname - Ruta actual
 * @returns string - Clases CSS aplicables
 */
export const getMenuItemClasses = (href: string, pathname: string): string => {
  const baseClasses =
    'w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 border border-transparent backdrop-blur-sm sidebar-animate';
  const isActive = isRouteActive(href, pathname);

  if (isActive) {
    return `${baseClasses} sidebar-nav-item-active`;
  }

  return `${baseClasses} sidebar-nav-item`;
};

/**
 * Obtiene la clase CSS para un elemento de submenú
 * @param href - Ruta del elemento del submenú
 * @param pathname - Ruta actual
 * @returns string - Clases CSS aplicables
 */
export const getSubmenuItemClasses = (href: string, pathname: string): string => {
  const baseClasses =
    'group flex items-center w-full pl-8 pr-4 py-3 text-sm text-left transition-all duration-300 border-l-4 sidebar-animate hover:shadow-md relative';
  const isActive = isRouteActive(href, pathname);

  if (isActive) {
    return `${baseClasses} sidebar-submenu-item-active bg-gradient-to-r from-blue-600/40 to-blue-500/25 border-l-blue-400 text-blue-100 font-medium`;
  }

  return `${baseClasses} sidebar-submenu-item border-l-slate-700/50 hover:border-l-blue-400/80 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/40 text-slate-300 hover:text-white hover:font-medium`;
};

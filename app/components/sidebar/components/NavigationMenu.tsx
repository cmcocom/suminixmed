import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useModuleVisibility } from '../../../contexts/ModuleVisibilityContext';
import { NavigationMenuProps } from '../types';
import { getMenuItemClasses, getSubmenuItemClasses } from '../utils/permissions';
import { getFilteredMenuItemsByVisibility } from '../utils/permissions-v2';

/**
 * Componente NavigationMenu - Menú de navegación principal del sidebar
 *
 * Funcionalidades:
 * - Navegación principal con iconos
 * - Submenús expandibles
 * - Filtrado por permisos
 * - Reportes dinámicos
 * - Estados activos/inactivos
 * - Responsive según estado del sidebar
 *
 * @param props - Props del componente NavigationMenu
 */
export function NavigationMenu({
  isSidebarOpen,
  openSubmenu,
  toggleSubmenu,
  generatedReports,
  tienePermiso: _tienePermiso, // 🆕 RBAC V2: No se usa, mantenido para compatibilidad
  isSystemUser,
  permissionsLoading = false,
  onMenuClick,
}: NavigationMenuProps) {
  const pathname = usePathname();
  const { effectiveVisibility } = useModuleVisibility();

  // 🆕 RBAC V2: Solo filtrar por visibilidad, permisos están garantizados
  const filteredMenuItems = getFilteredMenuItemsByVisibility(
    generatedReports,
    effectiveVisibility,
    !!isSystemUser
  );

  // Debug: monitorear cambios en visibilidad
  useEffect(() => {
    if (effectiveVisibility && Object.keys(effectiveVisibility).length > 0) {
      // Visibility data loaded
    }
  }, [effectiveVisibility]);

  // Mostrar skeleton mientras cargan los permisos
  if (permissionsLoading) {
    return (
      <nav className="flex-1 overflow-y-auto py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${isSidebarOpen ? 'mx-2' : ''} mb-2`}>
            <div className="h-12 bg-slate-700/30 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {filteredMenuItems.map((item) => (
        <div key={item.title}>
          {item.submenu ? (
            // Elemento con submenú
            <>
              <button
                onClick={() => toggleSubmenu(item.title)}
                className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 border border-transparent backdrop-blur-sm sidebar-animate sidebar-nav-item ${
                  isSidebarOpen ? 'mx-2' : ''
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
              >
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 sidebar-nav-icon ${isSidebarOpen ? 'mr-3' : ''}`}
                />
                <span className={!isSidebarOpen ? 'lg:hidden' : 'flex-1 text-left'}>
                  {item.title}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 ml-auto transition-transform duration-200 sidebar-nav-icon ${
                    openSubmenu === item.title ? 'rotate-180' : ''
                  } ${!isSidebarOpen ? 'lg:hidden' : ''}`}
                />
              </button>

              {/* Submenú con estilo mejorado */}
              {openSubmenu === item.title && isSidebarOpen && (
                <div className="mt-1 mb-2 mx-2 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm border border-slate-600/50 shadow-xl ring-1 ring-slate-700/30">
                  {item.submenu.map((subItem, index) => {
                    const SubIcon = subItem.icon;
                    return (
                      <div key={subItem.href} className="relative">
                        {index > 0 && <div className="mx-4 border-t border-slate-700/30"></div>}
                        <Link
                          href={subItem.href}
                          className={`${getSubmenuItemClasses(subItem.href, pathname)} ${!isSidebarOpen ? 'justify-center' : ''}`}
                          onClick={onMenuClick}
                        >
                          <span
                            className={`flex items-center ${!isSidebarOpen && 'justify-center'}`}
                          >
                            {SubIcon && (
                              <SubIcon
                                className={`w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors duration-200 ${isSidebarOpen ? 'mr-3' : ''}`}
                              />
                            )}
                            <span className={!isSidebarOpen ? 'lg:hidden' : ''}>
                              {subItem.title}
                            </span>
                          </span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            // Elemento simple sin submenú
            <Link
              href={item.href}
              className={`${getMenuItemClasses(item.href, pathname)} ${isSidebarOpen ? 'mx-2' : ''} ${!isSidebarOpen ? 'justify-center' : ''}`}
              onClick={onMenuClick}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 sidebar-nav-icon ${isSidebarOpen ? 'mr-3' : ''}`}
              />
              <span className={!isSidebarOpen ? 'lg:hidden' : ''}>{item.title}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

'use client';

import { useCallback, useState } from 'react';

interface SidebarControlPanelProps {
  selectedRole: { id: string; name: string; description: string | null } | null;
  onModuleVisibilityToggle?: (moduleKey: string, visible: boolean) => void;
  moduleVisibility?: Record<string, boolean>;
  isLoading?: boolean;
  onReload?: () => void;
}

interface SidebarOption {
  key: string;
  title: string;
  icon: string;
  description: string;
  submenu?: SidebarOption[];
}

// ========================================================================
// SIDEBAR OPTIONS - SINCRONIZADO 100% CON MENÚ PRINCIPAL REAL (30 módulos)
// ========================================================================
// IMPORTANTE: Los 'key' deben coincidir EXACTAMENTE con rbac_permissions.module
//
// Estructura:
// - 10 opciones principales (DASHBOARD, SOLICITUDES, SURTIDO, ENTRADAS, SALIDAS,
//                            REPORTES, STOCK_FIJO, INVENTARIOS_FISICOS, CATALOGOS, AJUSTES)
// - 4 opciones en submenú REPORTES
// - 8 opciones en submenú CATALOGOS
// - 7 opciones en submenú AJUSTES
// - 1 módulo backend (INVENTARIO) - no visible en menú UI
// ========================================================================
const SIDEBAR_OPTIONS: SidebarOption[] = [
  {
    key: 'DASHBOARD',
    title: 'Dashboard',
    icon: '📊',
    description: 'Panel principal del sistema',
  },
  {
    key: 'SOLICITUDES',
    title: 'Solicitudes',
    icon: '📄',
    description: 'Gestión de solicitudes',
  },
  {
    key: 'SURTIDO',
    title: 'Surtido',
    icon: '🔧',
    description: 'Gestión de surtido',
  },
  {
    key: 'ENTRADAS',
    title: 'Entradas',
    icon: '📥',
    description: 'Gestión de entradas de inventario',
  },
  {
    key: 'SALIDAS',
    title: 'Salidas',
    icon: '📤',
    description: 'Gestión de salidas de inventario',
  },
  {
    key: 'REPORTES',
    title: 'Reportes',
    icon: '📈',
    description: 'Generación y visualización de reportes',
    submenu: [
      {
        key: 'REPORTES_INVENTARIO',
        title: 'Inventario',
        icon: '📦',
        description: 'Reporte de estado actual del inventario',
      },
      {
        key: 'REPORTES_ENTRADAS_CLIENTE',
        title: 'Entradas por Proveedor',
        icon: '📥',
        description: 'Reporte de entradas agrupadas por proveedor',
      },
      {
        key: 'REPORTES_SALIDAS_CLIENTE',
        title: 'Salidas por Cliente',
        icon: '📤',
        description: 'Reporte de salidas agrupadas por cliente',
      },
      {
        key: 'REPORTES_ROTACION_PRODUCTOS',
        title: 'Rotación de Productos',
        icon: '🔄',
        description: 'Análisis de rotación con entradas, salidas y existencias',
      },
    ],
  },
  {
    key: 'STOCK_FIJO',
    title: 'Stock Fijo',
    icon: '✅',
    description: 'Gestión de stock fijo',
  },
  {
    key: 'INVENTARIOS_FISICOS',
    title: 'Inventarios Físicos',
    icon: '📋',
    description: 'Gestión de inventarios físicos',
  },
  {
    key: 'CATALOGOS',
    title: 'Catálogos',
    icon: '📚',
    description: 'Catálogos del sistema',
    submenu: [
      {
        key: 'CATALOGOS_PRODUCTOS',
        title: 'Productos',
        icon: '🏷️',
        description: 'Gestión de productos',
      },
      {
        key: 'CATALOGOS_CATEGORIAS',
        title: 'Categorías',
        icon: '🏪',
        description: 'Gestión de categorías de productos',
      },
      {
        key: 'CATALOGOS_CLIENTES',
        title: 'Clientes',
        icon: '👥',
        description: 'Gestión de clientes',
      },
      {
        key: 'CATALOGOS_PROVEEDORES',
        title: 'Proveedores',
        icon: '🏢',
        description: 'Gestión de proveedores',
      },
      {
        key: 'CATALOGOS_EMPLEADOS',
        title: 'Empleados',
        icon: '👷',
        description: 'Gestión de empleados',
      },
      {
        key: 'CATALOGOS_TIPOS_ENTRADA',
        title: 'Tipos de Entrada',
        icon: '📥',
        description: 'Catálogo de tipos de entrada',
      },
      {
        key: 'CATALOGOS_TIPOS_SALIDA',
        title: 'Tipos de Salida',
        icon: '📤',
        description: 'Catálogo de tipos de salida',
      },
      {
        key: 'CATALOGOS_ALMACENES',
        title: 'Almacenes',
        icon: '🏭',
        description: 'Gestión de almacenes',
      },
    ],
  },
  {
    key: 'AJUSTES',
    title: 'Ajustes',
    icon: '⚙️',
    description: 'Configuración del sistema',
    submenu: [
      {
        key: 'AJUSTES_USUARIOS',
        title: 'Usuarios',
        icon: '👤',
        description: 'Gestión de usuarios del sistema',
      },
      {
        key: 'AJUSTES_RBAC',
        title: 'Roles y Permisos',
        icon: '🛡️',
        description: 'Gestión de roles y permisos (RBAC)',
      },
      {
        key: 'AJUSTES_AUDITORIA',
        title: 'Auditoría del Sistema',
        icon: '📋',
        description: 'Registro de actividades y auditoría',
      },
      {
        key: 'GESTION_CATALOGOS',
        title: 'Gestión de Catálogos',
        icon: '📚',
        description: 'Gestión de catálogos',
      },
      {
        key: 'GESTION_REPORTES',
        title: 'Gestión de Reportes',
        icon: '📊',
        description: 'Configuración de reportes',
      },
      {
        key: 'AJUSTES_ENTIDAD',
        title: 'Entidades',
        icon: '🏢',
        description: 'Gestión de entidades del sistema',
      },
      {
        key: 'GESTION_RESPALDOS',
        title: 'Respaldos de Base de Datos',
        icon: '💾',
        description: 'Sistema de respaldos automáticos',
      },
    ],
  },
];

export default function SidebarControlPanel({
  selectedRole,
  onModuleVisibilityToggle,
  moduleVisibility = {},
  isLoading = false,
  onReload,
}: SidebarControlPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleModuleToggle = useCallback(
    async (moduleKey: string, visible: boolean) => {
      if (!selectedRole || !onModuleVisibilityToggle) return;

      setLoading(true);
      try {
        await onModuleVisibilityToggle(moduleKey, visible);
      } catch (error) {
        console.error(`[SIDEBAR_CONTROL] Error toggling module ${moduleKey}:`, error);
      } finally {
        setLoading(false);
      }
    },
    [selectedRole, onModuleVisibilityToggle]
  );

  const renderOption = (option: SidebarOption, level: number = 0) => {
    const isVisible = moduleVisibility[option.key] ?? false;
    const indentClass = level === 0 ? '' : 'ml-8';

    return (
      <div key={option.key} className={`mb-4 ${indentClass}`}>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-2xl">{option.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{option.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => handleModuleToggle(option.key, e.target.checked)}
              disabled={loading || isLoading || !selectedRole}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {option.submenu && (
          <div className="mt-2 ml-4 space-y-2">
            {option.submenu.map((subOption) => renderOption(subOption, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Control de Visibilidad del Menú
          </h3>
          {selectedRole && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Rol: <span className="font-medium">{selectedRole.name}</span>
            </p>
          )}
        </div>
        {onReload && (
          <button
            onClick={onReload}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cargando...' : 'Recargar'}
          </button>
        )}
      </div>

      {!selectedRole && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Selecciona un rol para configurar la visibilidad del menú
        </div>
      )}

      {selectedRole && (
        <div className="space-y-2">{SIDEBAR_OPTIONS.map((option) => renderOption(option))}</div>
      )}
    </div>
  );
}

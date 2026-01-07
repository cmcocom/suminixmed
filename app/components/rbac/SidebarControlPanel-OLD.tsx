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

// Definir todas las opciones del sidebar - Sincronizado con módulos reales de BD
// IMPORTANTE: Los 'key' deben coincidir EXACTAMENTE con los nombres en rbac_permissions.module
const SIDEBAR_OPTIONS: SidebarOption[] = [
  {
    key: 'DASHBOARD',
    title: 'Dashboard',
    icon: '📊',
    description: 'Panel principal del sistema',
  },
  {
    key: 'INVENTARIO',
    title: 'Inventario',
    icon: '�',
    description: 'Gestión de inventario general',
  },
  {
    key: 'KARDEX',
    title: 'Kardex',
    icon: '�',
    description: 'Control de movimientos de inventario',
  },
  {
    key: 'LOTES',
    title: 'Lotes',
    icon: '🏷️',
    description: 'Gestión de lotes de productos',
  },
  {
    key: 'TRANSFERENCIAS',
    title: 'Transferencias',
    icon: '�',
    description: 'Transferencias entre ubicaciones',
  },
  {
    key: 'REPORTES',
    title: 'Reportes',
    icon: '📈',
    description: 'Generación y visualización de reportes',
    submenu: [
      {
        key: 'REPORTES_ENTRADAS',
        title: 'Entradas',
        icon: '📥',
        description: 'Reporte de entradas al inventario',
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
        icon: '�',
        description: 'Reporte de salidas agrupadas por cliente',
      },
      {
        key: 'REPORTES_TRANSFERENCIAS',
        title: 'Transferencias',
        icon: '🔄',
        description: 'Reporte de transferencias realizadas',
      },
    ],
  },
  {
    key: 'CATALOGOS',
    title: 'Catálogos',
    icon: '📚',
    description: 'Catálogos del sistema',
    submenu: [
      {
        key: 'CATALOGOS_CLIENTES',
        title: 'Clientes',
        icon: '�',
        description: 'Gestión de clientes',
      },
      {
        key: 'CATALOGOS_PROVEEDORES',
        title: 'Proveedores',
        icon: '�',
        description: 'Gestión de proveedores',
      },
      {
        key: 'CATALOGOS_CATEGORIAS',
        title: 'Categorías',
        icon: '🏪',
        description: 'Gestión de categorías de productos',
      },
      {
        key: 'CATALOGOS_AREAS',
        title: 'Áreas',
        icon: '🏭',
        description: 'Gestión de áreas o departamentos',
      },
      {
        key: 'CATALOGOS_GRUPOS',
        title: 'Grupos',
        icon: '👥',
        description: 'Gestión de grupos de clasificación',
      },
      {
        key: 'CATALOGOS_PRESENTACIONES',
        title: 'Presentaciones',
        icon: '�',
        description: 'Presentaciones de productos',
      },
      {
        key: 'CATALOGOS_UNIDADES_MEDIDA',
        title: 'Unidades de Medida',
        icon: '⚖️',
        description: 'Catálogo de unidades de medida',
      },
      {
        key: 'CATALOGOS_TIPOS_MOVIMIENTO',
        title: 'Tipos de Movimiento',
        icon: '�',
        description: 'Catálogo de tipos de movimiento de inventario',
      },
      {
        key: 'CATALOGOS_UBICACIONES_INVENTARIO',
        title: 'Ubicaciones de Inventario',
        icon: '📍',
        description: 'Gestión de ubicaciones de almacenamiento',
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
        key: 'GESTION_USUARIOS',
        title: 'Gestión de Usuarios',
        icon: '👥',
        description: 'Administración avanzada de usuarios',
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
        key: 'AJUSTES_ENTIDAD',
        title: 'Entidades',
        icon: '🏢',
        description: 'Gestión de entidades del sistema',
      },
      {
        key: 'AJUSTES_SISTEMA',
        title: 'Sistema',
        icon: '�️',
        description: 'Configuración general del sistema',
      },
      {
        key: 'AJUSTES_SESIONES',
        title: 'Sesiones',
        icon: '🔐',
        description: 'Gestión de sesiones activas',
      },
      {
        key: 'AJUSTES_NOTIFICACIONES',
        title: 'Notificaciones',
        icon: '🔔',
        description: 'Configuración de notificaciones',
      },
      {
        key: 'AJUSTES_INDICADORES',
        title: 'Indicadores',
        icon: '📊',
        description: 'Gestión de indicadores del sistema',
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
        console.error('Error toggling module:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedRole, onModuleVisibilityToggle]
  );

  const renderOption = (option: SidebarOption, level = 0) => {
    const isVisible = moduleVisibility[option.key] ?? true;
    const indentClass = level > 0 ? 'ml-6' : '';

    return (
      <div key={option.key} className={`${indentClass} mb-2`}>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{option.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{option.title}</h4>
                {/* Indicador visual de estado */}
                {isVisible ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                    title="Módulo activo con todos los permisos"
                  >
                    ✅ Activo
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                    title="Módulo inactivo sin permisos"
                  >
                    ⛔ Inactivo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleModuleToggle(option.key, !isVisible)}
              disabled={loading}
              title={
                isVisible
                  ? `Desactivar ${option.title} (revoca todos los permisos del módulo)`
                  : `Activar ${option.title} (otorga todos los permisos del módulo)`
              }
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isVisible ? 'bg-green-600' : 'bg-gray-300'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${isVisible ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Submenú si existe */}
        {option.submenu && option.submenu.map((subOption) => renderOption(subOption, level + 1))}
      </div>
    );
  };

  if (!selectedRole) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📋</div>
        <p>Selecciona un rol para configurar la visibilidad del sidebar</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Control de Visibilidad - {selectedRole.name}
            </h3>
            <p className="text-sm text-gray-600">
              Los cambios se aplican inmediatamente a todos los permisos del módulo
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onReload?.()}
              disabled={isLoading}
              title="Recargar configuración desde la base de datos"
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isLoading ? '🔄 Cargando...' : '🔄 Recargar'}
            </button>
          </div>
        </div>

        {/* Mensaje informativo actualizado */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800 flex items-start gap-2">
            <span className="text-sm">ℹ️</span>
            <span>
              <strong>Cambios automáticos:</strong> Al activar un módulo se otorgan TODOS sus
              permisos (LEER, CREAR, EDITAR, ELIMINAR, EXPORTAR). Al desactivarlo, se revocan todos
              los permisos. Los cambios son instantáneos.
            </span>
          </p>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading || isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500">Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-3">{SIDEBAR_OPTIONS.map((option) => renderOption(option))}</div>
        )}
      </div>

      {/* Footer con resumen */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Opciones visibles:</span>
            <span className="ml-2 text-green-600">
              {Object.values(moduleVisibility).filter(Boolean).length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Opciones ocultas:</span>
            <span className="ml-2 text-red-600">
              {Object.values(moduleVisibility).filter((v) => !v).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

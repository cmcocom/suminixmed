'use client';

import { useState } from 'react';
import {
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  assigned: boolean;
}

interface ModuleInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  permissions: Permission[];
  permissionCount: number;
  assignedCount: number;
}

interface PermissionPanelProps {
  selectedModule: ModuleInfo | null;
  selectedRole?: { id: string; name: string } | null;
  onPermissionToggle: (permissionId: string, assigned: boolean) => void;
  loading?: boolean;
  updating?: boolean;
  collapsed?: boolean;
}

export default function PermissionPanel({
  selectedModule,
  selectedRole = null,
  onPermissionToggle,
  loading = false,
  updating = false,
  collapsed = false,
}: PermissionPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Si está colapsado, mostrar solo un resumen
  if (collapsed) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">
          <div className="text-2xl mb-2">🔐</div>
          <div className="text-sm font-medium">Permisos</div>
          {selectedModule ? (
            <div className="text-xs">
              {selectedModule.assignedCount}/{selectedModule.permissionCount} asignados
            </div>
          ) : (
            <div className="text-xs">Selecciona un módulo</div>
          )}
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
          <p className="text-center text-gray-400">
            {selectedRole
              ? `Elige un módulo de la lista izquierda para gestionar los permisos del rol "${selectedRole.name}"`
              : 'Selecciona un rol y luego un módulo para gestionar permisos'}
          </p>
        </div>
      </div>
    );
  }

  // Filtrar permisos según búsqueda y filtro
  const filteredPermissions = selectedModule.permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && permission.assigned) ||
      (filter === 'unassigned' && !permission.assigned);

    return matchesSearch && matchesFilter;
  });

  // Agrupar permisos por acción
  const groupedPermissions = filteredPermissions.reduce(
    (acc, permission) => {
      const action = permission.action;
      if (!acc[action]) {
        acc[action] = [];
      }
      acc[action].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const getActionIcon = (action: string) => {
    const icons = {
      VER: '👁️',
      CREAR: '➕',
      EDITAR: '✏️',
      ELIMINAR: '🗑️',
      ADMINISTRAR: '⚙️',
      EXPORTAR: '📤',
      IMPORTAR: '📥',
      APROBAR: '✅',
      RECHAZAR: '❌',
    };
    return icons[action as keyof typeof icons] || '🔐';
  };

  const getActionColor = (action: string) => {
    const colors = {
      VER: 'bg-blue-100 text-blue-800',
      CREAR: 'bg-green-100 text-green-800',
      EDITAR: 'bg-yellow-100 text-yellow-800',
      ELIMINAR: 'bg-red-100 text-red-800',
      ADMINISTRAR: 'bg-purple-100 text-purple-800',
      EXPORTAR: 'bg-indigo-100 text-indigo-800',
      IMPORTAR: 'bg-cyan-100 text-cyan-800',
      APROBAR: 'bg-emerald-100 text-emerald-800',
      RECHAZAR: 'bg-rose-100 text-rose-800',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-2xl">{selectedModule.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Permisos de {selectedModule.name}
              {selectedRole && (
                <span className="text-sm font-normal text-blue-600">para {selectedRole.name}</span>
              )}
            </h3>
            <p className="text-sm text-gray-500">{selectedModule.description}</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{selectedModule.assignedCount} asignados</span>
          </div>
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600">
              {selectedModule.permissionCount - selectedModule.assignedCount} sin asignar
            </span>
          </div>
          <div className="text-sm text-gray-500">Total: {selectedModule.permissionCount}</div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filtro */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            title="Filtrar permisos por estado"
            aria-label="Filtrar permisos por estado"
          >
            <option value="all">Todos</option>
            <option value="assigned">Asignados</option>
            <option value="unassigned">Sin asignar</option>
          </select>
        </div>
      </div>

      {/* Lista de permisos */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>No se encontraron permisos</p>
              <p className="text-sm text-gray-400 mt-1">Prueba ajustando los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([action, permissions]) => (
                <div key={action} className="space-y-3">
                  {/* Header de acción */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getActionIcon(action)}</span>
                    <h4 className="font-medium text-gray-900">{action}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(action)}`}>
                      {permissions.length} permiso{permissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Lista de permisos */}
                  <div className="space-y-2 ml-6">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className={`
                          p-3 border rounded-lg transition-all duration-200
                          ${
                            permission.assigned
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                          ${updating ? 'opacity-50 pointer-events-none' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900 truncate">
                                {permission.name}
                              </h5>
                              {permission.assigned && (
                                <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            {permission.description && (
                              <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-500">
                                Módulo: {permission.module}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                Acción: {permission.action}
                              </span>
                            </div>
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() => onPermissionToggle(permission.id, !permission.assigned)}
                            disabled={updating}
                            className={`
                              ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              ${permission.assigned ? 'bg-green-600' : 'bg-gray-200'}
                              ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            <span
                              className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                ${permission.assigned ? 'translate-x-5' : 'translate-x-0'}
                              `}
                            >
                              {permission.assigned ? (
                                <CheckIcon className="h-3 w-3 text-green-600 m-1" />
                              ) : (
                                <XMarkIcon className="h-3 w-3 text-gray-400 m-1" />
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer con acciones rápidas */}
      {selectedModule && !loading && filteredPermissions.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {filteredPermissions.length} de {selectedModule.permissionCount} permisos
              {selectedRole && (
                <span className="ml-2 text-blue-600">del rol {selectedRole.name}</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  filteredPermissions
                    .filter((p) => !p.assigned)
                    .forEach((p) => onPermissionToggle(p.id, true));
                }}
                disabled={updating || filteredPermissions.every((p) => p.assigned)}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Asignar todos
              </button>
              <button
                onClick={() => {
                  filteredPermissions
                    .filter((p) => p.assigned)
                    .forEach((p) => onPermissionToggle(p.id, false));
                }}
                disabled={updating || filteredPermissions.every((p) => !p.assigned)}
                className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Quitar todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

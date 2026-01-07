'use client';

import { useState, useEffect } from 'react';
import apiFetch from '@/lib/fetcher';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

interface PermissionManagementPanelProps {
  updating: boolean;
  setUpdating: (updating: boolean) => void;
}

interface PermissionFormData {
  name: string;
  description: string;
  module: string;
  action: string;
  is_active: boolean;
}

export default function PermissionManagementPanel({
  updating,
  setUpdating,
}: PermissionManagementPanelProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    description: '',
    module: '',
    action: '',
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Cargar permisos
  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/rbac/permissions');

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data || []);
        setModules(data.modules?.map((m: { module: string }) => m.module) || []);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // Filtrar permisos
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !moduleFilter || permission.module === moduleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && permission.is_active) ||
      (statusFilter === 'inactive' && !permission.is_active);

    return matchesSearch && matchesModule && matchesStatus;
  });

  // Agrupar permisos por módulo
  const groupedPermissions = filteredPermissions.reduce(
    (acc, permission) => {
      const moduleKey = permission.module;
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      module: '',
      action: '',
      is_active: true,
    });
    setEditingPermission(null);
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.module.trim() || !formData.action.trim()) {
      alert('Nombre, módulo y acción son requeridos');
      return;
    }

    try {
      setUpdating(true);
      const response = await apiFetch('/api/rbac/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        loadPermissions();
        alert('Permiso creado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear permiso');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPermission || !formData.name.trim()) {
      alert('El nombre del permiso es requerido');
      return;
    }

    try {
      setUpdating(true);
      const response = await apiFetch(`/api/rbac/permissions/${editingPermission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingPermission(null);
        resetForm();
        loadPermissions();
        alert('Permiso actualizado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar permiso');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el permiso "${permission.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await apiFetch(`/api/rbac/permissions/${permission.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadPermissions();
        alert('Permiso eliminado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar permiso');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || '',
      module: permission.module,
      action: permission.action,
      is_active: permission.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingPermission(null);
    resetForm();
  };

  const getModuleIcon = (module: string) => {
    const icons: Record<string, string> = {
      DASHBOARD: '📊',
      USUARIOS: '👥',
      RBAC: '🔐',
      INVENTARIO: '📦',
      CATEGORIAS: '📂',
      CLIENTES: '🏥',
      PROVEEDORES: '🏭',
      AJUSTES_ENTIDAD: '🏢', // ✅ Actualizado de ENTIDADES a AJUSTES_ENTIDAD
      STOCK_FIJO: '📋',
      REPORTES: '📑',
      INDICADORES: '📈',
      SESIONES: '🔄',
      AUDITORIA: '📜',
      CONFIGURACION: '⚙️',
      UPLOAD: '📤',
    };
    return icons[module] || '🔐';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h2>
          <p className="text-gray-600">Administra los permisos disponibles en el sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={updating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Crear Permiso
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search-permissions" className="sr-only">
              Buscar permisos
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search-permissions"
                type="text"
                placeholder="Buscar permisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="module-filter" className="sr-only">
              Filtrar por módulo
            </label>
            <select
              id="module-filter"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los módulos</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {getModuleIcon(module)} {module}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de permisos agrupados por módulo */}
      <div className="space-y-6">
        {Object.keys(groupedPermissions).length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow border">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No se encontraron permisos</h3>
            <p className="text-sm text-gray-500">
              {permissions.length === 0
                ? 'Crea tu primer permiso para comenzar'
                : 'Ajusta los filtros de búsqueda para encontrar permisos'}
            </p>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <div key={module} className="bg-white rounded-lg shadow border overflow-hidden">
              {/* Header del módulo */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getModuleIcon(module)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{module}</h3>
                    <p className="text-sm text-gray-600">
                      {modulePermissions.length} permiso{modulePermissions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de permisos del módulo */}
              <div className="divide-y divide-gray-200">
                {modulePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={`p-6 transition-all ${
                      editingPermission?.id === permission.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {editingPermission?.id === permission.id ? (
                      // Formulario de edición
                      <form onSubmit={handleEditPermission} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="edit-name"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Nombre del Permiso
                            </label>
                            <input
                              id="edit-name"
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="edit-action"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Acción
                            </label>
                            <input
                              id="edit-action"
                              type="text"
                              value={formData.action}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, action: e.target.value }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="edit-description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Descripción
                          </label>
                          <textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Permiso activo</span>
                          </label>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={updating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Vista normal del permiso
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{permission.name}</h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                permission.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {permission.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              {permission.action}
                            </span>
                          </div>
                          {permission.description && (
                            <p className="text-gray-600 mt-1">{permission.description}</p>
                          )}

                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Módulo: {permission.module}</span>
                            <span>Acción: {permission.action}</span>
                            <span>
                              Creado: {new Date(permission.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => startEdit(permission)}
                            disabled={updating}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                            title="Editar permiso"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePermission(permission)}
                            disabled={updating}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Eliminar permiso"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Permiso</h3>

            <form onSubmit={handleCreatePermission} className="space-y-4">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre del Permiso *
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Ver Reportes Avanzados"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="create-module"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Módulo *
                  </label>
                  <input
                    id="create-module"
                    type="text"
                    value={formData.module}
                    onChange={(e) => setFormData((prev) => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="REPORTES"
                  />
                </div>
                <div>
                  <label
                    htmlFor="create-action"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Acción *
                  </label>
                  <input
                    id="create-action"
                    type="text"
                    value={formData.action}
                    onChange={(e) => setFormData((prev) => ({ ...prev, action: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="LEER_AVANZADO"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="create-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Descripción
                </label>
                <textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe qué permite hacer este permiso..."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Permiso activo</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Creando...' : 'Crear Permiso'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{permissions.length}</div>
          <div className="text-sm text-blue-600">Total de Permisos</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {permissions.filter((p) => p.is_active).length}
          </div>
          <div className="text-sm text-green-600">Permisos Activos</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{modules.length}</div>
          <div className="text-sm text-purple-600">Módulos</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">
            {
              Object.keys(
                filteredPermissions.reduce((acc, p) => ({ ...acc, [p.action]: true }), {})
              ).length
            }
          </div>
          <div className="text-sm text-orange-600">Acciones Únicas</div>
        </div>
      </div>
    </div>
  );
}

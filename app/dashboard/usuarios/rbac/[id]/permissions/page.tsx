'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/fetcher';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  is_active: boolean;
  is_assigned?: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface RolePermissionsData {
  role: Role;
  permissions: Permission[];
  assigned_count: number;
  total_permissions: number;
}

// Componente de toast simple
const showToast = (message: string, _type: 'success' | 'error' | 'info' = 'info') => {
  // Por ahora usamos alert, pero se puede integrar una librería de toast después
  alert(message);
};

export default function RolePermissionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<RolePermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [originalAssignments, setOriginalAssignments] = useState<Set<string>>(new Set());

  const fetchRolePermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/rbac/roles/${params.id}/permissions`);

      if (!response.ok) {
        throw new Error('Error al cargar permisos del rol');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);

        // Inicializar permisos seleccionados con los ya asignados
        const assignedPermissionIds = new Set<string>(
          result.data.permissions
            .filter((p: Permission) => p.is_assigned)
            .map((p: Permission) => p.id)
        );

        setSelectedPermissions(assignedPermissionIds);
        setOriginalAssignments(new Set(assignedPermissionIds));
      }
    } catch (error) {
      showToast('Error al cargar los permisos del rol', 'error');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchRolePermissions();
  }, [fetchRolePermissions]);

  const handlePermissionToggle = (permissionId: string, isChecked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (isChecked) {
      newSelected.add(permissionId);
    } else {
      newSelected.delete(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const saveChanges = async () => {
    if (!data) return;

    try {
      setSaving(true);

      // Determinar permisos a asignar y revocar
      const toAssign = Array.from(selectedPermissions).filter((id) => !originalAssignments.has(id));
      const toRevoke = Array.from(originalAssignments).filter((id) => !selectedPermissions.has(id));

      // Asignar nuevos permisos
      if (toAssign.length > 0) {
        const assignResponse = await api.post(`/api/rbac/roles/${params.id}/permissions`, {
          permission_ids: toAssign,
        });

        if (!assignResponse.ok) {
          throw new Error('Error al asignar permisos');
        }
      }

      // Revocar permisos
      if (toRevoke.length > 0) {
        const revokeResponse = await api.del(`/api/rbac/roles/${params.id}/permissions`, {
          body: JSON.stringify({ permission_ids: toRevoke }),
        });

        if (!revokeResponse.ok) {
          throw new Error('Error al revocar permisos');
        }
      }

      if (toAssign.length === 0 && toRevoke.length === 0) {
        showToast('No hay cambios para guardar', 'info');
        return;
      }

      // Actualizar estado original
      setOriginalAssignments(new Set(selectedPermissions));

      showToast('Permisos actualizados exitosamente', 'success');

      // Recargar datos
      await fetchRolePermissions();
    } catch (error) {
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getModules = () => {
    if (!data) return [];

    const modules = Array.from(new Set(data.permissions.map((p) => p.module))).sort();
    return modules;
  };

  const getFilteredPermissions = () => {
    if (!data) return [];

    let filtered = data.permissions;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por módulo
    if (selectedModule !== 'all') {
      filtered = filtered.filter((p) => p.module === selectedModule);
    }

    return filtered;
  };

  const getPermissionsByModule = () => {
    const filtered = getFilteredPermissions();
    const grouped: { [key: string]: Permission[] } = {};

    filtered.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });

    return grouped;
  };

  const hasChanges = () => {
    return (
      selectedPermissions.size !== originalAssignments.size ||
      Array.from(selectedPermissions).some((id) => !originalAssignments.has(id))
    );
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read':
      case 'leer':
        return 'bg-blue-100 text-blue-800';
      case 'create':
      case 'crear':
        return 'bg-green-100 text-green-800';
      case 'update':
      case 'editar':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
      case 'eliminar':
        return 'bg-red-100 text-red-800';
      case 'administrar_permisos':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando permisos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-600">No se pudieron cargar los permisos del rol</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const permissionsByModule = getPermissionsByModule();
  const modules = getModules();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Permisos</h1>
            <p className="text-gray-600">
              Rol: <span className="font-semibold">{data.role.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {selectedPermissions.size} de {data.total_permissions} permisos seleccionados
          </div>
          {hasChanges() && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-blue-600 rounded"></div>
            <div>
              <p className="text-sm text-gray-600">Total Permisos</p>
              <p className="text-xl font-bold">{data.total_permissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-green-600 rounded"></div>
            <div>
              <p className="text-sm text-gray-600">Asignados</p>
              <p className="text-xl font-bold text-green-600">{selectedPermissions.size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-purple-600 rounded"></div>
            <div>
              <p className="text-sm text-gray-600">Módulos</p>
              <p className="text-xl font-bold">{modules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-blue-600 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Cobertura</p>
              <p className="text-xl font-bold">
                {((selectedPermissions.size / data.total_permissions) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              name="search"
              aria-label="Buscar permisos"
              placeholder="🔍 Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2 flex-wrap">
            <button
              onClick={() => setSelectedModule('all')}
              className={`px-3 py-1 rounded text-sm ${
                selectedModule === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
            {modules.map((module) => (
              <button
                key={module}
                onClick={() => setSelectedModule(module)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedModule === module
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="space-y-6">
        {Object.entries(permissionsByModule).map(([module, permissions]) => (
          <div key={module} className="bg-white border rounded-lg">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{module}</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {permissions.filter((p) => selectedPermissions.has(p.id)).length} /{' '}
                  {permissions.length}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedPermissions.has(permission.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name={`permission_${permission.id}`}
                        checked={selectedPermissions.has(permission.id)}
                        onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                        className="mt-1"
                        aria-label={`Asignar permiso ${permission.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-sm truncate">{permission.name}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getActionColor(permission.action)}`}
                          >
                            {permission.action}
                          </span>
                        </div>
                        {permission.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(permissionsByModule).length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-600">No se encontraron permisos con los filtros aplicados</p>
        </div>
      )}
    </div>
  );
}

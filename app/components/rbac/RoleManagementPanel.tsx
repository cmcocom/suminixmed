'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import RoleUsersModal from './RoleUsersModal';

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  _count?: {
    role_permissions: number;
    user_roles: number;
  };
}

interface RoleManagementPanelProps {
  updating: boolean;
  setUpdating: (updating: boolean) => void;
}

interface RoleFormData {
  name: string;
  description: string;
  is_active: boolean;
}

export default function RoleManagementPanel({ updating, setUpdating }: RoleManagementPanelProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Cargar roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rbac/roles');

      if (response.ok) {
        const data = await response.json();
        // Normalizar posibles formas de respuesta: {success:true,data:[...]}, {roles:[...]}, lista directa
        const rolesArray: Role[] = Array.isArray(data) ? data : data.data || data.roles || [];
        setRoles(rolesArray);
      } else {
        console.error('Error al cargar roles');
        toast.error('Error al cargar roles');
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast.error('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Filtrar roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && role.is_active) ||
      (filter === 'inactive' && !role.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setEditingRole(null);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('El nombre del rol es requerido');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.post('/api/rbac/roles', formData);

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        loadRoles();
        alert('Rol creado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear rol');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRole || !formData.name.trim()) {
      alert('El nombre del rol es requerido');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put(`/api/rbac/roles/${editingRole.id}`, formData);

      if (response.ok) {
        setEditingRole(null);
        resetForm();
        loadRoles();
        alert('Rol actualizado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar rol');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (
      !confirm(`¿Estás seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await api.del(`/api/rbac/roles/${role.id}`);

      if (response.ok) {
        loadRoles();
        alert('Rol eliminado exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar rol');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      is_active: role.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Roles</h2>
          <p className="text-gray-600">Administra los roles del sistema y sus permisos</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={updating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Crear Rol
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Filtrar roles por estado"
            aria-label="Filtrar roles por estado"
          >
            <option value="all">Todos los roles</option>
            <option value="active">Roles activos</option>
            <option value="inactive">Roles inactivos</option>
          </select>
        </div>
      </div>

      {/* Lista de roles */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No se encontraron roles</h3>
              <p className="text-sm text-gray-500">
                {roles.length === 0
                  ? 'Crea tu primer rol para comenzar'
                  : 'Ajusta los filtros de búsqueda para encontrar roles'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className={`border rounded-lg p-4 transition-all ${
                    editingRole?.id === role.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editingRole?.id === role.id ? (
                    // Formulario de edición
                    <form onSubmit={handleEditRole} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Rol
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            title="Nombre del rol"
                            placeholder="Nombre del rol"
                            aria-label="Nombre del rol"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Rol activo</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Descripción del rol"
                          placeholder="Descripción del rol"
                          aria-label="Descripción del rol"
                        />
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
                    // Vista normal del rol
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              role.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {role.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{role.description}</p>

                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <KeyIcon className="h-4 w-4" />
                            <span>{role._count?.role_permissions || 0} permisos</span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedRoleForUsers({ id: role.id, name: role.name })
                            }
                            className="flex items-center space-x-1 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                            title="Click para ver usuarios asignados a este rol"
                          >
                            <UsersIcon className="h-4 w-4" />
                            <span>{role._count?.user_roles ?? 0} usuarios</span>
                          </button>
                          <div className="text-xs">
                            Creado: {new Date(role.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() =>
                            window.open(
                              `/dashboard/usuarios/rbac-complete?role=${role.id}`,
                              '_blank'
                            )
                          }
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Ver permisos del rol"
                          aria-label="Ver permisos del rol"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEdit(role)}
                          disabled={updating}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="Editar rol"
                          aria-label="Editar rol"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role)}
                          disabled={updating || (role._count?.user_roles || 0) > 0}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title={
                            (role._count?.user_roles || 0) > 0
                              ? 'No se puede eliminar: hay usuarios asignados'
                              : 'Eliminar rol'
                          }
                          aria-label={
                            (role._count?.user_roles || 0) > 0
                              ? 'No se puede eliminar: hay usuarios asignados'
                              : 'Eliminar rol'
                          }
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Rol</h3>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Supervisor de Inventario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe las responsabilidades de este rol..."
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
                  <span className="ml-2 text-sm text-gray-700">Rol activo</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Creando...' : 'Crear Rol'}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{roles.length}</div>
          <div className="text-sm text-blue-600">Total de Roles</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {roles.filter((r) => r.is_active).length}
          </div>
          <div className="text-sm text-green-600">Roles Activos</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {roles.reduce((acc, role) => acc + (role._count?.user_roles ?? 0), 0)}
          </div>
          <div className="text-sm text-purple-600">Asignaciones Totales</div>
        </div>
      </div>

      {/* Modal de usuarios asignados al rol */}
      {selectedRoleForUsers && (
        <RoleUsersModal
          roleId={selectedRoleForUsers.id}
          roleName={selectedRoleForUsers.name}
          isOpen={!!selectedRoleForUsers}
          onClose={() => setSelectedRoleForUsers(null)}
        />
      )}
    </div>
  );
}

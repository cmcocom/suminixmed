'use client';

import { useState } from 'react';
import {
  ShieldCheckIcon,
  PlusIcon,
  UserGroupIcon,
  KeyIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import RoleUsersModal from './RoleUsersModal';

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  permissions_count?: number;
  users_count?: number;
  is_active: boolean;
}

interface RoleListProps {
  roles: Role[];
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  loading?: boolean;
  updating?: boolean;
}

export default function RoleList({
  roles,
  selectedRole,
  onRoleSelect,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  loading = false,
  updating = false,
}: RoleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Filtrar roles por búsqueda
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'desarrollador':
        return '👨‍💻';
      case 'administrador':
        return '👑';
      case 'colaborador':
        return '👥';
      case 'operador':
        return '⚙️';
      default:
        return '🎭';
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'desarrollador':
        return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      case 'administrador':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'colaborador':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'operador':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Roles del Sistema</h2>
              <p className="text-sm text-gray-600">Gestiona roles y permisos</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {roles.length} {roles.length === 1 ? 'rol' : 'roles'}
          </div>
        </div>

        {/* Botón crear rol */}
        <button
          onClick={onCreateRole}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Crear Nuevo Rol
        </button>

        {/* Buscador */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de roles */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p>No se encontraron roles</p>
                <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🎭</div>
                <p>No hay roles creados</p>
                <p className="text-sm text-gray-400 mt-1">Crea tu primer rol para comenzar</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                onClick={() => onRoleSelect(role)}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    selectedRole?.id === role.id
                      ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50'
                      : getRoleColor(role.name)
                  }
                  ${role.is_active === false ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header del rol */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getRoleIcon(role.name)}</span>
                      <h3 className="font-semibold text-gray-900 truncate">{role.name}</h3>
                      {!role.is_active && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>

                    {/* Descripción */}
                    {role.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{role.description}</p>
                    )}

                    {/* Estadísticas */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <KeyIcon className="h-3 w-3" />
                        <span>{role.permissions_count || 0} permisos</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoleForUsers({ id: role.id, name: role.name });
                        }}
                        className="flex items-center space-x-1 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                        title="Click para ver usuarios asignados a este rol"
                      >
                        <UserGroupIcon className="h-3 w-3" />
                        <span>{role.users_count || 0} usuarios</span>
                      </button>
                    </div>

                    {/* Fecha de creación */}
                    <div className="text-xs text-gray-400 mt-1">
                      Creado: {formatDate(role.created_at)}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="ml-3 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoleSelect(role);
                      }}
                      disabled={updating}
                      className={`p-1 rounded transition-colors ${
                        updating
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-100'
                      }`}
                      title="Ver permisos"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRole(role);
                      }}
                      disabled={updating}
                      className={`p-1 rounded transition-colors ${
                        updating
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                      }`}
                      title="Editar rol"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      data-role-id={role.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRole(role);
                      }}
                      disabled={updating}
                      className={`p-1 rounded transition-colors ${
                        updating
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-100'
                      }`}
                      title="Eliminar rol"
                    >
                      {updating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer con resumen */}
      {!loading && filteredRoles.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-center">
            {selectedRole ? (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedRole.name}</span> seleccionado
                <div className="text-xs text-gray-500 mt-1">
                  {selectedRole.permissions_count || 0} permisos configurados
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Selecciona un rol para gestionar sus permisos
              </div>
            )}
          </div>
        </div>
      )}

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

'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  roleDescription: string | null;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
}

interface AvailableRole {
  id: string;
  name: string;
  description: string | null;
  permissionCount: number;
  isSystemRole: boolean;
}

interface RoleManagerProps {
  selectedUser: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  userRoles: UserRole[];
  availableRoles: AvailableRole[];
  onRoleAdd: (roleId: string) => void;
  onRoleRemove: (userRoleId: string) => void;
  loading?: boolean;
  updating?: boolean;
}

export default function RoleManager({
  selectedUser,
  userRoles,
  availableRoles,
  onRoleAdd,
  onRoleRemove,
  loading = false,
  updating = false,
}: RoleManagerProps) {
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium mb-2">Selecciona un usuario</h3>
        <p className="text-center text-gray-400">
          Elige un usuario para gestionar sus roles y permisos
        </p>
      </div>
    );
  }

  // Roles disponibles que no están asignados al usuario
  const unassignedRoles = availableRoles.filter(
    (role) => !userRoles.some((userRole) => userRole.roleId === role.id)
  );

  const handleAddRole = () => {
    if (selectedRoleId) {
      onRoleAdd(selectedRoleId);
      setSelectedRoleId('');
      setIsAddingRole(false);
    }
  };

  const getRoleTypeColor = (isSystemRole: boolean) => {
    return isSystemRole
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getRoleTypeIcon = (isSystemRole: boolean) => {
    return isSystemRole ? '🛡️' : '👤';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {selectedUser.avatar ? (
              <Image
                src={selectedUser.avatar}
                alt={selectedUser.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              Roles de {selectedUser.name}
            </h3>
            <p className="text-sm text-gray-500">{selectedUser.email}</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {userRoles.length} rol{userRoles.length !== 1 ? 'es' : ''} asignado
              {userRoles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-gray-500">Total: {userRoles.length}</div>
        </div>

        {/* Botón agregar rol */}
        {!isAddingRole ? (
          <button
            onClick={() => setIsAddingRole(true)}
            disabled={updating || unassignedRoles.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Asignar nuevo rol
          </button>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Seleccionar rol para asignar"
              aria-label="Seleccionar rol para asignar"
            >
              <option value="">Selecciona un rol...</option>
              {unassignedRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.permissionCount} permisos)
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handleAddRole}
                disabled={!selectedRoleId || updating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Asignar
              </button>
              <button
                onClick={() => {
                  setIsAddingRole(false);
                  setSelectedRoleId('');
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de roles */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : userRoles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>Sin roles asignados</p>
            <p className="text-sm text-gray-400 mt-1">Este usuario no tiene roles asignados aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userRoles.map((userRole) => (
              <div
                key={userRole.id}
                className={`
                  p-4 border rounded-lg transition-all duration-200 border-green-200 bg-green-50
                  ${updating ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Encabezado del rol */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {getRoleTypeIcon(
                          availableRoles.find((r) => r.id === userRole.roleId)?.isSystemRole ||
                            false
                        )}
                      </span>
                      <h4 className="font-medium text-gray-900 truncate">{userRole.roleName}</h4>
                      <div
                        className={`
                        px-2 py-1 text-xs rounded-full border
                        ${getRoleTypeColor(availableRoles.find((r) => r.id === userRole.roleId)?.isSystemRole || false)}
                      `}
                      >
                        {availableRoles.find((r) => r.id === userRole.roleId)?.isSystemRole
                          ? 'Sistema'
                          : 'Personalizado'}
                      </div>
                      <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>

                    {/* Descripción */}
                    {userRole.roleDescription && (
                      <p className="text-sm text-gray-600 mb-2">{userRole.roleDescription}</p>
                    )}

                    {/* Información de asignación */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Asignado: {formatDate(userRole.assignedAt)}</span>
                      <span className="text-gray-300">•</span>
                      <span>Por: {userRole.assignedBy}</span>
                      <span className="text-gray-300">•</span>
                      <span>
                        {availableRoles.find((r) => r.id === userRole.roleId)?.permissionCount || 0}{' '}
                        permisos
                      </span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="ml-4 flex items-center space-x-2">
                    {/* Eliminar rol */}
                    <button
                      onClick={() => onRoleRemove(userRole.id)}
                      disabled={updating}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar rol"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer con información */}
      {selectedUser && !loading && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">
              {unassignedRoles.length > 0
                ? `${unassignedRoles.length} rol${unassignedRoles.length !== 1 ? 'es' : ''} disponible${unassignedRoles.length !== 1 ? 's' : ''} para asignar`
                : 'Todos los roles disponibles han sido asignados'}
            </div>
            {userRoles.length > 0 && (
              <div className="text-xs text-gray-400">
                Los roles asignados otorgan permisos inmediatamente
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

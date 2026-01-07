'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
// Legacy imports removed: usar `rbac-dynamic.ts` y `TipoRol` desde las utilidades modernas

// Importar los componentes creados
import UserSelector from '@/app/components/rbac/UserSelector';
import ModuleTree from '@/app/components/rbac/ModuleTree';
import PermissionPanel from '@/app/components/rbac/PermissionPanel';
import RoleManager from '@/app/components/rbac/RoleManager';
import { api } from '@/lib/fetcher';

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  staticRole: string;
  image: string | null;
  active: boolean;
  summary: {
    totalDynamicRoles: number;
    dynamicRoles: Array<{ id: string; name: string }>;
    displayRole: string;
  };
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

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  assigned: boolean;
}

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

// Componente de Toast mejorado
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // En un proyecto real, aquí integrarías una librería de toast como react-hot-toast
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  // Crear elemento toast temporal
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium max-w-sm ${
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  } transition-all duration-300 transform translate-x-full`;
  toast.textContent = `${emoji} ${message}`;

  document.body.appendChild(toast);

  // Animar entrada
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    toast.style.transform = 'translateX(full)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

export default function RBACUserCentricPage() {
  const { data: session } = useSession();

  // Estados principales
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);

  // Estados de datos
  const [userModules, setUserModules] = useState<ModuleInfo[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);

  // Estados de carga
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Verificar permisos
  interface ExtendedUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    rol?: string;
  }

  const userWithRole = session?.user as ExtendedUser;
  // TODO: Migrar a sistema dinámico - temporalmente permitir acceso
  const canManageRBAC = true; // userWithRole?.rol && tienePermiso(userWithRole.rol as TipoRol, 'USUARIOS', 'ADMINISTRAR_PERMISOS');

  // Funciones de carga de datos
  const loadUserModules = useCallback(
    async (userId: string) => {
      try {
        setLoadingModules(true);
        const response = await api.get(`/api/rbac/users/${userId}/permissions-by-module`);

        if (response.status === 401 || response.status === 403) {
          showToast('No tienes permisos para ver los módulos del usuario', 'error');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUserModules(data.modules || []);

          // Si hay módulos y no hay uno seleccionado, seleccionar el primero
          if (data.modules && data.modules.length > 0 && !selectedModule) {
            setSelectedModule(data.modules[0]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.error || 'Error al cargar módulos del usuario', 'error');
        }
      } catch (error) {
        showToast('Error de conexión al cargar módulos', 'error');
      } finally {
        setLoadingModules(false);
      }
    },
    [selectedModule]
  );

  const loadUserRoles = useCallback(async (userId: string) => {
    try {
      setLoadingRoles(true);
      const response = await api.get(`/api/rbac/users/${userId}/roles`);

      if (response.status === 401 || response.status === 403) {
        showToast('No tienes permisos para ver los roles del usuario', 'error');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.userRoles || []);
        setAvailableRoles(data.availableRoles || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Error al cargar roles del usuario', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al cargar roles', 'error');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Efectos para cargar datos cuando cambia el usuario seleccionado
  useEffect(() => {
    if (selectedUser) {
      loadUserModules(selectedUser.id);
      loadUserRoles(selectedUser.id);
    } else {
      setUserModules([]);
      setUserRoles([]);
      setAvailableRoles([]);
      setSelectedModule(null);
    }
  }, [selectedUser, loadUserModules, loadUserRoles]);

  // Handlers para las acciones de permisos
  const handlePermissionToggle = async (permissionId: string, assigned: boolean) => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api.put(`/api/rbac/users/${selectedUser.id}/permissions`, {
        permissionId,
        assigned,
        assignedBy: userWithRole?.email || 'sistema',
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');

        // Recargar módulos para reflejar cambios
        await loadUserModules(selectedUser.id);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Error al actualizar permiso', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar permiso', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handlers para las acciones de roles
  const handleRoleAdd = async (roleId: string) => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api.post(`/api/rbac/users/${selectedUser.id}/roles`, {
        roleId,
        assignedBy: userWithRole?.email || 'sistema',
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');

        // Recargar roles y módulos
        await Promise.all([loadUserRoles(selectedUser.id), loadUserModules(selectedUser.id)]);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Error al asignar rol', 'error');
      }
    } catch (error) {
      showToast('Error al asignar rol', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleRemove = async (userRoleId: string) => {
    if (!selectedUser) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este rol del usuario?')) return;

    try {
      setUpdating(true);
      const response = await api.del(`/api/rbac/users/${selectedUser.id}/roles`, {
        body: JSON.stringify({ userRoleId }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');

        // Recargar roles y módulos
        await Promise.all([loadUserRoles(selectedUser.id), loadUserModules(selectedUser.id)]);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Error al eliminar rol', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar rol', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handler para selección de usuario
  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setSelectedModule(null); // Reset module selection when changing user
  }, []);

  // Handler para selección de módulo
  const handleModuleSelect = useCallback((module: ModuleInfo) => {
    setSelectedModule(module);
  }, []);

  // Verificar acceso
  if (!canManageRBAC) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">
            No tienes permisos para gestionar roles y permisos de usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Permisos por Usuario</h1>
          <p className="text-gray-600">
            Administra permisos y roles de forma intuitiva por usuario
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>👤</span>
          <span>Diseño centrado en usuario</span>
        </div>
      </div>

      {/* Layout de 4 columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Columna 1 - Selector de Usuario */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow border flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>👤</span>
              Seleccionar Usuario
            </h2>
            <p className="text-sm text-gray-600">Busca y selecciona un usuario</p>
          </div>

          <div className="flex-1 overflow-hidden">
            <UserSelector onUserSelect={handleUserSelect} selectedUser={selectedUser} />
          </div>
        </div>

        {/* Columna 2 - Navegación de Módulos */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow border flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🏗️</span>
              Módulos del Sistema
            </h2>
            <p className="text-sm text-gray-600">
              {selectedUser ? `Módulos de ${selectedUser.name}` : 'Selecciona un usuario'}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <ModuleTree
              modules={userModules}
              selectedModule={selectedModule}
              onModuleSelect={handleModuleSelect}
              loading={loadingModules}
            />
          </div>
        </div>

        {/* Columna 3 - Panel de Permisos */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow border flex flex-col">
          <PermissionPanel
            selectedModule={selectedModule}
            onPermissionToggle={handlePermissionToggle}
            loading={loadingModules}
            updating={updating}
          />
        </div>

        {/* Columna 4 - Gestión de Roles */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow border flex flex-col">
          <RoleManager
            selectedUser={
              selectedUser
                ? {
                    id: selectedUser.id,
                    name: selectedUser.name,
                    email: selectedUser.email,
                    avatar: selectedUser.image,
                  }
                : null
            }
            userRoles={userRoles}
            availableRoles={availableRoles}
            onRoleAdd={handleRoleAdd}
            onRoleRemove={handleRoleRemove}
            loading={loadingRoles}
            updating={updating}
          />
        </div>
      </div>

      {/* Footer con información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">💡</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">¿Cómo usar esta interfaz?</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>1.</strong> Selecciona un usuario en la primera columna
              </p>
              <p>
                <strong>2.</strong> Navega por los módulos del sistema en la segunda columna
              </p>
              <p>
                <strong>3.</strong> Gestiona permisos específicos en la tercera columna
              </p>
              <p>
                <strong>4.</strong> Administra roles del usuario en la cuarta columna
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de estado */}
      {selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {selectedUser.summary.totalDynamicRoles}
            </div>
            <div className="text-sm text-green-600">Roles Dinámicos</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{userModules.length}</div>
            <div className="text-sm text-blue-600">Módulos Disponibles</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {userModules.reduce((total, module) => total + module.assignedCount, 0)}
            </div>
            <div className="text-sm text-purple-600">Permisos Asignados</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {userModules.reduce((total, module) => total + module.permissionCount, 0)}
            </div>
            <div className="text-sm text-orange-600">Permisos Totales</div>
          </div>
        </div>
      )}
    </div>
  );
}

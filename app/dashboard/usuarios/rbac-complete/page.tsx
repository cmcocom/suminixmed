'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
// Nota: imports legacy removidos (rbac-dynamic reemplaza estas utilidades)
import { Tab } from '@headlessui/react';
import {
  UserIcon,
  UsersIcon,
  KeyIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

// Importar componentes existentes
import UserSelector from '@/app/components/rbac/UserSelector';
import ModuleTree from '@/app/components/rbac/ModuleTree';
import PermissionPanel from '@/app/components/rbac/PermissionPanel';
import RoleManager from '@/app/components/rbac/RoleManager';

// Importar nuevos componentes
import RoleManagementPanel from '@/app/components/rbac/RoleManagementPanel';
import PermissionManagementPanel from '@/app/components/rbac/PermissionManagementPanel';
import AuditPanel from '@/app/components/rbac/AuditPanel';
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

// Componente de Toast
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium max-w-sm ${
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  } transition-all duration-300 transform translate-x-full`;
  toast.textContent = `${emoji} ${message}`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  setTimeout(() => {
    toast.style.transform = 'translateX(full)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function RBACManagementPage() {
  const { data: session } = useSession();

  // Estados principales
  const [selectedTab, setSelectedTab] = useState(0);
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
  // TODO: Migrar a sistema dinámico - temporalmente permitir acceso a todos los desarrolladores/admin
  const canManageRBAC = true; // userWithRole?.rol && tienePermiso(userWithRole.rol as TipoRol, 'USUARIOS', 'ADMINISTRAR_PERMISOS');

  // Funciones de carga de datos para usuario
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

  // Efectos
  useEffect(() => {
    if (selectedUser && selectedTab === 0) {
      loadUserModules(selectedUser.id);
      loadUserRoles(selectedUser.id);
    } else {
      setUserModules([]);
      setUserRoles([]);
      setAvailableRoles([]);
      setSelectedModule(null);
    }
  }, [selectedUser, selectedTab, loadUserModules, loadUserRoles]);

  // Handlers para las acciones de permisos de usuario
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

  // Handlers para las acciones de roles de usuario
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
    setSelectedModule(null);
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

  const tabs = [
    {
      name: 'Gestión por Usuario',
      icon: UserIcon,
      description: 'Administrar permisos y roles de usuarios específicos',
    },
    {
      name: 'Gestión de Roles',
      icon: UsersIcon,
      description: 'Crear, editar y administrar roles del sistema',
    },
    {
      name: 'Gestión de Permisos',
      icon: KeyIcon,
      description: 'Administrar permisos del sistema',
    },
    {
      name: 'Auditoría',
      icon: ClipboardDocumentListIcon,
      description: 'Revisar logs y cambios en el sistema RBAC',
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión RBAC Completa</h1>
          <p className="text-gray-600">
            Sistema completo de gestión de roles, permisos y control de acceso
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Control de acceso avanzado</span>
        </div>
      </div>

      {/* Navegación con pestañas */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 transition-all',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Panel 1: Gestión por Usuario */}
          <Tab.Panel className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Gestión Centrada en Usuario
              </h3>
              <p className="text-sm text-blue-800">
                Selecciona un usuario, navega por sus módulos disponibles y gestiona permisos
                específicos o roles completos.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-300px)]">
              {/* Columna 1 - Selector de Usuario */}
              <div className="xl:col-span-3 bg-white rounded-lg shadow border flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
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
                    <Cog6ToothIcon className="h-5 w-5" />
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

            {/* Estadísticas del usuario seleccionado */}
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
          </Tab.Panel>

          {/* Panel 2: Gestión de Roles */}
          <Tab.Panel>
            <RoleManagementPanel updating={updating} setUpdating={setUpdating} />
          </Tab.Panel>

          {/* Panel 3: Gestión de Permisos */}
          <Tab.Panel>
            <PermissionManagementPanel updating={updating} setUpdating={setUpdating} />
          </Tab.Panel>

          {/* Panel 4: Auditoría */}
          <Tab.Panel>
            <AuditPanel updating={updating} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

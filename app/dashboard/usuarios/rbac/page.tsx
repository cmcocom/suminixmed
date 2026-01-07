'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModuleVisibility } from '@/app/contexts/ModuleVisibilityContext';
import { showToast } from '@/lib/rbac/toast';
import { useRbacRoles } from '@/hooks/useRbacRoles';

import { api } from '@/lib/fetcher';

// Importar los componentes creados
import RoleList from '@/app/components/rbac/RoleList';
import RoleModal from '@/app/components/rbac/RoleModal';
import SidebarControlPanel from '@/app/components/rbac/SidebarControlPanel';

// Interfaces
interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  users_count?: number;
  is_active: boolean;
}

// Sistema de gestión RBAC simplificado

export default function RBACPage() {
  // no session data required in this view
  const { updateModuleVisibility: _updateModuleVisibility } = useModuleVisibility();
  const { roles, reloadRoles, loading: loadingRoles } = useRbacRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Estado específico para la configuración de sidebar del rol seleccionado
  const [sidebarModuleVisibility, setSidebarModuleVisibility] = useState<Record<string, boolean>>(
    {}
  );
  const [isLoadingSidebarVisibility, setIsLoadingSidebarVisibility] = useState(false);

  // Función para cargar la configuración de sidebar específica del rol seleccionado
  const loadSidebarVisibilityForRole = async (roleId: string) => {
    setIsLoadingSidebarVisibility(true);
    try {
      const response = await api.get(`/api/rbac/modules/visibility?roleId=${roleId}`);
      if (response.ok) {
        const data = await response.json();
        // response shape: { moduleVisibility: {...}, scope: 'role-specific', roleId }
        setSidebarModuleVisibility(data.moduleVisibility || {});
      } else {
        setSidebarModuleVisibility({});
      }
    } catch (error) {
      setSidebarModuleVisibility({});
    } finally {
      setIsLoadingSidebarVisibility(false);
    }
  };

  // Cargar configuración de sidebar cuando se selecciona un rol
  useEffect(() => {
    if (selectedRole?.id) {
      loadSidebarVisibilityForRole(selectedRole.id);
    } else {
      setSidebarModuleVisibility({});
    }
  }, [selectedRole?.id]);

  // user info not needed in this view

  // Efecto para seleccionar automáticamente el primer rol cuando se cargan los roles
  useEffect(() => {
    if (roles.length > 0 && !selectedRole && !loadingRoles) {
      // Convertir RbacRole a Role
      const role: Role = {
        id: roles[0].id,
        name: roles[0].name,
        description: roles[0].description,
        created_at: roles[0].created_at,
        users_count: roles[0]._count?.user_roles || 0,
        is_active: true, // Asumir activo por defecto
      };
      setSelectedRole(role);
    }
  }, [roles, selectedRole, loadingRoles]);

  useEffect(() => {
    if (selectedRole) {
      // No longer needed
    } else {
      // No longer needed
    }
  }, [selectedRole]);

  // Handlers para las acciones de permisos

  // Handler para selección de rol simplificado

  // Handler para toggle de visibilidad de módulos en menú lateral
  const handleModuleVisibilityToggle = useCallback(
    async (moduleKey: string, visible: boolean) => {
      if (!selectedRole) return;

      try {
        // ✅ NUEVO: Usar endpoint simple de toggle individual
        const response = await api.put(
          `/api/rbac/roles/${selectedRole.id}/modules/${moduleKey}/toggle`,
          { visible }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al cambiar visibilidad');
        }

        const data = await response.json();

        // Actualizar el estado local del sidebar inmediatamente
        setSidebarModuleVisibility((prev) => ({
          ...prev,
          [moduleKey]: visible,
        }));

        showToast(
          `${visible ? '👁️ Mostrado' : '🚫 Oculto'} "${moduleKey}" - ${data.permissionsUpdated || 0} permisos actualizados`,
          'success'
        );
      } catch (error) {
        console.error('Error al cambiar visibilidad:', error);
        showToast(
          `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          'error'
        );
        // Revertir cambio local
        await loadSidebarVisibilityForRole(selectedRole.id);
      }
    },
    [selectedRole]
  );

  // Handlers para gestión de roles
  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Eliminar rol "${role.name}" y sus asignaciones?`)) return;
    showToast('Eliminando rol...', 'info');
    const res = await api.del(`/api/rbac/roles/${role.id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return showToast(err.error || 'Error al eliminar rol', 'error');
    }
    const data = await res.json();
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
    }
    await reloadRoles();
    showToast(data.message || 'Rol eliminado', 'success');
  };

  return (
    <div className="p-6">
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={editingRole}
        onSuccess={async () => {
          showToast(
            editingRole ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente',
            'success'
          );
          await reloadRoles();
          // No longer needed
        }}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Gestión de Permisos por Rol</h1>
            <p className="text-gray-600">Administra permisos de forma eficiente por rol</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>🎭</span>
            <span>Diseño centrado en roles</span>
          </div>
        </div>
      </div>

      {/* Guía de uso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">💡</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">¿Cómo usar esta interfaz?</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>1.</strong> Selecciona un rol en la primera columna o crea uno nuevo
              </p>
              <p>
                <strong>2.</strong> Configura la visibilidad del menú lateral por rol desde el panel
                de la derecha
              </p>
              <p>
                <strong>3.</strong> Los cambios se guardan automáticamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna 1 - Lista de Roles */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>🎭</span>
                Roles del Sistema
              </h2>
              <button
                onClick={handleCreateRole}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
              >
                Crear Rol
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Gestiona roles y sus permisos</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <RoleList
              roles={roles.map((role) => ({
                ...role,
                is_active: true,
              }))}
              selectedRole={selectedRole}
              onRoleSelect={setSelectedRole}
              onCreateRole={handleCreateRole}
              onEditRole={handleEditRole}
              onDeleteRole={handleDeleteRole}
              loading={loadingRoles}
            />
          </div>
        </div>

        {/* Columna 2 - Control del Sidebar */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              {selectedRole ? `Configurar: ${selectedRole.name}` : 'Seleccione un Rol'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Configura la visibilidad del menú lateral</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <SidebarControlPanel
              selectedRole={selectedRole}
              moduleVisibility={sidebarModuleVisibility}
              onModuleVisibilityToggle={handleModuleVisibilityToggle}
              isLoading={isLoadingSidebarVisibility}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

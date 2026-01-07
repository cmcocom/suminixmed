import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import apiFetch from '@/lib/fetcher';

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  _count?: {
    dashboard_indicator_permissions: number;
    user_roles: number;
  };
}

export function useRbacRoles() {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/rbac/roles/simple');
      if (!response.ok) {
        throw new Error('Error al cargar los roles');
      }

      const data = await response.json();
      setRoles(data.roles || []); // Usar data.roles del endpoint simple
    } catch (error) {
      logger.error('Error loading roles:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al cargar los roles RBAC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return {
    roles,
    loading,
    error,
    reloadRoles: loadRoles,
  };
}

// Hook para obtener opciones de roles para formularios
export function useRoleOptions() {
  const { roles, loading } = useRbacRoles();

  const roleOptions = roles.map((role) => ({
    value: role.name,
    label: role.name,
    description: role.description,
  }));

  return {
    roleOptions,
    loading,
  };
}

/**
 * Hook de autenticación actualizado para sistema RBAC dinámico
 * Versión actualizada de hooks/useAuth.ts
 *
 * Cambios principales:
 * - Obtener roles del usuario desde RbacUserRole
 * - Usar permisos dinámicos en lugar de enum estático
 * - Mantener compatibilidad con verificaciones de permisos existentes
 */

'use client';

import apiFetch from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export interface RbacRole {
  id: string;
  name: string;
  description: string | null;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles: RbacRole[];
  activo: boolean;
}

interface SessionUserWithRole {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  activo?: boolean;
}

export function useAuthRbac() {
  const { data: session, status } = useSession();
  const [userRoles, setUserRoles] = useState<RbacRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const sessionUser = session?.user as SessionUserWithRole | undefined;

  // Cargar roles del usuario desde la API
  useEffect(() => {
    async function loadUserRoles() {
      if (!sessionUser?.id) {
        setUserRoles([]);
        return;
      }

      setLoadingRoles(true);
      try {
        const response = await apiFetch(`/api/users/${sessionUser.id}/roles`);
        if (response.ok) {
          const data = await response.json();
          setUserRoles(data.roles || []);
        } else {
          logger.error('Error cargando roles del usuario');
          setUserRoles([]);
        }
      } catch (error) {
        logger.error('Error cargando roles del usuario:', error);
        setUserRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    }

    loadUserRoles();
  }, [sessionUser?.id]);

  const user: AuthUser | null = sessionUser
    ? {
        id: sessionUser.id || '',
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        roles: userRoles,
        activo: sessionUser.activo ?? true,
      }
    : null;

  // Normalizador a mayúsculas para comparaciones seguras
  const norm = (s?: string | null) => (s || '').toUpperCase();

  // Función para verificar si el usuario tiene un rol específico (case-insensitive)
  const hasRole = (roleName: string): boolean => {
    const target = norm(roleName);
    return userRoles.some((role) => norm(role.name) === target);
  };

  // Función para verificar si el usuario tiene alguno de varios roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some((roleName) => hasRole(roleName));
  };

  // Función para verificar permisos de indicadores (usaremos la API existente)
  const tienePermisoIndicador = async (
    indicatorId: string,
    permission: 'view' | 'edit'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await apiFetch(
        `/api/dashboard/indicators/${indicatorId}/permissions?userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        return permission === 'view' ? data.can_view : data.can_edit;
      }
    } catch (error) {
      logger.error('Error verificando permiso de indicador:', error);
    }
    return false;
  };

  return {
    // Estados básicos
    user,
    isLoading: status === 'loading' || loadingRoles,
    isAuthenticated: !!session && !!user,

    // Verificaciones de roles dinámicos
    hasRole,
    hasAnyRole,
    tienePermisoIndicador,

    // Mapeo para mantener compatibilidad con verificaciones existentes
    tienePermiso: (modulo: string, accion: string) => {
      // Para mantener compatibilidad, usar lógica basada en roles
      if (!user) return false;

      // UNIDADC tiene todos los permisos
      if (hasRole('UNIDADC')) return true;

      // Mapeo de permisos por módulo y rol
      // NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
      const permisosPorModulo: Record<string, Record<string, string[]>> = {
        USUARIOS: {
          LEER: ['ADMINISTRADOR', 'OPERADOR'],
          CREAR: ['ADMINISTRADOR'],
          EDITAR: ['ADMINISTRADOR'],
          ELIMINAR: ['ADMINISTRADOR'],
        },
        ENTIDADES: {
          LEER: ['ADMINISTRADOR', 'OPERADOR'],
          CREAR: ['ADMINISTRADOR'],
          EDITAR: ['ADMINISTRADOR'],
          ELIMINAR: ['ADMINISTRADOR'],
        },
        INVENTARIO: {
          LEER: ['ADMINISTRADOR', 'OPERADOR'],
          CREAR: ['ADMINISTRADOR'],
          EDITAR: ['ADMINISTRADOR'],
          ELIMINAR: ['ADMINISTRADOR'],
        },
        REPORTES: {
          LEER: ['ADMINISTRADOR', 'OPERADOR'],
          CREAR: ['ADMINISTRADOR'],
          LEER_TODO: ['ADMINISTRADOR'],
        },
        SOLICITUDES: {
          LEER: ['ADMINISTRADOR', 'OPERADOR'],
          CREAR: ['ADMINISTRADOR', 'OPERADOR'],
          EDITAR: ['ADMINISTRADOR'],
          ELIMINAR: ['ADMINISTRADOR'],
        },
      };

      const rolesPermitidos = permisosPorModulo[modulo]?.[accion];
      if (!rolesPermitidos) return false;

      return hasAnyRole(rolesPermitidos.map(norm));
    },

    tieneAccesoModulo: (modulo: string) => {
      if (!user) return false;
      // UNIDADC tiene acceso a todo, otros roles dependen del módulo
      if (hasRole('UNIDADC')) return true;

      // Mapeo básico de acceso por módulo
      const modulosPermitidos: Record<string, string[]> = {
        USUARIOS: ['ADMINISTRADOR', 'OPERADOR'],
        ENTIDADES: ['ADMINISTRADOR', 'OPERADOR'],
        INVENTARIO: ['ADMINISTRADOR', 'OPERADOR'],
        REPORTES: ['ADMINISTRADOR', 'OPERADOR'],
        SOLICITUDES: ['ADMINISTRADOR', 'OPERADOR'],
        DASHBOARD: ['ADMINISTRADOR', 'OPERADOR'],
      };
      const rolesPermitidos = modulosPermitidos[modulo];
      return rolesPermitidos ? hasAnyRole(rolesPermitidos.map(norm)) : false;
    },

    // Verificaciones de rol específicas actualizadas
    // NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
    esDeveloper: () => hasRole('UNIDADC'),
    esAdmin: () => hasRole('ADMINISTRADOR'),
    esOperador: () => hasRole('OPERADOR'),

    // Verificaciones combinadas actualizadas
    esAdminOMayor: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),

    // Permisos específicos comunes actualizados
    // NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
    puedeGestionarUsuarios: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),
    puedeGestionarEntidades: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),
    puedeGestionarInventario: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),
    puedeEliminarSolicitudes: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),
    puedeVerTodosLosReportes: () => hasAnyRole(['UNIDADC', 'ADMINISTRADOR']),

    // Utilidades
    getPrimaryRole: () => userRoles[0]?.name || 'Sin rol',
    getAllRoles: () => userRoles.map((role) => role.name),
    getDescripcionRol: () => userRoles[0]?.description || 'Sin descripción',
  };
}

// Hook para proteger componentes con roles dinámicos
export function useRequireRbacRole(requiredRoles?: string[]) {
  const auth = useAuthRbac();
  const norm = (s?: string) => (s || '').toUpperCase();
  const normalizedRequired = requiredRoles?.map(norm);
  const hasAccess =
    !normalizedRequired ||
    (auth.user &&
      (auth.hasRole('UNIDADC') || // UNIDADC siempre tiene acceso
        auth.hasAnyRole(normalizedRequired)));

  return {
    ...auth,
    hasAccess,
    isAuthorized: auth.isAuthenticated && hasAccess,
  };
}

// Mantener exportación del hook original para compatibilidad gradual
export { useAuth } from './useAuth';

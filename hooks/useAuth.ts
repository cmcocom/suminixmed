'use client';

import { logger } from '@/lib/logger';
import { TipoRol } from '@/lib/tipo-rol';
import { useSession } from 'next-auth/react';
import { useRbacPermissions } from './useRbacPermissions';

// Función local para descripción de roles (reemplaza import de auth-roles)
function getDescripcionRol(rol: string): string {
  const descriptions: Record<string, string> = {
    ADMINISTRADOR: 'Administrador',
    OPERADOR: 'Operador',
    UNIDADC: 'UNIDADC',
  };
  return descriptions[rol] || rol;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  primaryRole: string;
  roles: string[];
  activo: boolean;
}

interface SessionUserWithRole {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  primaryRole?: TipoRol;
  roles?: TipoRol[];
  rolesSource?: string;
  activo?: boolean;
}

export function useAuth() {
  const { data: session, status } = useSession();

  // 🔒 Validación robusta de la sesión
  let sessionUser: SessionUserWithRole | undefined;
  try {
    sessionUser = session?.user as SessionUserWithRole | undefined;
  } catch (error) {
    logger.error('[AUTH HOOK] Error procesando sesión:', error);
    sessionUser = undefined;
  }

  const {
    loading: permissionsLoading,
    error: _permissionsError,
    permissionSet,
  } = useRbacPermissions();

  const derivedPrimary = sessionUser?.primaryRole || 'OPERADOR';
  const rawRoles =
    sessionUser?.roles && Array.isArray(sessionUser.roles) && sessionUser.roles.length > 0
      ? sessionUser.roles
      : [derivedPrimary];
  const enumValues = Object.values(TipoRol) as string[];
  const derivedRoles = rawRoles.filter((r) => r && enumValues.includes(r));

  // ✅ SISTEMA: Detectar usuario sistema (UNIDADC)
  const isSystemUser = derivedRoles.includes('UNIDADC');

  if (sessionUser) {
    logger.debug(
      '[AUTH HOOK] rolesSource=',
      sessionUser.rolesSource,
      'primary=',
      derivedPrimary,
      'roles=',
      derivedRoles,
      'isSystemUser=',
      isSystemUser
    );
  }

  const user: AuthUser | null =
    sessionUser && sessionUser.id
      ? {
          id: sessionUser.id || '',
          name: sessionUser.name || null,
          email: sessionUser.email || null,
          image: sessionUser.image || null,
          primaryRole: derivedPrimary,
          roles: derivedRoles,
          activo: sessionUser.activo ?? true,
        }
      : null;

  return {
    // Estados básicos
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session && !!user,
    isSystemUser,
    permissionsLoading, // ✅ Nuevo: Exponer estado de carga de permisos

    // Verificaciones de permisos
    tienePermiso: (modulo: string, accion: string) => {
      if (!user) {
        logger.debug('🔍 [useAuth.tienePermiso] No hay usuario autenticado');
        return false;
      }

      // ✅ SISTEMA: Usuario sistema tiene acceso completo a TODO
      if (isSystemUser) {
        logger.debug('✅ [useAuth.tienePermiso] Usuario sistema - acceso total');
        return true;
      }

      // 🔧 HARDCODED TEMPORAL: OPERADOR acceso a PRODUCTOS
      const esOperador = user.roles?.includes('OPERADOR');
      const moduloUpper = String(modulo).toUpperCase();
      const accionUpper = accion.toUpperCase();

      if (esOperador && moduloUpper === 'CATALOGOS_PRODUCTOS') {
        logger.debug('⚡ [HARDCODED] OPERADOR tiene acceso FORZADO a CATALOGOS_PRODUCTOS');
        return true;
      }

      // ✅ RBAC DINÁMICO: Verificar en permissionSet (única fuente de verdad)
      const moduloLower = modulo.toString().toLowerCase();
      const accionLower = accion.toLowerCase();

      // Probar múltiples formatos para compatibilidad
      const formatoPunto = `${moduloUpper}.${accionUpper}`; // DASHBOARD.LEER
      const formatoGuionBajo = `${moduloUpper}_${accionUpper}`; // DASHBOARD_LEER
      const formatoPuntoLower = `${moduloLower}.${accionLower}`; // dashboard.leer
      const formatoLegible = `${modulo} - ${accion}`; // Dashboard - Leer

      logger.debug('🔍 [useAuth.tienePermiso] Verificando permisos:', {
        modulo,
        accion,
        esOperador,
        formatosBuscados: [formatoPunto, formatoGuionBajo, formatoPuntoLower, formatoLegible],
        permissionSetSize: permissionSet.size,
        permissionsLoading,
      });

      // Verificar en permissionSet (cargado desde BD)
      const hasPermission =
        permissionSet.has(formatoPunto) ||
        permissionSet.has(formatoGuionBajo) ||
        permissionSet.has(formatoPuntoLower) ||
        permissionSet.has(formatoLegible);

      logger.debug(hasPermission ? '✅' : '❌', '[useAuth.tienePermiso] Resultado:', {
        modulo: moduloUpper,
        accion: accionUpper,
        hasPermission,
        formatoPuntoExists: permissionSet.has(formatoPunto),
        formatoGuionBajoExists: permissionSet.has(formatoGuionBajo),
      });

      // Si no tiene permiso, mostrar algunos permisos que SÍ tiene para debugging
      if (!hasPermission && permissionSet.size > 0) {
        const permisosRelacionados = Array.from(permissionSet)
          .filter((p) => p.includes(moduloUpper) || p.includes(moduloLower))
          .slice(0, 5);
        logger.debug(
          '🔍 [useAuth.tienePermiso] Permisos relacionados encontrados:',
          permisosRelacionados
        );
      }

      return hasPermission;
    },

    tieneAccesoModulo: (modulo: string) => {
      if (!user) return false;
      // ✅ SISTEMA: Usuario sistema tiene acceso completo
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar si tiene al menos un permiso LEER en el módulo
      const moduloUpper = String(modulo).toUpperCase();
      return permissionSet.has(`${moduloUpper}.LEER`) || permissionSet.has(`${moduloUpper}_LEER`);
    },

    puedeAsignarRol: (_rolAAsignar: string) => {
      if (!user) return false;
      // ✅ SISTEMA: Usuario sistema puede asignar cualquier rol
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permiso de gestión de roles
      return (
        permissionSet.has('USUARIOS.ADMINISTRAR_PERMISOS') ||
        permissionSet.has('USUARIOS_ADMINISTRAR_PERMISOS') ||
        permissionSet.has('AJUSTES_RBAC.CREAR') ||
        permissionSet.has('AJUSTES_RBAC_CREAR')
      );
    },

    rutaPermitida: (_ruta: string) => {
      if (!user) return false;
      // ✅ SISTEMA: Usuario sistema tiene acceso a todas las rutas
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Todas las rutas autenticadas son permitidas
      // La restricción real está en los permisos de módulos/acciones específicos
      return true;
    },

    // Utilidades
    getRutasPermitidas: () => {
      if (!user) return [];
      // ✅ Para usuarios normales, derivar de permissionSet
      // Extraer módulos únicos de los permisos
      const modulos = new Set<string>();
      permissionSet.forEach((perm) => {
        const [modulo] = perm.split(/[._-]/);
        if (modulo) modulos.add(modulo.toLowerCase());
      });
      return Array.from(modulos).map((m) => `/dashboard/${m}`);
    },

    getDescripcionRol: () => {
      if (!user) return '';
      if (!enumValues.includes(user.primaryRole)) return '';
      return getDescripcionRol(user.primaryRole as TipoRol);
    },

    // Verificaciones de rol específicas
    // NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
    esDeveloper: () => user?.roles.includes(TipoRol.UNIDADC),
    esAdmin: () => user?.roles.includes(TipoRol.ADMINISTRADOR),
    esOperador: () => user?.roles.includes(TipoRol.OPERADOR),

    // Verificaciones combinadas
    esAdminOMayor: () =>
      !!user &&
      (user.roles.includes(TipoRol.UNIDADC) || user.roles.includes(TipoRol.ADMINISTRADOR)),

    // Permisos específicos comunes
    puedeGestionarUsuarios: () => {
      if (!user) return false;
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permisos de usuarios
      return (
        permissionSet.has('USUARIOS.CREAR') ||
        permissionSet.has('USUARIOS_CREAR') ||
        permissionSet.has('AJUSTES_USUARIOS.CREAR') ||
        permissionSet.has('AJUSTES_USUARIOS_CREAR')
      );
    },

    puedeGestionarEntidades: () => {
      if (!user) return false;
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permisos de entidades
      return (
        permissionSet.has('ENTIDADES.CREAR') ||
        permissionSet.has('ENTIDADES_CREAR') ||
        permissionSet.has('AJUSTES_ENTIDAD.CREAR') ||
        permissionSet.has('AJUSTES_ENTIDAD_CREAR')
      );
    },

    puedeGestionarInventario: () => {
      if (!user) return false;
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permisos de inventario
      return (
        permissionSet.has('INVENTARIO.CREAR') ||
        permissionSet.has('INVENTARIO_CREAR') ||
        permissionSet.has('CATALOGOS_PRODUCTOS.CREAR') ||
        permissionSet.has('CATALOGOS_PRODUCTOS_CREAR')
      );
    },

    puedeEliminarSolicitudes: () => {
      if (!user) return false;
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permisos de eliminación de solicitudes
      return permissionSet.has('SOLICITUDES.ELIMINAR') || permissionSet.has('SOLICITUDES_ELIMINAR');
    },

    puedeVerTodosLosReportes: () => {
      if (!user) return false;
      if (isSystemUser) return true;

      // ✅ RBAC DINÁMICO: Verificar permisos de reportes
      return (
        permissionSet.has('REPORTES.LEER') ||
        permissionSet.has('REPORTES_LEER') ||
        permissionSet.has('GESTION_REPORTES.LEER') ||
        permissionSet.has('GESTION_REPORTES_LEER')
      );
    },
  };
}

// Hook para proteger componentes
// NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
export function useRequireAuth(requiredRole?: string) {
  const auth = useAuth();

  const hasAccess =
    !requiredRole ||
    (auth.user &&
      (auth.user.primaryRole === TipoRol.UNIDADC ||
        (requiredRole === TipoRol.ADMINISTRADOR &&
          auth.user.primaryRole === TipoRol.ADMINISTRADOR) ||
        requiredRole === TipoRol.OPERADOR));

  return {
    ...auth,
    hasAccess,
    isAuthorized: auth.isAuthenticated && hasAccess,
  };
}

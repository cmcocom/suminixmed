/**
 * ============================================================
 * SISTEMA RBAC SIMPLIFICADO - MODELO PURO DE ROLES (ACTUAL)
 * ============================================================
 *
 * Filosofía: "Lo que ves, lo puedes usar"
 *
 * Seguridad basada en:
 * 1. Usuario tiene Rol(es)
 * 2. Rol tiene permiso LEER concedido en rbac_role_permissions
 * 3. Si puede leer el módulo → puede operar dentro del módulo
 *
 * NOTA: module_visibility fue eliminado. Toda la información proviene de
 *       rbac_permissions + rbac_role_permissions (granted=true).
 * ============================================================
 */

import { prisma } from './prisma';
import { ALL_MODULES } from './rbac-modules';

// ===== TIPOS =====

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  is_system_role?: boolean;
}

export interface ModuleAccess {
  module_key: string;
  visible: boolean;
  role_name: string;
}

// ===== CONSTANTES =====

/**
 * Módulos del sistema
 * Estos son los únicos puntos de control de acceso
 */
export const SYSTEM_MODULES = ALL_MODULES.reduce<Record<string, string>>((acc, key) => {
  acc[key] = key;
  return acc;
}, {});

// ===== FUNCIONES PRINCIPALES =====

/**
 * Verificar si usuario es de sistema (superusuario)
 */
export async function isSystemUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_system_user: true },
    });
    return user?.is_system_user ?? false;
  } catch {
    return false;
  }
}

/**
 * ⭐ FUNCIÓN PRINCIPAL: Verificar acceso a un módulo
 *
 * Esta es la ÚNICA verificación de seguridad necesaria
 * Si retorna true → el usuario puede hacer TODO en ese módulo
 *
 * @param userId - ID del usuario
 * @param moduleKey - Clave del módulo (ej: 'INVENTARIO', 'SALIDAS')
 * @returns true si el usuario tiene acceso al módulo
 */
export async function checkModuleAccess(userId: string, moduleKey: string): Promise<boolean> {
  try {
    // Usuario de sistema tiene acceso a TODO
    if (await isSystemUser(userId)) {
      return true;
    }

    // 1. Obtener roles del usuario
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      select: {
        role_id: true,
        rbac_roles: {
          select: {
            is_active: true,
          },
        },
      },
    });

    // Sin roles → sin acceso
    if (userRoles.length === 0) return false;

    // Filtrar solo roles activos
    const activeRoleIds = userRoles.filter((ur) => ur.rbac_roles.is_active).map((ur) => ur.role_id);

    if (activeRoleIds.length === 0) return false;

    // 2. Verificar si alguno de sus roles tiene permiso LEER concedido
    const grantedPermission = await prisma.rbac_role_permissions.findFirst({
      where: {
        role_id: { in: activeRoleIds },
        granted: true,
        rbac_permissions: {
          module: moduleKey,
          action: 'LEER',
          is_active: true,
        },
      },
      select: { id: true },
    });

    return !!grantedPermission;
  } catch (error) {
    console.error('Error verificando acceso a módulo:', error);
    return false;
  }
}

/**
 * Obtener roles de un usuario
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      include: {
        rbac_roles: {
          select: {
            id: true,
            name: true,
            description: true,
            is_system_role: true,
            is_active: true,
          },
        },
      },
    });

    return userRoles.filter((ur) => ur.rbac_roles.is_active).map((ur) => ur.rbac_roles);
  } catch {
    return [];
  }
}

/**
 * Obtener módulos visibles para un usuario
 */
export async function getUserVisibleModules(userId: string): Promise<string[]> {
  try {
    // Usuario de sistema ve TODO
    if (await isSystemUser(userId)) {
      return [...ALL_MODULES];
    }

    // 1. Obtener roles del usuario
    const userRoles = await getUserRoles(userId);
    const roleIds = userRoles.map((r) => r.id);

    if (roleIds.length === 0) return [];

    // 2. Obtener módulos con permiso LEER concedido
    const permissions = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: { in: roleIds },
        granted: true,
        rbac_permissions: {
          action: 'LEER',
          is_active: true,
        },
      },
      include: {
        rbac_permissions: {
          select: {
            module: true,
          },
        },
      },
    });

    const modules = new Set<string>();
    for (const permission of permissions) {
      const moduleKey = permission.rbac_permissions?.module;
      if (moduleKey) {
        modules.add(moduleKey);
      }
    }

    return Array.from(modules);
  } catch {
    return [];
  }
}

/**
 * Verificar si usuario tiene un rol específico
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId);
    return roles.some((r) => r.name.toUpperCase() === roleName.toUpperCase());
  } catch {
    return false;
  }
}

/**
 * Verificar si usuario tiene alguno de varios roles
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId);
    const userRoleNames = roles.map((r) => r.name.toUpperCase());
    return roleNames.some((rn) => userRoleNames.includes(rn.toUpperCase()));
  } catch {
    return false;
  }
}

/**
 * Verificar acceso y lanzar error si no tiene permiso
 * Útil para APIs que requieren acceso obligatorio
 */
export async function requireModuleAccess(userId: string, moduleKey: string): Promise<void> {
  const hasAccess = await checkModuleAccess(userId, moduleKey);
  if (!hasAccess) {
    throw new Error(`Acceso denegado al módulo: ${moduleKey}`);
  }
}

/**
 * Verificar múltiples módulos a la vez
 * Útil para pantallas que muestran datos de varios módulos
 */
export async function checkMultipleModulesAccess(
  userId: string,
  moduleKeys: string[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const moduleKey of moduleKeys) {
    results[moduleKey] = await checkModuleAccess(userId, moduleKey);
  }

  return results;
}

/**
 * Obtener acceso completo del usuario
 * Retorna roles y módulos visibles
 */
export async function getUserAccess(userId: string) {
  try {
    const [roles, modules] = await Promise.all([
      getUserRoles(userId),
      getUserVisibleModules(userId),
    ]);

    return {
      userId,
      roles,
      visibleModules: modules,
      isSystemUser: await isSystemUser(userId),
    };
  } catch (error) {
    console.error('Error obteniendo acceso de usuario:', error);
    return {
      userId,
      roles: [],
      visibleModules: [],
      isSystemUser: false,
    };
  }
}

// ===== COMPATIBILIDAD CON SESSION DE NEXTAUTH =====

/**
 * Verificar acceso desde sesión de NextAuth
 */
export async function checkSessionModuleAccess(
  user: { id?: string } | null,
  moduleKey: string
): Promise<boolean> {
  if (!user?.id) return false;
  return checkModuleAccess(user.id, moduleKey);
}

/**
 * Obtener roles desde sesión de NextAuth
 */
export async function getSessionUserRoles(user: { id?: string } | null): Promise<UserRole[]> {
  if (!user?.id) return [];
  return getUserRoles(user.id);
}

// ===== UTILIDADES =====

/**
 * Limpiar caché (si decides implementar caché en el futuro)
 */
export function clearAccessCache(_userId?: string): void {
  // Placeholder para futura implementación de caché
  // Cache clearing logic would go here
}

/**
 * Verificar si un módulo existe en el sistema
 */
export function isValidModule(moduleKey: string): boolean {
  return ALL_MODULES.includes(moduleKey);
}

// ===== EXPORT DEFAULT =====

const rbacSimple = {
  // Verificación principal
  checkModuleAccess,
  requireModuleAccess,
  checkMultipleModulesAccess,

  // Roles
  getUserRoles,
  hasRole,
  hasAnyRole,

  // Módulos
  getUserVisibleModules,
  getUserAccess,

  // Sistema
  isSystemUser,

  // Session helpers
  checkSessionModuleAccess,
  getSessionUserRoles,

  // Utilidades
  clearAccessCache,
  isValidModule,

  // Constantes
  MODULES: SYSTEM_MODULES,
};

export default rbacSimple;

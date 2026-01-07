import { ALL_MODULES } from './rbac-modules';
import { prisma } from './prisma';
import { logger } from './logger';

const ROUTE_MODULE_MAP: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/dashboard/solicitudes': 'SOLICITUDES',
  '/dashboard/surtido': 'SURTIDO',
  '/dashboard/entradas': 'ENTRADAS',
  '/dashboard/salidas': 'SALIDAS',
  '/dashboard/reportes': 'REPORTES',
  '/dashboard/reportes/inventario': 'REPORTES_INVENTARIO',
  '/dashboard/reportes/salidas-cliente': 'REPORTES_SALIDAS_CLIENTE',
  '/dashboard/stock-fijo': 'STOCK_FIJO',
  '/dashboard/inventarios': 'INVENTARIOS_FISICOS',
  '/dashboard/productos': 'CATALOGOS_PRODUCTOS',
  '/dashboard/categorias': 'CATALOGOS_CATEGORIAS',
  '/dashboard/clientes': 'CATALOGOS_CLIENTES',
  '/dashboard/proveedores': 'CATALOGOS_PROVEEDORES',
  '/dashboard/empleados': 'CATALOGOS_EMPLEADOS',
  '/dashboard/catalogos/tipos-entrada': 'CATALOGOS_TIPOS_ENTRADA',
  '/dashboard/catalogos/tipos-salida': 'CATALOGOS_TIPOS_SALIDA',
  '/dashboard/almacenes': 'CATALOGOS_ALMACENES',
  '/dashboard/usuarios': 'AJUSTES_USUARIOS',
  '/dashboard/usuarios/rbac': 'AJUSTES_RBAC',
  '/dashboard/auditoria': 'AJUSTES_AUDITORIA',
  '/dashboard/ajustes/catalogos': 'GESTION_CATALOGOS',
  '/dashboard/ajustes/generador-reportes': 'GESTION_REPORTES',
  '/dashboard/ajustes/entidades': 'AJUSTES_ENTIDAD',
  '/dashboard/ajustes/respaldos': 'GESTION_RESPALDOS',
};

function normalizeRoute(routePath: string): string {
  const [path] = routePath.split('?');
  if (!path) return '/dashboard';
  if (path === '/') return '/dashboard';
  return path.endsWith('/') && path !== '/dashboard'
    ? path.replaceAll(/\/+/g, '/').replace(/\/$/, '')
    : path.replaceAll(/\/+/g, '/');
}

/**
 * Resuelve el módulo de ajustes basado en el segmento de ruta
 */
function resolveAjustesModule(segment: string): string {
  const ajustesMap: Record<string, string> = {
    'respaldos': 'GESTION_RESPALDOS',
    'generador-reportes': 'GESTION_REPORTES',
    'catalogos': 'GESTION_CATALOGOS',
  };
  return ajustesMap[segment] ?? `AJUSTES_${segment.replaceAll('-', '_').toUpperCase()}`;
}

function resolveModuleFromRoute(routePath: string): string | null {
  const normalized = normalizeRoute(routePath);
  if (!normalized.startsWith('/dashboard')) {
    return null;
  }

  // Intentar coincidencia exacta primero
  if (ROUTE_MODULE_MAP[normalized]) {
    return ROUTE_MODULE_MAP[normalized];
  }

  const segments = normalized.split('/').filter(Boolean);

  // Construir candidatos reduciendo hacia la ruta base
  for (let i = segments.length; i >= 2; i--) {
    const candidate = `/${segments.slice(0, i).join('/')}`;
    if (ROUTE_MODULE_MAP[candidate]) {
      return ROUTE_MODULE_MAP[candidate];
    }
  }

  // Heurística: tomar segundo segmento como módulo base
  const base = segments[1]?.replaceAll('-', '_').toUpperCase();
  if (base && ALL_MODULES.includes(base)) {
    return base;
  }

  // Heurística especial para secciones agrupadas
  if (segments[1] === 'reportes' && segments[2]) {
    const reportModule = `REPORTES_${segments[2].replaceAll('-', '_').toUpperCase()}`;
    if (ALL_MODULES.includes(reportModule)) {
      return reportModule;
    }
  }

  if (segments[1] === 'catalogos' && segments[2]) {
    const catalogModule = `CATALOGOS_${segments[2].replaceAll('-', '_').toUpperCase()}`;
    if (ALL_MODULES.includes(catalogModule)) {
      return catalogModule;
    }
  }

  if (segments[1] === 'ajustes' && segments[2]) {
    const ajustesModule = resolveAjustesModule(segments[2]);
    if (ALL_MODULES.includes(ajustesModule)) {
      return ajustesModule;
    }
  }

  return null;
}

/**
 * SISTEMA RBAC 100% DINÁMICO
 * Reemplaza completamente auth-roles.ts hardcoded
 */

// ===== TIPOS PARA TYPESCRIPT =====
export interface UserPermission {
  module: string;
  action: string;
  permission_name: string;
  role_name: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  is_system_role?: boolean;
}

// ===== FUNCIONES PRINCIPALES =====

/**
 * Verificar si un usuario es de sistema (superusuario oculto)
 */
export async function isSystemUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_system_user: true },
    });
    return user?.is_system_user ?? false;
  } catch (error) {
    logger.debug('[RBAC] Error verificando usuario sistema:', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Verificar si un usuario tiene algún rol de sistema asignado
 */
export async function hasSystemRole(userId: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}
        AND r.is_system_role = true
      LIMIT 1
    `;
    return Number(result[0].count) > 0;
  } catch (error) {
    logger.debug('[RBAC] Error verificando rol sistema:', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Verificar si un usuario tiene un permiso específico
 * Reemplaza: tienePermisoUser()
 * NOTA: Usa versión con caché por defecto para mejor rendimiento
 */
export async function checkUserPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  // Delegar a la versión con caché para mejor rendimiento
  return checkUserPermissionCached(userId, module, action);
}

/**
 * Versión sin caché (solo para casos específicos)
 */
export async function checkUserPermissionNoCache(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  try {
    // Usuario de sistema tiene TODOS los permisos
    if (await isSystemUser(userId)) {
      return true;
    }

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM rbac_user_roles ur
      JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id  
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}
        AND p.module = ${module}
        AND p.action = ${action}
        AND rp.granted = true
        AND p.is_active = true
    `;

    return Number(result[0].count) > 0;
  } catch (error) {
    logger.debug('[RBAC] Error verificando permiso (no cache):', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Obtener todos los permisos de un usuario
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  try {
    // Usuario de sistema tiene todos los permisos
    if (await isSystemUser(userId)) {
      // Obtener todos los módulos y acciones posibles
      const allPermissions = await prisma.rbac_permissions.findMany({
        where: { is_active: true },
        select: {
          module: true,
          action: true,
          name: true,
        },
      });

      return allPermissions.map((p) => ({
        module: p.module,
        action: p.action,
        permission_name: p.name,
        role_name: 'SUPERUSUARIO',
      }));
    }

    const permissions = await prisma.$queryRaw<UserPermission[]>`
      SELECT 
        p.module,
        p.action,
        p.name as permission_name,
        r.name as role_name
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      JOIN rbac_role_permissions rp ON r.id = rp.role_id  
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}
        AND p.is_active = true
        AND rp.granted = true
      ORDER BY p.module, p.action
    `;

    return permissions;
  } catch (error) {
    logger.debug('[RBAC] Error obteniendo permisos:', error instanceof Error ? error.message : 'Error desconocido');
    return [];
  }
}

/**
 * Obtener roles de un usuario
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const roles = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      include: {
        rbac_roles: {
          select: {
            id: true,
            name: true,
            description: true,
            is_system_role: true,
          },
        },
      },
    });

    return roles.map((ur) => ur.rbac_roles);
  } catch (error) {
    logger.debug('[RBAC] Error obteniendo roles:', error instanceof Error ? error.message : 'Error desconocido');
    return [];
  }
}

/**
 * Obtener roles de un usuario (filtrando roles de sistema)
 */
export async function getUserRolesFiltered(userId: string): Promise<UserRole[]> {
  try {
    const roles = await getUserRoles(userId);
    return roles.filter((r) => !r.is_system_role);
  } catch (error) {
    logger.debug('[RBAC] Error obteniendo roles filtrados:', error instanceof Error ? error.message : 'Error desconocido');
    return [];
  }
}

/**
 * Verificar si usuario tiene acceso a un módulo completo
 * Reemplaza: tieneAccesoModulo()
 */
export async function checkModuleAccess(userId: string, module: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM rbac_user_roles ur
      JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id  
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}
        AND p.module = ${module}
        AND p.action = 'LEER'
        AND rp.granted = true
        AND p.is_active = true
      LIMIT 1
    `;

    return Number(result[0].count) > 0;
  } catch (error) {
    logger.debug('[RBAC] Error verificando acceso módulo:', error instanceof Error ? error.message : 'Error desconocido');
    return false;
  }
}

/**
 * Obtener módulos visibles para un usuario (dinámicamente)
 */
export async function getUserVisibleModules(userId: string): Promise<string[]> {
  try {
    // Usuario de sistema ve TODOS los módulos únicos de module_visibility
    if (await isSystemUser(userId)) {
      return [...ALL_MODULES];
    }

    const userRoles = await getUserRoles(userId);
    const roleIds = userRoles.map((r) => r.id);

    if (roleIds.length === 0) return [];
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
  } catch (error) {
    logger.debug('[RBAC] Error obteniendo módulos visibles:', error instanceof Error ? error.message : 'Error desconocido');
    return [];
  }
}

/**
 * Filtrar usuarios de sistema de una lista
 */
export async function filterSystemUsers<T extends { id: string; is_system_user?: boolean }>(
  users: T[]
): Promise<T[]> {
  return users.filter((u) => !u.is_system_user);
}

/**
 * Filtrar roles de sistema de una lista
 */
export async function filterSystemRoles<T extends { id: string; is_system_role?: boolean }>(
  roles: T[]
): Promise<T[]> {
  return roles.filter((r) => !r.is_system_role);
}

/**
 * Verificar si un usuario puede acceder a una ruta específica
 */
export async function canAccessRoute(userId: string, routePath: string): Promise<boolean> {
  try {
    // Usuario de sistema tiene acceso a TODAS las rutas
    if (await isSystemUser(userId)) {
      return true;
    }

    const moduleKey = resolveModuleFromRoute(routePath);
    if (!moduleKey) {
      // Si no podemos resolver el módulo, permitir acceso para no bloquear flujos
      return true;
    }

    return checkModuleAccess(userId, moduleKey);
  } catch (error) {
    logger.debug('[RBAC] Error verificando acceso a ruta:', error instanceof Error ? error.message : 'Error desconocido');
    return true;
  }
}

/**
 * Verificar permisos múltiples de una vez (optimizado)
 */
export async function checkMultiplePermissions(
  userId: string,
  permissions: { module: string; action: string }[]
): Promise<Record<string, boolean>> {
  try {
    const userRoles = await getUserRoles(userId);
    const roleIds = userRoles.map((r) => r.id);

    if (roleIds.length === 0) {
      const emptyResults: Record<string, boolean> = {};
      permissions.forEach((p) => {
        emptyResults[`${p.module}:${p.action}`] = false;
      });
      return emptyResults;
    }

    const result = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: { in: roleIds },
        granted: true,
        rbac_permissions: {
          is_active: true,
          OR: permissions.map((p) => ({
            module: p.module,
            action: p.action,
          })),
        },
      },
      include: {
        rbac_permissions: {
          select: {
            module: true,
            action: true,
          },
        },
      },
    });

    const results: Record<string, boolean> = {};
    permissions.forEach((p) => {
      const key = `${p.module}:${p.action}`;
      results[key] = result.some(
        (r) => r.rbac_permissions?.module === p.module && r.rbac_permissions?.action === p.action
      );
    });

    return results;
  } catch (error) {
    logger.debug('[RBAC] Error verificando múltiples permisos, usando fallback:', error instanceof Error ? error.message : 'Error desconocido');
    // Fallback: Check one by one
    const results: Record<string, boolean> = {};
    for (const p of permissions) {
      const key = `${p.module}:${p.action}`;
      results[key] = await checkUserPermission(userId, p.module, p.action);
    }
    return results;
  }
}

/**
 * Wrapper para compatibilidad con sesiones de NextAuth
 */
export async function checkSessionPermission(
  user: { id?: string; roles?: string[] } | null,
  module: string,
  action: string
): Promise<boolean> {
  if (!user?.id) return false;
  return checkUserPermission(user.id, module, action);
}

/**
 * Función helper para middleware y HOCs
 */
export async function requirePermission(
  userId: string,
  module: string,
  action: string
): Promise<void> {
  const hasPermission = await checkUserPermission(userId, module, action);
  if (!hasPermission) {
    throw new Error(`Permiso requerido: ${module}:${action}`);
  }
}

// ===== FUNCIONES DE CACHE (OPCIONAL) =====

const permissionCache = new Map<string, { result: boolean; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Versión con caché para mejor performance
 */
export async function checkUserPermissionCached(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const cacheKey = `${userId}:${module}:${action}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  // IMPORTANTE: Llamar a checkUserPermissionNoCache para evitar recursión infinita
  const result = await checkUserPermissionNoCache(userId, module, action);

  permissionCache.set(cacheKey, {
    result,
    expires: Date.now() + CACHE_TTL,
  });

  return result;
}

/**
 * Limpiar caché (útil cuando se cambian permisos)
 */
export function clearPermissionCache(userId?: string): void {
  if (userId) {
    // Limpiar solo para un usuario específico
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    // Vaciar completamente el caché de permisos
    permissionCache.clear();
  }
}

const rbacDynamic = {
  isSystemUser,
  checkUserPermission,
  getUserPermissions,
  getUserRoles,
  getUserRolesFiltered,
  checkModuleAccess,
  getUserVisibleModules,
  checkMultiplePermissions,
  checkSessionPermission,
  requirePermission,
  checkUserPermissionCached,
  clearPermissionCache,
  filterSystemUsers,
  filterSystemRoles,
  canAccessRoute,
};

export default rbacDynamic;

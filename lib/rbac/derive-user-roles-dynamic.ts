import { prisma } from '@/lib/prisma';

export interface DerivedRoles {
  primaryRole: string | null; // Cambiar de TipoRol enum a string dinámico
  roles: string[]; // todas las asignaciones RBAC dinámicas
  source: 'rbac' | 'none';
}

/**
 * VERSIÓN CORREGIDA: Deriva roles dinámicamente desde rbac_roles
 * No depende de enum hardcodeado, lee todos los roles de la base de datos
 */
export async function deriveUserRolesDynamic(userId: string): Promise<DerivedRoles> {
  try {
    // 1. Obtener roles asignados al usuario directamente desde la DB
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: {
        user_id: userId,
      },
      include: {
        rbac_roles: true,
      },
    });
    // 2. Extraer nombres de roles válidos (solo roles activos)
    const validRoles: string[] = userRoles
      .filter((ur) => ur.rbac_roles?.is_active === true) // Filtrar roles activos
      .map((ur) => ur.rbac_roles?.name)
      .filter((name): name is string => !!name);
    if (validRoles.length === 0) {
      return { primaryRole: null, roles: [], source: 'none' };
    }

    // 3. Determinar rol primario usando orden de precedencia dinámico
    const primaryRole = await determinePrimaryRoleDynamic(validRoles);
    return {
      primaryRole,
      roles: Array.from(new Set(validRoles)), // eliminar duplicados
      source: 'rbac',
    };
  } catch (error) {
    return { primaryRole: null, roles: [], source: 'none' };
  }
}

/**
 * Determina el rol primario basado en un orden de precedencia dinámico
 * 1. UNIDADC (mayor privilegio)
 * 2. ADMINISTRADOR
 * 3. OPERADOR
 * 4. Cualquier otro rol (menor privilegio)
 *
 * NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
 */
async function determinePrimaryRoleDynamic(roles: string[]): Promise<string | null> {
  if (roles.length === 0) return null;
  if (roles.length === 1) return roles[0];

  // Orden de precedencia (mayor a menor privilegio)
  const precedenceOrder = ['UNIDADC', 'ADMINISTRADOR', 'OPERADOR'];

  // Buscar el rol de mayor precedencia
  for (const highPriorityRole of precedenceOrder) {
    const found = roles.find((role) => role.toUpperCase() === highPriorityRole.toUpperCase());
    if (found) {
      return found;
    }
  }

  // Si no hay roles de precedencia conocida, devolver el primero
  return roles[0];
}

/**
 * Función de migración para reemplazar la función anterior
 * Mantiene compatibilidad mientras se migra el código
 */
export async function deriveUserRoles(userId: string): Promise<DerivedRoles> {
  return deriveUserRolesDynamic(userId);
}

/**
 * Función de utilidad para obtener todos los roles disponibles dinámicamente
 */
export async function getAllAvailableRoles(): Promise<string[]> {
  try {
    const roles = await prisma.rbac_roles.findMany({
      where: { is_active: true },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => r.name);
  } catch (error) {
    return [];
  }
}

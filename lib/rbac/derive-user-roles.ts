import { prisma } from '@/lib/prisma';
import { TipoRol } from '@/lib/tipo-rol';

// Orden de precedencia (mayor privilegio primero)
// NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
const ROLE_PRIORITY: TipoRol[] = [TipoRol.UNIDADC, TipoRol.ADMINISTRADOR, TipoRol.OPERADOR];

export interface DerivedRoles {
  primaryRole: TipoRol | null;
  roles: TipoRol[]; // todas las asignaciones RBAC (sin duplicados)
  source: 'rbac' | 'none';
}

/**
 * Deriva roles de un usuario a partir de la tabla relacional RBAC.
 * OPTIMIZADO: Single query con eager loading
 */
export async function deriveUserRoles(userId: string): Promise<DerivedRoles> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      rbac_user_roles: {
        select: { rbac_roles: { select: { name: true } } },
      },
    },
  });

  if (!user) {
    return { primaryRole: null, roles: [], source: 'none' };
  }

  const rbacRoles: TipoRol[] = user.rbac_user_roles
    .map((rr) => rr.rbac_roles?.name)
    .filter((n): n is string => !!n)
    // Normalizar: aceptar tanto 'DESARROLLADOR' como 'desarrollador'
    .map((n) => {
      const raw = String(n);
      const found = (Object.values(TipoRol) as string[]).find(
        (ev) => ev.toLowerCase() === raw.toLowerCase()
      );
      return found ? (found as TipoRol) : null;
    })
    .filter((r): r is TipoRol => r !== null);

  const uniqueRoles = Array.from(new Set(rbacRoles));

  if (uniqueRoles.length > 0) {
    const primary = ROLE_PRIORITY.find((r) => uniqueRoles.includes(r)) || uniqueRoles[0];
    return { primaryRole: primary, roles: uniqueRoles, source: 'rbac' };
  }

  return { primaryRole: null, roles: [], source: 'none' };
}

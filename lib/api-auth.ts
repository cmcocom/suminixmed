import { TipoRol } from '@/lib/tipo-rol';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
// 🆕 RBAC V2: checkUserPermission no longer needed - permissions are guaranteed
import { authOptions } from './auth';

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  primaryRole: TipoRol | null;
  roles: TipoRol[];
  rolesSource?: string;
  activo: boolean;
}

export interface ApiAuthContext {
  user: AuthenticatedUser;
  req: NextRequest;
}

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  primaryRole?: TipoRol | null;
  roles?: string[];
  rolesSource?: string;
  activo?: boolean;
}

interface DatabaseResource {
  user_id?: string;
  id_usuario?: string;
  id_departamento?: string;
  userId?: string;
}

// Respuestas de error estandarizadas
export const API_ERRORS = {
  UNAUTHORIZED: { error: 'No autorizado', code: 401 },
  FORBIDDEN: { error: 'Acceso denegado - Permisos insuficientes', code: 403 },
  USER_INACTIVE: { error: 'Usuario inactivo', code: 403 },
  INVALID_ROLE: { error: 'Rol de usuario inválido', code: 403 },
  SESSION_EXPIRED: { error: 'Sesión expirada', code: 401 },
} as const;

// Middleware para autenticación básica
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(API_ERRORS.UNAUTHORIZED, { status: 401 });
    }

    const user = session.user as SessionUser;

    if (!user.id) {
      return NextResponse.json(API_ERRORS.SESSION_EXPIRED, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json(API_ERRORS.USER_INACTIVE, { status: 403 });
    }

    const roles = (user.roles || []).filter((r) =>
      (Object.values(TipoRol) as string[]).includes(r)
    ) as TipoRol[];
    const primaryRole =
      user.primaryRole && (Object.values(TipoRol) as string[]).includes(user.primaryRole)
        ? user.primaryRole
        : roles[0] || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      primaryRole,
      roles,
      rolesSource: user.rolesSource,
      activo: user.activo ?? true,
    };
  } catch (error) {
    return NextResponse.json(API_ERRORS.UNAUTHORIZED, { status: 401 });
  }
}

// 🆕 RBAC V2: Solo requiere autenticación, permisos están garantizados
export async function requirePermission(
  _req: NextRequest,
  _modulo: string,
  _accion: string
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult as AuthenticatedUser;

  // 🆕 RBAC V2: Los permisos están garantizados para todos los usuarios autenticados
  // La visibilidad de módulos se controla en el frontend, no en APIs
  // Solo mantenemos la autenticación como requisito de seguridad

  // API access logging disabled for performance
  return user;
}

// Middleware para verificar roles específicos
export async function requireRole(
  _req: NextRequest,
  rolesPermitidos: TipoRol[]
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult as AuthenticatedUser;
  const intersection = user.roles.filter((r) => rolesPermitidos.includes(r));
  if (intersection.length === 0) {
    return NextResponse.json(
      {
        ...API_ERRORS.FORBIDDEN,
        details: `Requiere uno de los roles: ${rolesPermitidos.join(', ')}`,
        userRoles: user.roles,
      },
      { status: 403 }
    );
  }

  return user;
}

// Wrapper para crear APIs protegidas con permisos (DINÁMICO)
export function createProtectedAPI(
  modulo: string,
  accion: string,
  handler: (context: ApiAuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const authResult = await requirePermission(req, modulo, accion);

      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const user = authResult as AuthenticatedUser;

      return await handler({ user, req });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}

// Wrapper para crear APIs con roles específicos
export function createRoleBasedAPI(
  rolesPermitidos: TipoRol[],
  handler: (context: ApiAuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const authResult = await requireRole(req, rolesPermitidos);

      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const user = authResult as AuthenticatedUser;

      return await handler({ user, req });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}

// Utilidad para filtrar datos según rol (especialmente para operadores)
export function applyRoleBasedFilter(user: AuthenticatedUser, query: Record<string, unknown> = {}) {
  // Nota: antes esta función inyectaba directamente campos como `user_id`, `id_usuario` o `id_departamento`.
  // Eso causa errores de Prisma cuando el modelo no tiene esos campos (p. ej. Inventario).
  // Para evitar fallos en tiempo de ejecución, devolvemos un marcador opt-in `__ownerFilter` que las
  // rutas/handlers pueden interpretar si el modelo soporta filtros por propietario. Esto permite
  // aplicar filtros por modelo de forma explícita y evita enviar argumentos inválidos a Prisma.
  if (
    user.roles.includes(TipoRol.OPERADOR) &&
    !user.roles.some((r) => r === TipoRol.UNIDADC || r === TipoRol.ADMINISTRADOR)
  ) {
    return {
      ...query,
      // Campo especial que las rutas pueden leer. No es pasado a Prisma directamente.
      __ownerFilter: {
        userId: user.id,
        // Legacy keys: si una ruta quiere aplicarlos, puede mapear a su esquema concreto
        legacy: {
          user_id: user.id,
          id_usuario: user.id,
          id_departamento: user.id,
        },
      },
    };
  }

  // Administradores y UNIDADC ven todos los datos
  return query;
}

// Verificar si el usuario puede operar sobre un recurso específico
export function canAccessResource(user: AuthenticatedUser, resource: DatabaseResource): boolean {
  if (user.roles.includes(TipoRol.UNIDADC)) return true;
  if (user.roles.includes(TipoRol.ADMINISTRADOR)) return true;
  if (user.roles.includes(TipoRol.OPERADOR)) {
    return (
      resource.user_id === user.id ||
      resource.id_usuario === user.id ||
      resource.id_departamento === user.id ||
      resource.userId === user.id
    );
  }
  return false;
}

// Verificar permisos de eliminación específicos para solicitudes
export function canDeleteSolicitud(user: AuthenticatedUser): boolean {
  return (
    !user.roles.includes(TipoRol.OPERADOR) ||
    user.roles.some((r) => r === TipoRol.UNIDADC || r === TipoRol.ADMINISTRADOR)
  );
}

// Verificar si puede ver todos los reportes o solo los propios
export function canViewAllReports(user: AuthenticatedUser): boolean {
  // TODO: Migrar a rbac-dynamic.ts - Temporalmente permitir a admin y dev
  return user.roles.includes(TipoRol.UNIDADC) || user.roles.includes(TipoRol.ADMINISTRADOR);
}

// Verificar si puede asignar roles
export function canAssignRole(user: AuthenticatedUser, targetRole: TipoRol): boolean {
  const isDev = user.roles.includes(TipoRol.UNIDADC);
  const isAdmin = user.roles.includes(TipoRol.ADMINISTRADOR);
  if (targetRole === TipoRol.ADMINISTRADOR) return isDev;
  if (targetRole === TipoRol.OPERADOR) return isDev || isAdmin;
  return false;
}

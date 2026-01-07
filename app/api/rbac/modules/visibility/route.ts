import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/rbac/modules/visibility
 *
 * Obtiene la configuración de visibilidad de módulos basada en permisos RBAC.
 * Sistema unificado: usa rbac_role_permissions con granted=true/false para controlar visibilidad.
 *
 * @param roleId - (Query param) ID del rol para obtener configuración específica
 * @returns Record<string, boolean> - Mapa de módulos con su estado de visibilidad
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string } | undefined)?.id || null;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    // Si se especifica roleId, cargar permisos LEER del rol
    if (roleId) {
      try {
        // Obtener todos los permisos LEER del rol desde rbac_role_permissions
        const rolePermissions = await prisma.rbac_role_permissions.findMany({
          where: {
            role_id: roleId,
          },
          include: {
            rbac_permissions: true,
          },
        });

        // Filtrar solo permisos LEER activos y construir mapa de visibilidad
        const roleVisibility: Record<string, boolean> = {};

        rolePermissions.forEach((rp) => {
          if (rp.rbac_permissions?.action === 'LEER' && rp.rbac_permissions?.is_active) {
            roleVisibility[rp.rbac_permissions.module] = rp.granted;
          }
        });

        return NextResponse.json({
          moduleVisibility: roleVisibility,
          scope: 'role-permissions',
          roleId: roleId,
        });
      } catch (e) {
        console.error('[RBAC] Error cargando permisos del rol:', e);
        return NextResponse.json(
          { error: 'Error al cargar configuración del rol' },
          { status: 500 }
        );
      }
    } else {
      // Sin roleId: obtener permisos basados en roles del usuario actual
      const moduleVisibility: Record<string, boolean> = {};

      try {
        if (!userId) {
          return NextResponse.json({
            moduleVisibility: {},
            scope: 'no-user',
            userRoles: [],
          });
        }

        // Obtener roles del usuario
        const userRoles = await prisma.rbac_user_roles.findMany({
          where: { user_id: userId },
          select: { role_id: true },
        });

        const roleIds = userRoles.map((ur) => ur.role_id);

        if (roleIds.length === 0) {
          return NextResponse.json({
            moduleVisibility: {},
            scope: 'no-roles',
            userRoles: [],
          });
        }

        // Obtener todos los permisos LEER de los roles del usuario
        const permissions = await prisma.rbac_role_permissions.findMany({
          where: {
            role_id: { in: roleIds },
            rbac_permissions: {
              is: {
                action: 'LEER',
                is_active: true,
              },
            },
          },
          include: {
            rbac_permissions: true,
          },
        });

        // Procesar permisos: si CUALQUIER rol tiene granted=true, el módulo es visible
        permissions.forEach((rp) => {
          if (rp.rbac_permissions && rp.rbac_permissions.action === 'LEER') {
            const moduleName = rp.rbac_permissions.module;

            // Si ya está en true, mantenerlo (OR lógico entre roles)
            if (moduleVisibility[moduleName] !== true) {
              moduleVisibility[moduleName] = rp.granted;
            }
          }
        });

        return NextResponse.json({
          moduleVisibility,
          scope: 'user-roles-permissions',
          userRoles: roleIds,
        });
      } catch (e) {
        console.error('[RBAC] Error cargando permisos del usuario:', e);
        return NextResponse.json(
          {
            moduleVisibility: {},
            scope: 'error',
            error: e instanceof Error ? e.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('[RBAC] Error en GET /api/rbac/modules/visibility:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

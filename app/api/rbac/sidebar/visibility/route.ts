import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';

/**
 * 🆕 NUEVA ARQUITECTURA RBAC
 *
 * GET /api/rbac/sidebar/visibility
 *
 * ✅ Obtiene solo VISIBILIDAD (nueva tabla rbac_module_visibility)
 * ✅ Los PERMISOS están garantizados (siempre granted=true)
 * ✅ Sidebar consulta esta API en lugar de permisos
 *
 * Query params:
 * - roleId (opcional): Obtener visibilidad para un rol específico
 * - userId (opcional): Obtener visibilidad para un usuario específico
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    const userId = searchParams.get('userId') || session.user.id;

    // Si se especifica roleId, usar ese rol
    if (roleId) {
      return await getVisibilityForRole(roleId);
    }

    // Si no, obtener visibilidad para el usuario actual
    return await getVisibilityForUser(userId);
  } catch (error) {
    console.error('[RBAC-NEW] Error obteniendo visibilidad sidebar:', error);
    return NextResponse.json(
      {
        error: 'Error interno al obtener visibilidad',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

async function getVisibilityForRole(roleId: string) {
  try {
    // Validar rol
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, is_system_role: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Usuarios de sistema ven TODO
    if (role.is_system_role) {
      const allVisible = ALL_MODULES.reduce(
        (acc, moduleKey) => {
          acc[moduleKey] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );

      return NextResponse.json({
        userId: null,
        roleId,
        roleName: role.name,
        isSystemRole: true,
        moduleVisibility: allVisible,
        source: 'system_role_all_visible',
        architectureVersion: 'v2-separated',
      });
    }

    // Obtener configuración de visibilidad
    const visibilityRecords = await prisma.rbac_module_visibility.findMany({
      where: { role_id: roleId },
      select: {
        module_key: true,
        is_visible: true,
      },
    });

    // Crear mapa de visibilidad (default: visible)
    const moduleVisibility: Record<string, boolean> = {};
    const recordsMap = visibilityRecords.reduce(
      (acc, record) => {
        acc[record.module_key] = record.is_visible;
        return acc;
      },
      {} as Record<string, boolean>
    );

    // Incluir TODOS los módulos
    for (const moduleKey of ALL_MODULES) {
      moduleVisibility[moduleKey] = recordsMap[moduleKey] ?? true;
    }

    return NextResponse.json({
      userId: null,
      roleId,
      roleName: role.name,
      isSystemRole: false,
      moduleVisibility,
      visibleCount: Object.values(moduleVisibility).filter(Boolean).length,
      totalModules: ALL_MODULES.length,
      source: 'rbac_module_visibility',
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error en getVisibilityForRole:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo visibilidad del rol',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

async function getVisibilityForUser(userId: string) {
  try {
    // Obtener roles del usuario
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      include: {
        rbac_roles: {
          select: {
            id: true,
            name: true,
            is_system_role: true,
          },
        },
      },
    });

    if (userRoles.length === 0) {
      return NextResponse.json({
        userId,
        roles: [],
        moduleVisibility: {},
        source: 'no_roles',
        architectureVersion: 'v2-separated',
      });
    }

    // Si tiene rol de sistema, todo visible
    const hasSystemRole = userRoles.some((ur) => ur.rbac_roles.is_system_role);
    if (hasSystemRole) {
      const allVisible = ALL_MODULES.reduce(
        (acc, moduleKey) => {
          acc[moduleKey] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );

      return NextResponse.json({
        userId,
        roles: userRoles.map((ur) => ur.rbac_roles),
        hasSystemRole: true,
        moduleVisibility: allVisible,
        source: 'system_user_all_visible',
        architectureVersion: 'v2-separated',
      });
    }

    // Obtener visibilidad combinada de todos los roles
    const roleIds = userRoles.map((ur) => ur.role_id);
    const visibilityRecords = await prisma.rbac_module_visibility.findMany({
      where: {
        role_id: { in: roleIds },
      },
      select: {
        module_key: true,
        is_visible: true,
        role_id: true,
      },
    });

    // Combinar visibilidad: visible si AL MENOS UN rol lo tiene visible
    const moduleVisibility: Record<string, boolean> = {};

    for (const moduleKey of ALL_MODULES) {
      const moduleRecords = visibilityRecords.filter((vr) => vr.module_key === moduleKey);

      if (moduleRecords.length === 0) {
        // Sin configuración = visible por defecto
        moduleVisibility[moduleKey] = true;
      } else {
        // Visible si al menos un rol lo tiene visible
        moduleVisibility[moduleKey] = moduleRecords.some((mr) => mr.is_visible);
      }
    }

    return NextResponse.json({
      userId,
      roles: userRoles.map((ur) => ur.rbac_roles),
      hasSystemRole: false,
      moduleVisibility,
      visibleCount: Object.values(moduleVisibility).filter(Boolean).length,
      totalModules: ALL_MODULES.length,
      source: 'rbac_module_visibility_combined',
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error en getVisibilityForUser:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo visibilidad del usuario',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

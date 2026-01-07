import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';

// GET /api/rbac/summary
// Devuelve métricas agregadas del sistema RBAC para monitoreo rápido.
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [roles, permissions, userRoleLinks, users, auditCount] = await Promise.all([
      prisma.rbac_roles.findMany({
        select: {
          id: true,
          name: true,
          is_active: true,
          _count: { select: { rbac_user_roles: true, rbac_role_permissions: true } },
        },
      }),
      prisma.rbac_permissions.count(),
      prisma.rbac_user_roles.count(),
      prisma.user.findMany({
        select: { id: true, email: true, rbac_user_roles: { select: { role_id: true } } },
      }),
      prisma.rbac_audit_log.count(),
    ]);

    const usersWithoutRbac = users.filter((u) => u.rbac_user_roles.length === 0);
    const orphanPermissions = roles.reduce(
      (acc, r) => acc + (r._count.rbac_role_permissions === 0 ? 1 : 0),
      0
    );
    const inactiveRoles = roles.filter((r) => !r.is_active).length;
    const activeRoles = roles.length - inactiveRoles;

    const summary = {
      totals: {
        roles: roles.length,
        roles_active: activeRoles,
        roles_inactive: inactiveRoles,
        permissions: permissions,
        role_permission_links: roles.reduce((acc, r) => acc + r._count.rbac_role_permissions, 0),
        user_role_links: userRoleLinks,
        audit_events: auditCount,
      },
      consistency: {
        users_total: users.length,
        users_without_rbac_role: usersWithoutRbac.length,
        orphan_permissions_in_roles: orphanPermissions,
      },
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        is_active: r.is_active,
        users: r._count.rbac_user_roles,
        permissions: r._count.rbac_role_permissions,
      })),
      sample_unassigned_users: usersWithoutRbac
        .slice(0, 10)
        .map((u) => ({ email: u.email, rbac_roles_count: u.rbac_user_roles.length })),
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

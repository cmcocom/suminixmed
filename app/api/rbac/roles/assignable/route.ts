import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/rbac/roles/assignable - Obtener roles disponibles para asignar a usuarios
 *
 * Este endpoint es DIFERENTE a /api/rbac/roles:
 * - /api/rbac/roles: Gestión de roles (CRUD) - NO muestra roles de sistema
 * - /api/rbac/roles/assignable: Selector de roles al crear/editar usuarios - SÍ muestra roles de sistema para usuarios sistema
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ SISTEMA: Verificar si el usuario actual es usuario sistema
    const sessionUser = session.user as { id?: string };
    const currentUserRoles = await prisma.rbac_user_roles.findMany({
      where: { user_id: sessionUser.id! },
      include: { rbac_roles: true },
    });
    const isSystemUser = currentUserRoles.some((ur) => ur.rbac_roles.is_system_role === true);

    // ✅ Usuarios sistema pueden ver roles de sistema en el SELECTOR
    // ❌ Usuarios normales SOLO ven roles normales
    const roles = await prisma.rbac_roles.findMany({
      where: {
        is_active: true,
        // Solo filtrar roles de sistema si el usuario NO es sistema
        ...(isSystemUser ? {} : { is_system_role: false }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        is_system_role: true,
      },
      orderBy: [
        { is_system_role: 'desc' }, // Roles de sistema primero
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

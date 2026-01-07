import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { prisma } from '@/lib/prisma';

// GET - Obtener roles simples para formularios (sin paginación ni detalles)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ RBAC DINÁMICO: Verificar permiso para ver roles
    const hasPermission = await checkUserPermission(session.user.id, 'AJUSTES_RBAC', 'LEER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sin permisos para ver roles' }, { status: 403 });
    }

    // ✅ SISTEMA: Verificar si el usuario actual tiene roles de sistema
    const { hasSystemRole } = await import('@/lib/rbac-dynamic');
    const userHasSystemRole = await hasSystemRole(session.user.id);

    // Obtener roles activos con información básica y conteos
    // ✅ Usuarios con rol de sistema pueden ver TODOS los roles (incluidos roles de sistema)
    // ❌ Usuarios normales SOLO ven roles normales (is_system_role = false)
    const roles = await prisma.rbac_roles.findMany({
      where: {
        is_active: true,
        // Solo filtrar roles de sistema si el usuario NO tiene rol de sistema
        ...(userHasSystemRole ? {} : { is_system_role: false }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        is_active: true,
        is_system_role: true,
        _count: {
          select: {
            rbac_role_permissions: true,
            rbac_user_roles: true,
          },
        },
      },
      orderBy: [
        { is_system_role: 'desc' }, // Roles de sistema primero
        { name: 'asc' },
      ],
    });

    // Mapear roles para incluir conteos en el formato esperado
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      created_at: role.created_at,
      is_active: role.is_active,
      is_system_role: role.is_system_role, // ✅ Incluir flag de sistema
      permissions_count: role._count.rbac_role_permissions,
      users_count: role._count.rbac_user_roles,
    }));

    return NextResponse.json({
      success: true,
      roles: formattedRoles, // Usar "roles" como el hook espera
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

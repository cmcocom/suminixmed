import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/[id]/roles - Obtener roles RBAC de un usuario
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Obtener los parámetros
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        rbac_user_roles: {
          include: {
            rbac_roles: {
              select: {
                id: true,
                name: true,
                description: true,
                is_active: true,
              },
            },
          },
          where: {
            rbac_roles: {
              is_active: true,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Permitir al usuario ver sus propios roles o a quien tenga permiso ADMINISTRAR_PERMISOS
    const sessionUser = session.user;
    const isOwner = sessionUser.id === id;
    const hasAdminPermission = await checkSessionPermission(
      sessionUser,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );

    if (!isOwner && !hasAdminPermission) {
      return NextResponse.json(
        { error: 'Sin permisos para ver roles de este usuario' },
        { status: 403 }
      );
    }

    // Extraer solo los roles activos
    const roles = user.rbac_user_roles
      .filter((ur) => ur.rbac_roles.is_active)
      .map((ur) => ({
        id: ur.rbac_roles.id,
        name: ur.rbac_roles.name,
        description: ur.rbac_roles.description,
      }));

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = id;
    const { permissionId, assigned, assignedBy } = await request.json();

    if (!userId || !permissionId || typeof assigned !== 'boolean' || !assignedBy) {
      return NextResponse.json(
        { error: 'Datos requeridos: userId, permissionId, assigned, assignedBy' },
        { status: 400 }
      );
    }

    // Verificar que el permiso existe
    const permission = await prisma.rbac_permissions.findFirst({
      where: {
        id: permissionId,
        is_active: true,
      },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permiso no encontrado o inactivo' }, { status: 404 });
    }

    if (assigned) {
      // Asignar permiso: necesitamos crear un rol temporal o usar un rol existente
      // Por simplicidad, buscaremos si el usuario tiene un rol que ya tenga este permiso
      // o crearemos un rol personal para el usuario

      // Buscar si el usuario ya tiene este permiso a través de algún rol
      const existingPermission = await prisma.$queryRaw`
        SELECT DISTINCT rp.id
        FROM rbac_role_permissions rp
        JOIN rbac_user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ${userId}
        AND rp.permission_id = ${permissionId}
        AND rp.granted = true
        LIMIT 1
      `;

      if (Array.isArray(existingPermission) && existingPermission.length > 0) {
        return NextResponse.json({
          message: 'El usuario ya tiene este permiso asignado a través de un rol',
        });
      }

      // Buscar o crear un rol personal para el usuario
      let personalRole = await prisma.rbac_roles.findFirst({
        where: {
          name: `Personal_${userId}`,
          created_by: assignedBy,
        },
      });

      if (!personalRole) {
        personalRole = await prisma.rbac_roles.create({
          data: {
            id: crypto.randomUUID(),
            name: `Personal_${userId}`,
            description: `Rol personal para permisos específicos del usuario`,
            is_active: true,
            created_by: assignedBy,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Asignar el rol personal al usuario
        await prisma.rbac_user_roles.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            role_id: personalRole.id,
            assigned_by: assignedBy,
            assigned_at: new Date(),
          },
        });
      }

      // Asignar el permiso al rol personal
      const rolePermission = await prisma.rbac_role_permissions.create({
        data: {
          id: crypto.randomUUID(),
          role_id: personalRole.id,
          permission_id: permissionId,
          granted: true,
          granted_by: assignedBy,
          granted_at: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Permiso asignado exitosamente',
        rolePermission,
      });
    } else {
      // Quitar permiso: eliminar del rol personal del usuario
      const personalRole = await prisma.rbac_roles.findFirst({
        where: {
          name: `Personal_${userId}`,
          created_by: assignedBy,
        },
      });

      if (personalRole) {
        // Eliminar el permiso del rol personal
        await prisma.rbac_role_permissions.deleteMany({
          where: {
            role_id: personalRole.id,
            permission_id: permissionId,
          },
        });
      }

      return NextResponse.json({
        message: 'Permiso removido exitosamente',
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

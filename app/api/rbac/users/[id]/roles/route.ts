import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Obtener roles del usuario con información detallada
    const userRoles = (await prisma.$queryRaw`
      SELECT 
        ur.id,
        ur.role_id as "roleId",
        r.name as "roleName",
        r.description as "roleDescription",
        ur.assigned_at as "assignedAt",
        ur.assigned_by as "assignedBy",
        true as "isActive",
        COUNT(rp.permission_id) as "permissionCount"
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      WHERE ur.user_id = ${userId}
      GROUP BY ur.id, ur.role_id, r.name, r.description, ur.assigned_at, ur.assigned_by
      ORDER BY ur.assigned_at DESC
    `) as any[];

    // Convertir BigInt a número para evitar errores de serialización
    const convertBigIntToNumber = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return Number(obj);
      if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
      if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigIntToNumber(value);
        }
        return converted;
      }
      return obj;
    };

    const userRolesFormatted = convertBigIntToNumber(userRoles);

    // Obtener roles disponibles que no están asignados al usuario
    const availableRoles = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.name,
        r.description,
        false as "isSystemRole",
        COUNT(rp.permission_id) as "permissionCount"
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      WHERE r.id NOT IN (
        SELECT role_id 
        FROM rbac_user_roles 
        WHERE user_id = ${userId}
      )
      AND r.is_active = true
      AND r.is_system_role = false
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `;

    const availableRolesFormatted = Array.isArray(availableRoles)
      ? availableRoles.map((role) => ({
          ...role,
          permissionCount: Number(role.permissionCount), // Convertir BigInt a número
        }))
      : [];

    return NextResponse.json({
      userRoles: userRolesFormatted || [],
      availableRoles: availableRolesFormatted,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const { roleId, assignedBy } = await request.json();

    if (!userId || !roleId || !assignedBy) {
      return NextResponse.json(
        { error: 'Datos requeridos: userId, roleId, assignedBy' },
        { status: 400 }
      );
    }

    // Verificar que el rol existe y está activo
    const role = await prisma.rbac_roles.findFirst({
      where: {
        id: roleId,
        is_active: true,
        is_system_role: false, // No permitir asignar roles de sistema
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado o inactivo' }, { status: 404 });
    }

    // ✅ VALIDACIÓN: Verificar que el usuario NO tenga ya OTRO rol asignado
    // Un usuario solo puede tener UN rol a la vez
    const existingRoles = await prisma.rbac_user_roles.findMany({
      where: {
        user_id: userId,
      },
      include: {
        rbac_roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingRoles.length > 0) {
      // Si el usuario ya tiene el mismo rol, retornar error específico
      const sameRole = existingRoles.find((ur) => ur.role_id === roleId);
      if (sameRole) {
        return NextResponse.json(
          { error: 'El usuario ya tiene este rol asignado' },
          { status: 409 }
        );
      }

      // Si el usuario tiene un rol diferente, retornar error indicando que debe removerse primero
      const currentRoleNames = existingRoles.map((ur) => ur.rbac_roles.name).join(', ');
      return NextResponse.json(
        {
          error:
            'El usuario ya tiene un rol asignado. Cada usuario solo puede tener un rol a la vez.',
          details: `Rol(es) actual(es): ${currentRoleNames}`,
          suggestion: 'Primero debe remover el rol actual antes de asignar uno nuevo.',
          currentRoles: existingRoles.map((ur) => ({
            id: ur.id,
            roleId: ur.role_id,
            roleName: ur.rbac_roles.name,
          })),
        },
        { status: 409 }
      );
    }

    // Asignar el rol al usuario
    const userRole = await prisma.rbac_user_roles.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Rol asignado exitosamente',
      userRole,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const { userRoleId } = await request.json();

    if (!userId || !userRoleId) {
      return NextResponse.json({ error: 'Datos requeridos: userId, userRoleId' }, { status: 400 });
    }

    // Verificar que el rol pertenece al usuario
    const userRole = await prisma.rbac_user_roles.findFirst({
      where: {
        id: userRoleId,
        user_id: userId,
      },
    });

    if (!userRole) {
      return NextResponse.json({ error: 'Rol de usuario no encontrado' }, { status: 404 });
    }

    // Actualizar la fecha de modificación
    const updatedUserRole = await prisma.rbac_user_roles.update({
      where: {
        id: userRoleId,
      },
      data: {
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Rol actualizado exitosamente',
      userRole: updatedUserRole,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { userRoleId } = await request.json();

    if (!userId || !userRoleId) {
      return NextResponse.json({ error: 'Datos requeridos: userId, userRoleId' }, { status: 400 });
    }

    // Verificar que el rol pertenece al usuario
    const userRole = await prisma.rbac_user_roles.findFirst({
      where: {
        id: userRoleId,
        user_id: userId,
      },
    });

    if (!userRole) {
      return NextResponse.json({ error: 'Rol de usuario no encontrado' }, { status: 404 });
    }

    // Eliminar el rol del usuario
    await prisma.rbac_user_roles.delete({
      where: {
        id: userRoleId,
      },
    });

    return NextResponse.json({
      message: 'Rol eliminado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

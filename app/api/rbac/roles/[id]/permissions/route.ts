import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener permisos de un rol con estado de asignación
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(
      session.user.id,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener todos los permisos con estado de asignación para este rol
    const permissions = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
        is_active: true,
        rbac_role_permissions: {
          where: { role_id: roleId },
          select: { id: true },
        },
      },
      orderBy: [{ module: 'asc' }, { action: 'asc' }, { name: 'asc' }],
    });

    // Agregar información de asignación
    const permissionsWithAssignment = permissions.map((permission) => ({
      ...permission,
      is_assigned: permission.rbac_role_permissions.length > 0,
      rbac_role_permissions: undefined, // Remover la relación del resultado
    }));

    // Contar permisos asignados
    const assigned_count = permissionsWithAssignment.filter((p) => p.is_assigned).length;

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissions: permissionsWithAssignment,
        assigned_count,
        total_permissions: permissions.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Asignar permisos a un rol
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(
      session.user.id,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    const { permission_ids } = await request.json();

    if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
      return NextResponse.json({ error: 'IDs de permisos requeridos' }, { status: 400 });
    }

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Verificar que todos los permisos existen
    const permissions = await prisma.rbac_permissions.findMany({
      where: {
        id: { in: permission_ids },
        is_active: true,
      },
    });

    if (permissions.length !== permission_ids.length) {
      return NextResponse.json(
        { error: 'Algunos permisos no fueron encontrados' },
        { status: 400 }
      );
    }

    // Crear las asignaciones (ignorar duplicados)
    const assignments = permission_ids.map((permissionId: string) => ({
      id: randomUUID(),
      role_id: roleId,
      permission_id: permissionId,
      granted_by: session.user?.email || 'system',
    }));

    await prisma.rbac_role_permissions.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: randomUUID(),
        table_name: 'rbac_role_permissions',
        operation: 'ASSIGN_PERMISSIONS',
        record_id: roleId,
        old_values: undefined,
        new_values: {
          permission_ids,
          assigned_count: permission_ids.length,
        },
        user_id: session.user?.email || 'system',
      },
    });

    return NextResponse.json({
      success: true,
      message: `${permission_ids.length} permisos asignados correctamente`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Alternar (asignar/quitar) un permiso individual
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(
      session.user.id,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    const { permissionId, assigned } = await request.json();

    if (!permissionId || typeof assigned !== 'boolean') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Validar rol y permiso
    const [role, permission] = await Promise.all([
      prisma.rbac_roles.findUnique({ where: { id: roleId } }),
      prisma.rbac_permissions.findUnique({ where: { id: permissionId } }),
    ]);
    if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    if (!permission) return NextResponse.json({ error: 'Permiso no encontrado' }, { status: 404 });

    if (assigned) {
      await prisma.rbac_role_permissions.upsert({
        where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } },
        create: {
          id: randomUUID(),
          role_id: roleId,
          permission_id: permissionId,
          granted_by: session.user.email || 'system',
        },
        update: { granted: true },
      });
    } else {
      await prisma.rbac_role_permissions.deleteMany({
        where: { role_id: roleId, permission_id: permissionId },
      });
    }

    return NextResponse.json({ success: true, message: 'Permiso actualizado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Revocar permisos de un rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(
      session.user.id,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    const { permission_ids } = await request.json();

    if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
      return NextResponse.json({ error: 'IDs de permisos requeridos' }, { status: 400 });
    }

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Eliminar las asignaciones
    const deleteResult = await prisma.rbac_role_permissions.deleteMany({
      where: {
        role_id: roleId,
        permission_id: { in: permission_ids },
      },
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: randomUUID(),
        table_name: 'rbac_role_permissions',
        operation: 'REVOKE_PERMISSIONS',
        record_id: roleId,
        old_values: {
          permission_ids,
          revoked_count: deleteResult.count,
        },
        new_values: undefined,
        user_id: session.user?.email || 'system',
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} permisos revocados correctamente`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

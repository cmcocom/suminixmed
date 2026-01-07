import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
// Removed unused Prisma import to satisfy linter
import { z } from 'zod';

// Esquema de validación para asignación de permisos
const assignPermissionsSchema = z.object({
  role_id: z.string().uuid('El ID del rol debe ser un UUID válido'),
  permission_ids: z.array(z.string().uuid()).min(1, 'Debe especificar al menos un permiso'),
});

const revokePermissionsSchema = z.object({
  role_id: z.string().uuid('El ID del rol debe ser un UUID válido'),
  permission_ids: z.array(z.string().uuid()).min(1, 'Debe especificar al menos un permiso'),
});

// GET - Obtener permisos de un rol específico
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role_id');

    // Validar UUID
    if (!roleId) {
      return NextResponse.json({ error: 'ID de rol requerido' }, { status: 400 });
    }

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const roleExists = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!roleExists) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener todos los permisos con indicador de si están asignados al rol
    // Usar $queryRaw con template tag (previene SQL injection)
    const permissions = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        module: string;
        action: string;
        is_active: boolean;
        assigned: boolean;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.module,
        p.action,
        p.is_active,
        CASE WHEN rp.role_id IS NOT NULL THEN true ELSE false END as assigned
      FROM rbac_permissions p
      LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ${roleId}
      WHERE p.is_active = true
      ORDER BY p.module, p.action, p.name
    `;

    const permissionsByModule = permissions.reduce<Record<string, typeof permissions>>(
      (acc, permission) => {
        if (!acc[permission.module]) acc[permission.module] = [];
        acc[permission.module].push(permission);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      data: {
        role_id: roleId,
        permissions: permissionsByModule,
        all_permissions: permissions,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Asignar permisos a un rol
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = assignPermissionsSchema.parse(body);

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const roleExists = await prisma.rbac_roles.findUnique({
      where: { id: validatedData.role_id },
      select: { id: true, name: true },
    });

    if (!roleExists) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Verificar que todos los permisos existen usando Prisma ORM (previene SQL injection)
    const permissionsExist = await prisma.rbac_permissions.findMany({
      where: {
        id: { in: validatedData.permission_ids },
        is_active: true,
      },
      select: { id: true },
    });

    if (permissionsExist.length !== validatedData.permission_ids.length) {
      return NextResponse.json(
        { error: 'Uno o más permisos no existen o están inactivos' },
        { status: 400 }
      );
    }

    // Obtener permisos ya asignados usando Prisma ORM (previene SQL injection)
    const existingAssignments = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: validatedData.role_id,
        permission_id: { in: validatedData.permission_ids },
      },
      select: { permission_id: true },
    });

    const existingPermissionIds = existingAssignments.map((a) => a.permission_id);
    const newPermissionIds = validatedData.permission_ids.filter(
      (id) => !existingPermissionIds.includes(id)
    );

    if (newPermissionIds.length === 0) {
      return NextResponse.json(
        { message: 'Todos los permisos ya están asignados al rol' },
        { status: 200 }
      );
    }

    // Asignar nuevos permisos usando createMany (previene SQL injection)
    const now = new Date();
    await prisma.rbac_role_permissions.createMany({
      data: newPermissionIds.map((permissionId) => ({
        id: crypto.randomUUID(),
        role_id: validatedData.role_id,
        permission_id: permissionId,
        granted_by: session.user.email,
        granted_at: now,
      })),
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: crypto.randomUUID(),
        table_name: 'rbac_role_permissions',
        operation: 'INSERT',
        record_id: validatedData.role_id,
        old_values: { existing_permissions: existingPermissionIds },
        new_values: { new_permissions: newPermissionIds },
        user_id: session.user.email,
      },
    });

    return NextResponse.json({
      message: `${newPermissionIds.length} permisos asignados exitosamente al rol`,
      data: {
        role_id: validatedData.role_id,
        assigned_permissions: newPermissionIds,
        skipped_permissions: existingPermissionIds,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Revocar permisos de un rol
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = revokePermissionsSchema.parse(body);

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const roleExists = await prisma.rbac_roles.findUnique({
      where: { id: validatedData.role_id },
      select: { id: true, name: true },
    });

    if (!roleExists) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Verificar qué permisos están actualmente asignados usando Prisma ORM (previene SQL injection)
    const currentAssignments = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: validatedData.role_id,
        permission_id: { in: validatedData.permission_ids },
      },
      select: { permission_id: true },
    });

    const assignedPermissionIds = currentAssignments.map((a) => a.permission_id);

    if (assignedPermissionIds.length === 0) {
      return NextResponse.json(
        { message: 'Ninguno de los permisos especificados está asignado al rol' },
        { status: 200 }
      );
    }

    // Revocar permisos usando Prisma ORM (previene SQL injection)
    await prisma.rbac_role_permissions.deleteMany({
      where: {
        role_id: validatedData.role_id,
        permission_id: { in: assignedPermissionIds },
      },
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: crypto.randomUUID(),
        table_name: 'rbac_role_permissions',
        operation: 'DELETE',
        record_id: validatedData.role_id,
        old_values: { revoked_permissions: assignedPermissionIds },
        new_values: undefined,
        user_id: session.user.email,
      },
    });

    const notAssignedPermissions = validatedData.permission_ids.filter(
      (id) => !assignedPermissionIds.includes(id)
    );

    return NextResponse.json({
      message: `${assignedPermissionIds.length} permisos revocados exitosamente del rol`,
      data: {
        role_id: validatedData.role_id,
        revoked_permissions: assignedPermissionIds,
        not_assigned_permissions: notAssignedPermissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
// Removed unused Prisma import to satisfy linter
import { z } from 'zod';

// Esquema de validación para asignación de roles a usuarios
const assignUserRoleSchema = z.object({
  user_id: z.string().uuid('El ID del usuario debe ser un UUID válido'),
  role_ids: z.array(z.string().uuid()).min(1, 'Debe especificar al menos un rol'),
});

const revokeUserRoleSchema = z.object({
  user_id: z.string().uuid('El ID del usuario debe ser un UUID válido'),
  role_ids: z.array(z.string().uuid()).min(1, 'Debe especificar al menos un rol'),
});

// GET - Obtener roles de un usuario específico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Verificar que el usuario existe (usando Prisma ORM - previene SQL injection)
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, activo: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener todos los roles con indicador de si están asignados al usuario
    // Usar $queryRaw con template tag (previene SQL injection)
    const roles = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        is_active: boolean;
        assigned: boolean;
        assigned_at: Date | null;
        assigned_by: string | null;
      }>
    >`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_active,
        CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as assigned,
        ur.assigned_at,
        ur.assigned_by
      FROM rbac_roles r
      LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.user_id = ${userId}
      WHERE r.is_active = true
      ORDER BY r.name
    `;

    return NextResponse.json({
      data: {
        user: userExists,
        roles: roles,
        assigned_roles: roles.filter((role) => role.assigned),
        available_roles: roles.filter((role) => !role.assigned),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Asignar roles a un usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = assignUserRoleSchema.parse(body);

    // Verificar que el usuario existe (usando Prisma ORM - previene SQL injection)
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.user_id },
      select: { id: true, name: true, email: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que todos los roles existen y están activos (usando Prisma ORM - previene SQL injection)
    const rolesExist = await prisma.rbac_roles.findMany({
      where: {
        id: { in: validatedData.role_ids },
        is_active: true,
      },
      select: { id: true },
    });

    if (rolesExist.length !== validatedData.role_ids.length) {
      return NextResponse.json(
        { error: 'Uno o más roles no existen o están inactivos' },
        { status: 400 }
      );
    }

    // Obtener roles ya asignados (usando Prisma ORM - previene SQL injection)
    const existingAssignments = await prisma.rbac_user_roles.findMany({
      where: {
        user_id: validatedData.user_id,
        role_id: { in: validatedData.role_ids },
      },
      select: { role_id: true },
    });

    const existingRoleIds = existingAssignments.map((a) => a.role_id);
    const newRoleIds = validatedData.role_ids.filter((id) => !existingRoleIds.includes(id));

    if (newRoleIds.length === 0) {
      return NextResponse.json(
        { message: 'Todos los roles ya están asignados al usuario' },
        { status: 200 }
      );
    }

    // Asignar nuevos roles usando createMany (previene SQL injection)
    const now = new Date();
    await prisma.rbac_user_roles.createMany({
      data: newRoleIds.map((roleId) => ({
        id: crypto.randomUUID(),
        user_id: validatedData.user_id,
        role_id: roleId,
        assigned_by: session.user.email,
        assigned_at: now,
        updated_at: now,
      })),
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: crypto.randomUUID(),
        table_name: 'rbac_user_roles',
        operation: 'INSERT',
        record_id: validatedData.user_id,
        old_values: { existing_roles: existingRoleIds },
        new_values: { new_roles: newRoleIds },
        user_id: session.user.email,
      },
    });

    return NextResponse.json({
      message: `${newRoleIds.length} roles asignados exitosamente al usuario`,
      data: {
        user_id: validatedData.user_id,
        assigned_roles: newRoleIds,
        skipped_roles: existingRoleIds,
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

// DELETE - Revocar roles de un usuario
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = revokeUserRoleSchema.parse(body);

    // Verificar que el usuario existe (usando Prisma ORM - previene SQL injection)
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.user_id },
      select: { id: true, name: true, email: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar qué roles están actualmente asignados (usando Prisma ORM - previene SQL injection)
    const currentAssignments = await prisma.rbac_user_roles.findMany({
      where: {
        user_id: validatedData.user_id,
        role_id: { in: validatedData.role_ids },
      },
      select: { role_id: true },
    });

    const assignedRoleIds = currentAssignments.map((a) => a.role_id);

    if (assignedRoleIds.length === 0) {
      return NextResponse.json(
        { message: 'Ninguno de los roles especificados está asignado al usuario' },
        { status: 200 }
      );
    }

    // Revocar roles usando Prisma ORM (previene SQL injection)
    await prisma.rbac_user_roles.deleteMany({
      where: {
        user_id: validatedData.user_id,
        role_id: { in: assignedRoleIds },
      },
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: crypto.randomUUID(),
        table_name: 'rbac_user_roles',
        operation: 'DELETE',
        record_id: validatedData.user_id,
        old_values: { revoked_roles: assignedRoleIds },
        new_values: undefined,
        user_id: session.user.email,
      },
    });

    const notAssignedRoles = validatedData.role_ids.filter((id) => !assignedRoleIds.includes(id));

    return NextResponse.json({
      message: `${assignedRoleIds.length} roles revocados exitosamente del usuario`,
      data: {
        user_id: validatedData.user_id,
        revoked_roles: assignedRoleIds,
        not_assigned_roles: notAssignedRoles,
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

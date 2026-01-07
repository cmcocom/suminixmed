import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema de validación para actualización de roles
const updateRoleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET - Obtener rol específico
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Verificación temporal mientras migra a RBAC dinámico
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado - sesión requerida' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json({ error: 'ID de rol inválido' }, { status: 400 });
    }

    // Obtener rol con conteo de permisos y usuarios usando $queryRaw con template tag (previene SQL injection)
    const result = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        created_by: string;
        permissions_count: bigint;
        users_count: bigint;
      }>
    >`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at,
        r.created_by,
        COUNT(DISTINCT rp.permission_id) as permissions_count,
        COUNT(DISTINCT ur.user_id) as users_count
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE r.id = ${roleId}
      GROUP BY r.id, r.name, r.description, r.is_active, r.created_at, r.updated_at, r.created_by
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Convertir bigint a number para JSON
    const role = {
      ...result[0],
      permissions_count: Number(result[0].permissions_count),
      users_count: Number(result[0].users_count),
    };

    return NextResponse.json({ data: role });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar rol
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Verificación temporal mientras migra a RBAC dinámico
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado - sesión requerida' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json({ error: 'ID de rol inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const existingRole = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        created_by: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Si se está cambiando el nombre, verificar que no exista otro rol con ese nombre
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.rbac_roles.findFirst({
        where: {
          name: validatedData.name,
          id: { not: roleId },
        },
        select: { id: true },
      });

      if (nameExists) {
        return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 });
      }
    }

    // Construir datos de actualización solo con campos definidos
    const updateData: {
      name?: string;
      description?: string;
      is_active?: boolean;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.is_active !== undefined) {
      updateData.is_active = validatedData.is_active;
    }

    if (Object.keys(updateData).length === 1) {
      // Solo tiene updated_at
      return NextResponse.json({ error: 'No hay cambios para aplicar' }, { status: 400 });
    }

    // Actualizar usando Prisma ORM (previene SQL injection)
    const updatedRole = await prisma.rbac_roles.update({
      where: { id: roleId },
      data: updateData,
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: randomUUID(),
        table_name: 'rbac_roles',
        operation: 'UPDATE',
        record_id: roleId,
        old_values: existingRole,
        new_values: updatedRole,
        user_id: session.user.email,
      },
    });

    return NextResponse.json({
      message: 'Rol actualizado exitosamente',
      data: updatedRole,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }
    if (process.env.NODE_ENV !== 'production') {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      return NextResponse.json(
        { error: message || 'Error interno del servidor', details: stack },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar rol
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verificación temporal mientras migra a RBAC dinámico
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado - sesión requerida' }, { status: 403 });
    }

    // Por ahora permitir acceso a usuarios autenticados mientras completamos la migración RBAC
    // TODO: Implementar verificación RBAC dinámica
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No autorizado - email requerido' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json({ error: 'ID de rol inválido' }, { status: 400 });
    }

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const existingRole = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Verificar que no hay usuarios asignados a este rol usando Prisma ORM (previene SQL injection)
    const usersWithRole = await prisma.rbac_user_roles.count({
      where: { role_id: roleId },
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el rol porque tiene usuarios asignados' },
        { status: 400 }
      );
    }

    // Iniciar transacción para eliminar rol y sus relaciones
    console.debug('Usuarios con este rol (antes de eliminar):', usersWithRole);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Eliminar permisos asignados al rol
        await tx.rbac_role_permissions.deleteMany({
          where: { role_id: roleId },
        });

        // 2. Eliminar asignaciones de usuarios (rbac_user_roles)
        await tx.rbac_user_roles.deleteMany({
          where: { role_id: roleId },
        });

        // 3. Eliminar el rol (esto activará CASCADE para otras relaciones)
        await tx.rbac_roles.delete({
          where: { id: roleId },
        });

        // 4. Registrar en auditoría usando Prisma ORM (previene SQL injection)
        await tx.rbac_audit_log.create({
          data: {
            id: randomUUID(),
            table_name: 'rbac_roles',
            operation: 'DELETE',
            record_id: roleId,
            old_values: existingRole,
            new_values: undefined,
            user_id: session.user.email,
          },
        });
      });
    } catch (txError) {
      // Re-throw para que el catch externo lo capture y devuelva detalles en dev
      throw txError;
    }

    return NextResponse.json({
      message: 'Rol eliminado exitosamente',
    });
  } catch (error) {
    // En entorno de desarrollo devolver detalles para depuración
    if (process.env.NODE_ENV !== 'production') {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      return NextResponse.json(
        { error: message || 'Error interno del servidor', details: stack },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

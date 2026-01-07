import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission, hasSystemRole } from '@/lib/rbac-dynamic';
import { asignarTodosLosPermisosARol } from '@/lib/rbac/role-permissions-utils';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema de validación para roles
const roleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

// GET - Obtener todos los roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ RBAC DINÁMICO: Verificar permiso
    const hasPermission = await checkUserPermission(session.user.id, 'AJUSTES_RBAC', 'LEER');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sin permisos para gestionar roles' }, { status: 403 });
    }

    // ✅ SISTEMA: Verificar si tiene roles de sistema
    const userHasSystemRole = await hasSystemRole(session.user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const offset = (page - 1) * limit;

    // Usar Prisma ORM en lugar de raw queries para evitar problemas de tipos
    const whereCondition: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      is_active?: boolean;
      is_system_role?: boolean;
    } = {
      // ✅ Usuarios con rol de sistema pueden ver roles de sistema
      // ❌ Usuarios normales NO ven roles de sistema
      ...(userHasSystemRole ? {} : { is_system_role: false }),
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== null) {
      whereCondition.is_active = active === 'true';
    }

    const [roles, total] = await Promise.all([
      prisma.rbac_roles.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: {
              rbac_role_permissions: true,
              rbac_user_roles: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.rbac_roles.count({
        where: whereCondition,
      }),
    ]);

    // Mapear los resultados al formato esperado
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      created_at: role.created_at,
      updated_at: role.updated_at,
      _count: {
        role_permissions: role._count.rbac_role_permissions,
        user_roles: role._count.rbac_user_roles,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedRoles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ RBAC DINÁMICO: Verificar permiso
    const hasPermission = await checkUserPermission(session.user.id, 'AJUSTES_RBAC', 'CREAR');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sin permisos para crear roles' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = roleSchema.parse(body);

    // Verificar que el nombre no exista (usando Prisma ORM - previene SQL injection)
    const existingRole = await prisma.rbac_roles.findFirst({
      where: { name: validatedData.name },
      select: { id: true },
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 });
    }

    // Crear el rol usando Prisma ORM (previene SQL injection)
    const newRole = await prisma.rbac_roles.create({
      data: {
        id: randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
        is_active: validatedData.is_active,
        created_by: session.user.email,
      },
    });

    // **NUEVO: Asignar TODOS los permisos automáticamente al rol recién creado**
    const permisosResult = await asignarTodosLosPermisosARol(
      prisma,
      newRole.id,
      session.user.email || 'sistema'
    );

    if (!permisosResult.success) {
    } else {
    }

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: randomUUID(),
        table_name: 'rbac_roles',
        operation: 'INSERT',
        record_id: newRole.id.toString(),
        old_values: undefined,
        new_values: {
          ...newRole,
          permisos_asignados: permisosResult.permisosAsignados,
          permisos_asignacion_exitosa: permisosResult.success,
        },
        user_id: session.user.email,
      },
    });

    return NextResponse.json(
      {
        message: `Rol creado exitosamente con ${permisosResult.permisosAsignados} permisos`,
        data: {
          ...newRole,
          permisos_asignados: permisosResult.permisosAsignados,
          permisos_mensaje: permisosResult.message,
        },
      },
      { status: 201 }
    );
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

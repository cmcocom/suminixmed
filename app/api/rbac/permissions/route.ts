import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema de validación para permisos
const permissionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().optional(),
  module: z.string().min(1, 'El módulo es requerido').max(50, 'El módulo es muy largo'),
  action: z.string().min(1, 'La acción es requerida').max(50, 'La acción es muy larga'),
  is_active: z.boolean().default(true),
});

// GET - Obtener todos los permisos
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 para prevenir OOM
    const search = searchParams.get('search') || '';
    const moduleFilter = searchParams.get('module');
    const active = searchParams.get('active');

    const offset = (page - 1) * limit;

    // Construir whereClause usando Prisma (previene SQL injection)
    const whereConditions: Prisma.rbac_permissionsWhereInput = {};

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (moduleFilter) {
      whereConditions.module = moduleFilter;
    }

    if (active !== null) {
      whereConditions.is_active = active === 'true';
    }

    // Query paralela usando Prisma ORM (previene SQL injection)
    const [permissions, total, modules] = await Promise.all([
      // Obtener permisos con conteo de roles
      prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          description: string | null;
          module: string;
          action: string;
          is_active: boolean;
          created_at: Date;
          updated_at: Date;
          roles_count: bigint;
        }>
      >`
        SELECT 
          p.id,
          p.name,
          p.description,
          p.module,
          p.action,
          p.is_active,
          p.created_at,
          p.updated_at,
          COUNT(rp.role_id)::int as roles_count
        FROM rbac_permissions p
        LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id
        ${search ? Prisma.sql`WHERE (p.name ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})` : Prisma.empty}
        ${moduleFilter && search ? Prisma.sql`AND p.module = ${moduleFilter}` : moduleFilter ? Prisma.sql`WHERE p.module = ${moduleFilter}` : Prisma.empty}
        ${active !== null && (search || moduleFilter) ? Prisma.sql`AND p.is_active = ${active === 'true'}` : active !== null ? Prisma.sql`WHERE p.is_active = ${active === 'true'}` : Prisma.empty}
        GROUP BY p.id, p.name, p.description, p.module, p.action, p.is_active, p.created_at, p.updated_at
        ORDER BY p.module, p.action, p.name
        LIMIT ${limit} OFFSET ${offset}
      `,
      // Conteo total usando Prisma ORM
      prisma.rbac_permissions.count({ where: whereConditions }),
      // Módulos únicos usando Prisma ORM
      prisma.rbac_permissions.findMany({
        where: { is_active: true },
        select: { module: true },
        distinct: ['module'],
        orderBy: { module: 'asc' },
      }),
    ]);

    // Formatear roles_count de bigint a number
    const formattedPermissions = permissions.map((p) => ({
      ...p,
      roles_count: Number(p.roles_count),
    }));

    return NextResponse.json({
      data: formattedPermissions,
      modules,
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

// POST - Crear nuevo permiso
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
    const validatedData = permissionSchema.parse(body);

    // Verificar que no exista la combinación módulo + acción usando Prisma ORM (previene SQL injection)
    const existingPermission = await prisma.rbac_permissions.findFirst({
      where: {
        module: validatedData.module,
        action: validatedData.action,
      },
      select: { id: true },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Ya existe un permiso para esta combinación de módulo y acción' },
        { status: 400 }
      );
    }

    // Crear el permiso usando Prisma ORM (previene SQL injection)
    const newPermission = await prisma.rbac_permissions.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
        module: validatedData.module,
        action: validatedData.action,
        is_active: validatedData.is_active,
        created_by: session.user.email,
      },
    });

    // Registrar en auditoría usando Prisma ORM (previene SQL injection)
    await prisma.rbac_audit_log.create({
      data: {
        id: crypto.randomUUID(),
        table_name: 'rbac_permissions',
        operation: 'INSERT',
        record_id: newPermission.id,
        old_values: undefined,
        new_values: newPermission,
        user_id: session.user.email,
      },
    });

    return NextResponse.json(
      {
        message: 'Permiso creado exitosamente',
        data: newPermission,
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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

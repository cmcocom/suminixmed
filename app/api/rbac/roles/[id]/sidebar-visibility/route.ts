import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

function normalizeModuleKey(k: string | undefined | null) {
  if (!k) return k;
  return String(k)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo autenticación requerida para gestionar visibilidad de roles

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    const body = await request.json();
    const { visibility } = body;

    if (!visibility || typeof visibility !== 'object') {
      return NextResponse.json(
        { error: 'El campo visibility es requerido y debe ser un objeto' },
        { status: 400 }
      );
    }

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    const sessionUser = session.user as { id?: string; email?: string } | undefined;
    const actorId = sessionUser?.id || sessionUser?.email || 'SYSTEM';

    try {
      // Usar transacción para garantizar consistencia
      const result = await prisma.$transaction(async (tx) => {
        const updatedModules: Array<{ moduleKey: string; visible: boolean; status: string }> = [];
        const errors: string[] = [];

        for (const [moduleKeyRaw, visible] of Object.entries(visibility)) {
          const moduleKey = normalizeModuleKey(moduleKeyRaw);
          if (!moduleKey) {
            errors.push(`${moduleKeyRaw}: moduleKey inválido`);
            continue;
          }
          if (typeof visible !== 'boolean') {
            errors.push(`${moduleKey}: valor debe ser booleano`);
            continue;
          }

          try {
            if (!ALL_MODULES.includes(moduleKey)) {
              errors.push(`${moduleKey}: módulo no válido`);
              continue;
            }

            const permission = await tx.rbac_permissions.findFirst({
              where: {
                module: moduleKey,
                action: 'LEER',
                is_active: true,
              },
              select: { id: true },
            });

            if (!permission) {
              errors.push(`${moduleKey}: permiso LEER no encontrado`);
              continue;
            }

            await tx.rbac_role_permissions.upsert({
              where: {
                role_id_permission_id: {
                  role_id: roleId,
                  permission_id: permission.id,
                },
              },
              update: {
                granted: visible,
                granted_by: actorId,
                granted_at: new Date(),
              },
              create: {
                id: randomUUID(),
                role_id: roleId,
                permission_id: permission.id,
                granted: visible,
                granted_by: actorId,
                granted_at: new Date(),
              },
            });

            updatedModules.push({
              moduleKey,
              visible,
              status: 'updated',
            });
          } catch (moduleError) {
            errors.push(`${moduleKey}: error al actualizar`);
          }
        }

        return { updatedModules, errors };
      });

      return NextResponse.json({
        success: result.errors.length === 0,
        message: `Configuración de visibilidad actualizada para rol "${role.name}"`,
        roleId,
        roleName: role.name,
        updatedModules: result.updatedModules,
        errors: result.errors,
        totalUpdated: result.updatedModules.length,
      });
    } catch (dbError) {
      return NextResponse.json(
        {
          error: 'Error al guardar configuración en base de datos',
          details: dbError instanceof Error ? dbError.message : 'Error desconocido',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo autenticación requerida para consultar visibilidad de roles

    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    try {
      const rolePermissions = await prisma.rbac_role_permissions.findMany({
        where: {
          role_id: roleId,
          rbac_permissions: {
            action: 'LEER',
            is_active: true,
          },
        },
        include: {
          rbac_permissions: {
            select: {
              module: true,
            },
          },
        },
      });

      const visibility: Record<string, boolean> = {};
      rolePermissions.forEach((config) => {
        const moduleKey = config.rbac_permissions?.module;
        if (moduleKey) {
          visibility[moduleKey] = config.granted;
        }
      });

      const timestamps = rolePermissions
        .map((config) => config.granted_at?.getTime())
        .filter((value): value is number => typeof value === 'number');

      return NextResponse.json({
        success: true,
        roleId,
        roleName: role.name,
        visibility,
        totalConfigs: rolePermissions.length,
        lastUpdated: timestamps.length > 0 ? Math.max(...timestamps) : null,
      });
    } catch (dbError) {
      return NextResponse.json(
        {
          error: 'Error al consultar configuración de visibilidad',
          details: dbError instanceof Error ? dbError.message : 'Error desconocido',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

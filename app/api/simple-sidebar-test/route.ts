import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';
import { randomUUID } from 'crypto';

function normalizeModuleKey(k: string | undefined | null) {
  if (!k) return k;
  return String(k)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'roleId es requerido' }, { status: 400 });
    }
    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    const configs = await prisma.rbac_role_permissions.findMany({
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
    configs.forEach((config) => {
      const moduleKey = config.rbac_permissions?.module;
      if (moduleKey) {
        visibility[moduleKey] = config.granted;
      }
    });

    return NextResponse.json({
      success: true,
      roleId,
      roleName: role.name,
      visibility,
      totalConfigs: configs.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en GET API simple',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { roleId, visibility } = await request.json();
    if (!roleId || !visibility) {
      return NextResponse.json({ error: 'roleId y visibility son requeridos' }, { status: 400 });
    }

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Procesar cada módulo
    const results: Array<{ moduleKey: string; visible: boolean; status: string }> = [];
    for (const [moduleKeyRaw, visible] of Object.entries(visibility)) {
      if (typeof visible !== 'boolean') continue;

      const moduleKey = normalizeModuleKey(moduleKeyRaw);
      if (!moduleKey || !ALL_MODULES.includes(moduleKey)) {
        results.push({ moduleKey: moduleKeyRaw, visible, status: 'invalid-module' });
        continue;
      }

      try {
        const permission = await prisma.rbac_permissions.findFirst({
          where: {
            module: moduleKey,
            action: 'LEER',
            is_active: true,
          },
          select: { id: true },
        });

        if (!permission) {
          results.push({ moduleKey, visible, status: 'missing-permission' });
          continue;
        }

        await prisma.rbac_role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleId,
              permission_id: permission.id,
            },
          },
          update: {
            granted: visible,
            granted_by: 'SYSTEM',
            granted_at: new Date(),
          },
          create: {
            id: randomUUID(),
            role_id: roleId,
            permission_id: permission.id,
            granted: visible,
            granted_by: 'SYSTEM',
            granted_at: new Date(),
          },
        });

        results.push({ moduleKey, visible, status: 'updated' });
      } catch (error) {
        results.push({ moduleKey, visible, status: 'error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Configuración actualizada para rol "${role.name}"`,
      roleId,
      roleName: role.name,
      results,
      totalUpdated: results.filter((r) => r.status === 'updated').length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en API simple',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

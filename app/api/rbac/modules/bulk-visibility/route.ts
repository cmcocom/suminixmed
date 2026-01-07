import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';
import { randomUUID } from 'crypto';

const VALID_MODULES = new Set(ALL_MODULES);

function normalizeModuleKey(k: string | undefined | null) {
  if (!k) return k;
  return String(k)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string } | undefined)?.id || null;

    const body = await request.json();
    const { updates, scope, roleId } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Campo updates debe ser un array' }, { status: 400 });
    }

    if (scope !== 'role') {
      return NextResponse.json(
        { error: 'Solo se soporta scope="role" en el sistema actual' },
        { status: 400 }
      );
    }

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json({ error: 'roleId es requerido para scope="role"' }, { status: 400 });
    }

    // Validar cada update
    for (const update of updates) {
      if (!update.moduleKey || typeof update.visible !== 'boolean') {
        return NextResponse.json(
          { error: 'Cada update debe tener moduleKey y visible (boolean)' },
          { status: 400 }
        );
      }
      const normalizedKey = normalizeModuleKey(update.moduleKey);
      if (!normalizedKey || !VALID_MODULES.has(normalizedKey)) {
        return NextResponse.json(
          { error: `Módulo no válido: ${update.moduleKey}` },
          { status: 400 }
        );
      }
    }

    // Usar transacción para bulk update
    const results = await prisma.$transaction(async (tx) => {
      const updateResults: Array<{
        moduleKey: string;
        visible: boolean;
        success: boolean;
        error?: string;
      }> = [];

      for (const update of updates) {
        const { moduleKey, visible } = update;
        const normalizedKey = normalizeModuleKey(moduleKey)!; // Ya validado arriba

        const permission = await tx.rbac_permissions.findFirst({
          where: {
            module: normalizedKey,
            action: 'LEER',
            is_active: true,
          },
          select: { id: true },
        });

        if (!permission) {
          updateResults.push({
            moduleKey: normalizedKey,
            visible,
            success: false,
            error: `Permiso LEER no encontrado para módulo ${normalizedKey}`,
          });
          continue;
        }

        const rolePermission = await tx.rbac_role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleId,
              permission_id: permission.id,
            },
          },
          update: {
            granted: visible,
            granted_by: userId || 'SYSTEM',
            granted_at: new Date(),
          },
          create: {
            id: randomUUID(),
            role_id: roleId,
            permission_id: permission.id,
            granted: visible,
            granted_by: userId || 'SYSTEM',
            granted_at: new Date(),
          },
        });

        updateResults.push({
          moduleKey: normalizedKey,
          visible: rolePermission.granted,
          success: true,
        });
      }

      return updateResults;
    });

    return NextResponse.json({
      success: true,
      results,
      totalUpdated: results.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🆕 NUEVA ARQUITECTURA RBAC
 *
 * PUT /api/rbac/roles/[id]/modules/toggle-all-visibility
 *
 * ✅ Cambio masivo de VISIBILIDAD (mostrar/ocultar todos)
 * ✅ NUNCA toca PERMISOS (rbac_role_permissions intacto)
 * ✅ Operación atómica en nueva tabla rbac_module_visibility
 *
 * Body: { visible: boolean }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: roleId } = resolvedParams;
    const body = await request.json();
    const { visible } = body;

    if (typeof visible !== 'boolean') {
      return NextResponse.json({ error: 'El campo "visible" debe ser booleano' }, { status: 400 });
    }

    // Validar rol
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, is_system_role: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    if (role.is_system_role) {
      return NextResponse.json(
        { error: 'No se pueden modificar roles de sistema' },
        { status: 403 }
      );
    }

    // 🆕 OPERACIÓN MASIVA: Actualizar visibilidad de TODOS los módulos
    let updatedCount = 0;
    const results: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const moduleKey of ALL_MODULES) {
        const visibilityRecord = await tx.rbac_module_visibility.upsert({
          where: {
            role_id_module_key: {
              role_id: roleId,
              module_key: moduleKey,
            },
          },
          create: {
            id: randomUUID(),
            role_id: roleId,
            module_key: moduleKey,
            is_visible: visible,
            created_by: session.user.id,
          },
          update: {
            is_visible: visible,
            updated_at: new Date(),
          },
        });

        results.push({
          moduleKey,
          visible,
          recordId: visibilityRecord.id,
        });

        updatedCount++;
      }
    });

    console.log(
      `[RBAC-NEW] Toggle masivo: ${updatedCount} módulos → ${visible ? 'VISIBLES' : 'OCULTOS'} para rol ${role.name}`
    );

    // ✅ LOS PERMISOS NUNCA CAMBIAN (siguen granted=true)

    return NextResponse.json({
      success: true,
      message: `${visible ? 'Mostrados' : 'Ocultados'} todos los módulos en sidebar`,
      visible,
      roleId,
      roleName: role.name,
      modulesAffected: updatedCount,
      totalModules: ALL_MODULES.length,
      results,
      // ✅ Confirmaciones importantes
      permissionsUnchanged: true,
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error en toggle masivo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno en operación masiva',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * 🆕 GET /api/rbac/roles/[id]/modules/toggle-all-visibility
 *
 * Obtiene estado de visibilidad de TODOS los módulos para un rol
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: roleId } = resolvedParams;

    // Obtener todas las configuraciones de visibilidad
    const visibilityRecords = await prisma.rbac_module_visibility.findMany({
      where: { role_id: roleId },
      select: {
        module_key: true,
        is_visible: true,
      },
    });

    // Crear mapa de visibilidad
    const visibilityMap: Record<string, boolean> = {};
    const recordsMap = visibilityRecords.reduce(
      (acc, record) => {
        acc[record.module_key] = record.is_visible;
        return acc;
      },
      {} as Record<string, boolean>
    );

    // Incluir TODOS los módulos (con default visible)
    for (const moduleKey of ALL_MODULES) {
      visibilityMap[moduleKey] = recordsMap[moduleKey] ?? true;
    }

    // Estadísticas
    const visibleCount = Object.values(visibilityMap).filter(Boolean).length;
    const hiddenCount = ALL_MODULES.length - visibleCount;

    return NextResponse.json({
      roleId,
      totalModules: ALL_MODULES.length,
      visibleCount,
      hiddenCount,
      allVisible: visibleCount === ALL_MODULES.length,
      allHidden: visibleCount === 0,
      moduleVisibility: visibilityMap,
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error obteniendo visibilidad masiva:', error);
    return NextResponse.json(
      {
        error: 'Error interno al obtener visibilidad',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

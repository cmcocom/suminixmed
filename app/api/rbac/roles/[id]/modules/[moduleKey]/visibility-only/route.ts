import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_MODULES } from '@/lib/rbac-modules';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🆕 NUEVA ARQUITECTURA RBAC
 *
 * PUT /api/rbac/roles/[id]/modules/[moduleKey]/visibility-only
 *
 * ✅ SOLO cambia VISIBILIDAD (nueva tabla rbac_module_visibility)
 * ✅ NUNCA toca PERMISOS (rbac_role_permissions queda intacto)
 * ✅ Elimina dependencias rotas entre módulos
 *
 * Body: { visible: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: roleId, moduleKey } = resolvedParams;
    const body = await request.json();
    const { visible } = body;

    if (typeof visible !== 'boolean') {
      return NextResponse.json({ error: 'El campo "visible" debe ser booleano' }, { status: 400 });
    }

    // Validar módulo
    const normalizedModule = moduleKey.toUpperCase();
    if (!ALL_MODULES.includes(normalizedModule)) {
      return NextResponse.json({ error: `Módulo "${moduleKey}" no válido` }, { status: 400 });
    }

    // Validar rol
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, is_system_role: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Prevenir modificación de roles de sistema
    if (role.is_system_role) {
      return NextResponse.json(
        { error: 'No se pueden modificar roles de sistema' },
        { status: 403 }
      );
    }

    // 🆕 NUEVA LÓGICA: Solo actualizar VISIBILIDAD
    const visibilityRecord = await prisma.rbac_module_visibility.upsert({
      where: {
        role_id_module_key: {
          role_id: roleId,
          module_key: normalizedModule,
        },
      },
      create: {
        id: randomUUID(),
        role_id: roleId,
        module_key: normalizedModule,
        is_visible: visible,
        created_by: session.user.id,
      },
      update: {
        is_visible: visible,
        updated_at: new Date(),
      },
    });

    console.log(
      `[RBAC-NEW] Visibilidad módulo ${normalizedModule} → ${visible ? 'VISIBLE' : 'OCULTO'} para rol ${role.name}`
    );

    // ✅ LOS PERMISOS NUNCA CAMBIAN (quedan siempre granted=true)

    return NextResponse.json({
      success: true,
      message: `Módulo ${normalizedModule} ${visible ? 'visible' : 'oculto'} en sidebar`,
      moduleKey: normalizedModule,
      visible,
      roleId,
      roleName: role.name,
      visibilityRecordId: visibilityRecord.id,
      // ✅ Confirmación importante
      permissionsUnchanged: true,
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error cambiando visibilidad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al cambiar visibilidad',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * 🆕 GET /api/rbac/roles/[id]/modules/[moduleKey]/visibility-only
 *
 * Obtiene estado de visibilidad de un módulo específico para un rol
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: roleId, moduleKey } = resolvedParams;

    const normalizedModule = moduleKey.toUpperCase();

    // Buscar en nueva tabla
    const visibilityRecord = await prisma.rbac_module_visibility.findUnique({
      where: {
        role_id_module_key: {
          role_id: roleId,
          module_key: normalizedModule,
        },
      },
    });

    const isVisible = visibilityRecord?.is_visible ?? true; // Default visible

    return NextResponse.json({
      roleId,
      moduleKey: normalizedModule,
      isVisible,
      source: visibilityRecord ? 'rbac_module_visibility' : 'default',
      architectureVersion: 'v2-separated',
    });
  } catch (error) {
    console.error('[RBAC-NEW] Error obteniendo visibilidad:', error);
    return NextResponse.json(
      {
        error: 'Error interno al obtener visibilidad',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

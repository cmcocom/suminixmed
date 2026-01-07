import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/rbac/roles/[id]/modules/[moduleKey]/toggle
 *
 * SISTEMA SIMPLE: Cambia visibilidad de un módulo completo
 * - visible=true → Activa TODAS las acciones del módulo (granted=true)
 * - visible=false → Oculta TODAS las acciones del módulo (granted=false)
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
      return NextResponse.json({ error: 'El campo visible debe ser booleano' }, { status: 400 });
    }

    // Normalizar módulo key
    const normalizedModule = moduleKey.toUpperCase();

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener TODOS los permisos de este módulo (las 5 acciones)
    const modulePermissions = await prisma.rbac_permissions.findMany({
      where: {
        module: normalizedModule,
      },
      select: {
        id: true,
        module: true,
        action: true,
      },
    });

    if (modulePermissions.length === 0) {
      return NextResponse.json(
        { error: `Módulo ${normalizedModule} no encontrado` },
        { status: 404 }
      );
    }

    // Actualizar TODAS las asignaciones de este módulo para este rol
    const updatedCount = await prisma.rbac_role_permissions.updateMany({
      where: {
        role_id: roleId,
        permission_id: {
          in: modulePermissions.map((p) => p.id),
        },
      },
      data: {
        granted: visible,
        granted_at: new Date(),
        granted_by: session.user.id,
      },
    });

    console.log(
      `[RBAC] Módulo ${normalizedModule} ${visible ? 'activado' : 'desactivado'} para rol ${role.name}`
    );
    console.log(`[RBAC] Permisos actualizados: ${updatedCount.count}`);

    return NextResponse.json({
      success: true,
      module: normalizedModule,
      role: role.name,
      visible,
      permissionsUpdated: updatedCount.count,
      message: `Módulo ${visible ? 'activado' : 'desactivado'} correctamente`,
    });
  } catch (error) {
    console.error('[RBAC] Error al cambiar visibilidad de módulo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar visibilidad del módulo' },
      { status: 500 }
    );
  }
}

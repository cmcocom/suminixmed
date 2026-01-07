import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/rbac/roles/[id]/modules/toggle-all
 *
 * SISTEMA SIMPLE: Activa o desactiva TODOS los módulos del rol
 * - visible=true → Muestra todos los módulos (granted=true)
 * - visible=false → Oculta todos los módulos (granted=false)
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
      return NextResponse.json({ error: 'El campo visible debe ser booleano' }, { status: 400 });
    }

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Actualizar TODOS los permisos del rol
    const result = await prisma.rbac_role_permissions.updateMany({
      where: {
        role_id: roleId,
      },
      data: {
        granted: visible,
        granted_at: new Date(),
        granted_by: session.user.id,
      },
    });

    console.log(
      `[RBAC] ${visible ? 'Activados' : 'Desactivados'} TODOS los módulos para rol ${role.name}`
    );
    console.log(`[RBAC] Permisos actualizados: ${result.count}`);

    return NextResponse.json({
      success: true,
      role: role.name,
      visible,
      permissionsUpdated: result.count,
      message: `Todos los módulos ${visible ? 'activados' : 'desactivados'} correctamente`,
    });
  } catch (error) {
    console.error('[RBAC] Error al cambiar visibilidad masiva:', error);
    return NextResponse.json(
      { error: 'Error al actualizar visibilidad de módulos' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/rbac/modules/[moduleKey]/visibility
 *
 * Actualiza la visibilidad de un módulo para un rol mediante rbac_role_permissions.
 * Sistema unificado: visible=true → granted=true, visible=false → granted=false
 *
 * @param moduleKey - Código del módulo (ej: SALIDAS, CLIENTES, etc.)
 * @param body.visible - true para mostrar, false para ocultar
 * @param body.roleId - ID del rol a configurar
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const moduleKey = resolvedParams.moduleKey.toUpperCase();
    const body = await request.json();
    const { visible, roleId } = body;

    if (typeof visible !== 'boolean') {
      return NextResponse.json({ error: 'El campo visible debe ser un booleano' }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ error: 'roleId es requerido' }, { status: 400 });
    }

    const userId = (session.user as { id?: string })?.id || null;

    try {
      // Buscar permiso LEER del módulo
      const permission = await prisma.rbac_permissions.findFirst({
        where: {
          module: moduleKey,
          action: 'LEER',
          is_active: true,
        },
      });

      if (!permission) {
        return NextResponse.json(
          {
            error: `Permiso LEER no encontrado para módulo ${moduleKey}`,
            suggestion: 'El módulo puede no existir o no tener permiso LEER definido',
          },
          { status: 404 }
        );
      }

      // Actualizar o crear relación role-permission
      const rolePermission = await prisma.rbac_role_permissions.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permission.id,
          },
        },
        create: {
          id: `rp_${roleId}_${permission.id}_${Date.now()}`,
          role_id: roleId,
          permission_id: permission.id,
          granted: visible, // visible=true → granted=true (puede ver)
          granted_by: userId || 'SYSTEM',
          granted_at: new Date(),
        },
        update: {
          granted: visible,
          granted_by: userId || 'SYSTEM',
          granted_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Módulo ${moduleKey} ${visible ? 'visible' : 'oculto'} para el rol`,
        moduleKey,
        visible,
        roleId,
        permissionId: permission.id,
        rolePermissionId: rolePermission.id,
      });
    } catch (e) {
      console.error('[RBAC] Error actualizando visibilidad:', e);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar visibilidad',
          details: e instanceof Error ? e.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[RBAC] Error en PUT visibility:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rbac/modules/[moduleKey]/visibility
 *
 * Obtiene el estado de visibilidad de un módulo específico para un rol.
 *
 * @param moduleKey - Código del módulo
 * @param roleId - (Query param) ID del rol
 * @returns Estado de visibilidad basado en rbac_role_permissions.granted
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const moduleKey = resolvedParams.moduleKey.toUpperCase();
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json(
        {
          error: 'roleId es requerido',
        },
        { status: 400 }
      );
    }

    try {
      // Buscar permiso LEER del módulo
      const permission = await prisma.rbac_permissions.findFirst({
        where: {
          module: moduleKey,
          action: 'LEER',
          is_active: true,
        },
      });

      if (!permission) {
        return NextResponse.json({
          success: true,
          moduleKey,
          visible: true, // Default: visible si no hay permiso definido
          scope: 'no-permission-default',
        });
      }

      // Buscar configuración del rol
      const rolePermission = await prisma.rbac_role_permissions.findFirst({
        where: {
          role_id: roleId,
          permission_id: permission.id,
        },
      });

      if (!rolePermission) {
        return NextResponse.json({
          success: true,
          moduleKey,
          visible: true, // Default: visible si no hay configuración
          scope: 'no-config-default',
          roleId,
        });
      }

      return NextResponse.json({
        success: true,
        moduleKey,
        visible: rolePermission.granted,
        scope: 'role-permission',
        roleId,
        granted_at: rolePermission.granted_at,
      });
    } catch (e) {
      console.error('[RBAC] Error obteniendo visibilidad:', e);
      return NextResponse.json({
        success: true,
        moduleKey,
        visible: true, // Default en caso de error
        scope: 'error-default',
      });
    }
  } catch (error) {
    console.error('[RBAC] Error en GET visibility:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

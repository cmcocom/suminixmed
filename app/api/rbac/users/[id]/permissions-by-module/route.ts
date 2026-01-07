import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener permisos de un usuario agrupados por módulo
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 });
    }

    // ✅ NUEVO: Permitir consultar propios permisos o requerir ADMINISTRAR_PERMISOS
    const isOwnPermissions = session.user.id === userId;
    const hasAdminPermission = await checkSessionPermission(
      session.user,
      'AJUSTES_USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );

    if (!isOwnPermissions && !hasAdminPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        activo: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener roles asignados al usuario
    const userRoles = (await prisma.$queryRaw`
      SELECT 
        r.id,
        r.name,
        r.description,
        ur.assigned_at,
        ur.assigned_by
      FROM rbac_roles r
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}
      ORDER BY r.name
    `) as {
      id: string;
      name: string;
      description: string | null;
      assigned_at: Date;
      assigned_by: string | null;
    }[];

    // Obtener todos los permisos disponibles agrupados por módulo
    const allPermissions = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
      },
      orderBy: [{ module: 'asc' }, { action: 'asc' }, { name: 'asc' }],
    });

    // Obtener permisos activos del usuario (a través de sus roles)
    // ✅ CRÍTICO: Solo permisos con granted=true
    const userPermissions = (await prisma.$queryRaw`
      SELECT DISTINCT p.id
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ${userId} 
        AND p.is_active = true
        AND rp.granted = true
    `) as { id: string }[];

    const activePermissionIds = new Set(userPermissions.map((p) => p.id));

    // Agrupar permisos por módulo
    const modulePermissions = allPermissions.reduce(
      (acc, permission) => {
        const moduleName = permission.module;
        if (!acc[moduleName]) {
          acc[moduleName] = [];
        }

        acc[moduleName].push({
          ...permission,
          assigned: activePermissionIds.has(permission.id),
        });

        return acc;
      },
      {} as Record<
        string,
        Array<{
          id: string;
          name: string;
          description: string | null;
          module: string;
          action: string;
          assigned: boolean;
        }>
      >
    );

    // ✅ CORRECCIÓN: Crear módulos dinámicamente desde TODOS los módulos en BD
    const modules = Object.keys(modulePermissions)
      .sort() // Ordenar alfabéticamente
      .map((moduleKey) => ({
        key: moduleKey,
        name: moduleKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        icon: '�',
        description: `Módulo ${moduleKey}`,
        permissions: modulePermissions[moduleKey] || [],
        permissionCount: (modulePermissions[moduleKey] || []).length,
        assignedCount: (modulePermissions[moduleKey] || []).filter((p) => p.assigned).length,
      }));

    return NextResponse.json({
      data: {
        user: user,
        roles: userRoles,
        modules: modules,
        summary: {
          totalRoles: userRoles.length,
          totalModules: modules.length,
          totalPermissions: allPermissions.length,
          assignedPermissions: userPermissions.length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

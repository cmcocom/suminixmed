import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/rbac/roles/[id]/modules/visibility
 *
 * SISTEMA SIMPLE: Obtiene visibilidad de todos los módulos del rol
 *
 * Retorna: { MODULE_KEY: boolean, ... }
 * - true = módulo visible (al menos 1 permiso con granted=true)
 * - false = módulo oculto (todos los permisos con granted=false)
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: roleId } = resolvedParams;

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener TODOS los permisos del rol con sus módulos
    const permissions = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: roleId,
      },
      include: {
        rbac_permissions: {
          select: {
            module: true,
            action: true,
          },
        },
      },
    });

    // Agrupar por módulo
    const moduleVisibility: Record<string, boolean> = {};

    for (const perm of permissions) {
      const moduleName = perm.rbac_permissions.module;

      // Un módulo está visible si AL MENOS UNO de sus permisos está granted=true
      if (!moduleVisibility[moduleName]) {
        moduleVisibility[moduleName] = false;
      }

      if (perm.granted) {
        moduleVisibility[moduleName] = true;
      }
    }

    // Estadísticas
    const total = Object.keys(moduleVisibility).length;
    const visible = Object.values(moduleVisibility).filter((v) => v).length;
    const hidden = total - visible;

    return NextResponse.json({
      role: role.name,
      modules: moduleVisibility,
      stats: {
        total,
        visible,
        hidden,
      },
    });
  } catch (error) {
    console.error('[RBAC] Error al obtener visibilidad de módulos:', error);
    return NextResponse.json({ error: 'Error al obtener visibilidad' }, { status: 500 });
  }
}

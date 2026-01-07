import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Obtener lista de usuarios para selector dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 para prevenir OOM

    // Query optimizada usando $queryRaw con template tag (previene SQL injection)
    const users = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string | null;
        email: string;
        static_role: string;
        image: string | null;
        activo: boolean;
        created_at: Date;
        total_dynamic_roles: bigint;
        dynamic_roles: Array<{ id: string; name: string }>;
      }>
    >`
      SELECT 
        u.id,
        u.name,
        u.email,
        'OPERADOR' as static_role,
        u.image,
        u.activo,
        u."createdAt" as created_at,
        COALESCE(role_summary.total_roles, 0) as total_dynamic_roles,
        COALESCE(role_summary.role_names, '[]'::jsonb) as dynamic_roles
      FROM "User" u
      LEFT JOIN (
        SELECT 
          ur.user_id,
          COUNT(r.id) as total_roles,
          jsonb_agg(
            jsonb_build_object(
              'id', r.id,
              'name', r.name
            ) ORDER BY r.name
          ) as role_names
        FROM rbac_user_roles ur
        INNER JOIN rbac_roles r ON ur.role_id = r.id
        WHERE r.is_active = true
        GROUP BY ur.user_id
      ) role_summary ON u.id = role_summary.user_id
      WHERE u.activo = true
        ${search.trim() ? Prisma.sql`AND (u.name ILIKE ${`%${search.trim()}%`} OR u.email ILIKE ${`%${search.trim()}%`})` : Prisma.empty}
      ORDER BY 
        u.name ASC NULLS LAST,
        u.email ASC
      LIMIT ${limit}
    `;

    // Formatear respuesta
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || 'Sin nombre',
      email: user.email,
      staticRole: user.static_role,
      image: user.image,
      active: user.activo,
      createdAt: user.created_at,
      summary: {
        totalDynamicRoles: Number(user.total_dynamic_roles), // Convertir BigInt a número
        dynamicRoles: user.dynamic_roles || [],
        displayRole:
          Number(user.total_dynamic_roles) > 0
            ? `${user.static_role} + ${user.total_dynamic_roles} roles dinámicos`
            : user.static_role,
      },
    }));

    return NextResponse.json({
      data: {
        users: formattedUsers,
        total: formattedUsers.length,
        hasMore: formattedUsers.length === limit,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

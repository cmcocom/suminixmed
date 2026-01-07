import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
// Removed unused Prisma import to satisfy linter
// GET - Obtener usuarios asignados a un rol específico
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !(await checkSessionPermission(session.user, 'AJUSTES_USUARIOS', 'ADMINISTRAR_PERMISOS'))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json({ error: 'ID de rol inválido' }, { status: 400 });
    }

    // Verificar que el rol existe usando Prisma ORM (previene SQL injection)
    const roleExists = await prisma.rbac_roles.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, description: true },
    });

    if (!roleExists) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener usuarios asignados al rol usando $queryRaw con template tag (previene SQL injection)
    const users = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string | null;
        email: string;
        static_role: string | null;
        activo: boolean | null;
        created_at: Date;
        assigned_at: Date;
        assigned_by: string | null;
      }>
    >`
      SELECT 
        u.id,
        u.name,
        u.email,
        'OPERADOR' as static_role,
        u.activo,
        u."createdAt" as created_at,
        ur.assigned_at,
        ur.assigned_by
      FROM "User" u
      INNER JOIN rbac_user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ${roleId}
      ORDER BY u.name
    `;

    return NextResponse.json({
      data: {
        role: roleExists,
        users: users,
        total_users: users.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

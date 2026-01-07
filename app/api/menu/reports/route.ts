import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const roles =
      session.user.roles || (session.user.primaryRole ? [session.user.primaryRole] : []);

    // Verificar si la tabla exists y obtener reportes generados
    try {
      const reports = await prisma.generated_reports.findMany({
        where: {
          is_active: true,
          allowed_roles: { hasSome: roles },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          allowed_roles: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json(reports);
    } catch (dbError) {
      // Si hay problemas con la tabla, devolver array vacío en lugar de error
      return NextResponse.json([]);
    }
  } catch (error) {
    // En lugar de 500, devolver array vacío para que el dashboard funcione
    return NextResponse.json([]);
  }
}

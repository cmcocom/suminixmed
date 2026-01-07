import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionModuleAccess } from '@/lib/rbac-simple';

// GET - Obtener historial de respaldos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasAccess = await checkSessionModuleAccess(session.user, 'RESPALDOS');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const backupType = searchParams.get('type'); // 'automatic' | 'manual'

    const where: any = {};
    if (backupType) {
      where.backupType = backupType;
    }

    const history = await prisma.backup_history.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error obteniendo historial de backups:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

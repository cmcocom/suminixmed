import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ hasActiveSession: false });
    }

    // Verificar si tiene sesiones activas (no expiradas)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await prisma.active_sessions.findMany({
      where: {
        userId: user.id,
        lastActivity: {
          gt: fiveMinutesAgo,
        },
      },
    });

    return NextResponse.json({
      hasActiveSession: activeSessions.length > 0,
      sessionCount: activeSessions.length,
      userId: user.id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'UserId es requerido' }, { status: 400 });
    }

    // Verificar si el usuario tiene sesiones activas (no expiradas)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await prisma.active_sessions.findMany({
      where: {
        userId,
        lastActivity: {
          gt: fiveMinutesAgo,
        },
      },
    });

    // La sesión es válida si:
    // 1. Existe al menos una sesión activa para el usuario
    const isValid = activeSessions.length > 0;

    return NextResponse.json({
      isValid,
      sessionCount: activeSessions.length,
      message: isValid ? 'Sesión válida' : 'Sesión invalidada - no se encontraron sesiones activas',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor', isValid: false },
      { status: 500 }
    );
  }
}

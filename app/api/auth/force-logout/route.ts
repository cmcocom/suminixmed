import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { removeAllUserSessions } from '@/lib/sessionTracker';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    // Cerrar todas las sesiones activas del usuario
    const sessionsRemoved = await removeAllUserSessions(user.id);
    return NextResponse.json({
      success: true,
      message: `${sessionsRemoved} sesiones cerradas`,
      userId: user.id,
      userName: user.name,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

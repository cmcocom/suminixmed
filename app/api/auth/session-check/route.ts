import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Timeout de 3 segundos para toda la operación
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session check timeout')), 3000);
    });

    const checkPromise = (async () => {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ isValid: false }, { status: 401 });
      }

      // Leer body de forma defensiva
      let body: any = null;
      try {
        body = await request.json();
      } catch (err) {
        // Ignorar errores de parseo
      }

      const userId = body?.userId ?? null;

      if (!userId) {
        return NextResponse.json({ isValid: false, error: 'Missing userId' }, { status: 400 });
      }

      if (userId !== (session.user as any).id) {
        return NextResponse.json({ isValid: false }, { status: 403 });
      }

      // Verificar sesiones activas con query optimizada
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Solo contar, no cargar todos los datos
      const sessionCount = await prisma.active_sessions.count({
        where: {
          userId,
          lastActivity: {
            gt: fiveMinutesAgo,
          },
        },
      });

      // Si no tiene sesiones activas, la sesión no es válida
      if (sessionCount === 0) {
        return NextResponse.json({
          isValid: false,
          reason: 'No active sessions found',
        });
      }

      // Actualizar actividad de forma asíncrona (fire and forget)
      // No esperamos a que termine para no bloquear la respuesta
      prisma.active_sessions
        .updateMany({
          where: {
            userId,
            lastActivity: {
              gt: fiveMinutesAgo,
            },
          },
          data: {
            lastActivity: new Date(),
          },
        })
        .catch((err) => {
          console.warn('[SESSION-CHECK] Error actualizando actividad:', err.message);
        });

      return NextResponse.json({
        isValid: true,
        sessionCount,
      });
    })();

    // Race entre el check y el timeout
    return (await Promise.race([checkPromise, timeoutPromise])) as NextResponse;
  } catch (error) {
    if (error instanceof Error && error.message === 'Session check timeout') {
      console.warn('[SESSION-CHECK] Timeout - respondiendo válido por defecto');
      // En caso de timeout, asumir que la sesión es válida para no interrumpir al usuario
      return NextResponse.json({ isValid: true, timeout: true });
    }

    console.error('[SESSION-CHECK] Error:', error);
    return NextResponse.json(
      { isValid: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

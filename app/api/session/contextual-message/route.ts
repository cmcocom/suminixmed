/**
 * 🔧 MEJORA: API para obtener mensaje contextual de cierre de sesión
 *
 * Esta API consulta la BD para determinar qué mensaje mostrar
 * al usuario basado en la razón de su último cierre de sesión.
 */

import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getContextualLoginMessage } from '@/lib/session-close-tracking';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Obtener userId del query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: null }, { status: 200 });
    }

    // Obtener mensaje contextual
    const message = await getContextualLoginMessage(userId);

    logger.debug('[CONTEXTUAL-MESSAGE] Mensaje obtenido', {
      userId,
      message: message || 'ninguno',
    });

    return NextResponse.json({
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CONTEXTUAL-MESSAGE] Error obteniendo mensaje contextual', error);

    return NextResponse.json(
      {
        message: null,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Endpoint alternativo con autenticación de sesión
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: null }, { status: 200 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ message: null }, { status: 200 });
    }

    const message = await getContextualLoginMessage(userId);

    return NextResponse.json({
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CONTEXTUAL-MESSAGE] Error en POST', error);

    return NextResponse.json(
      {
        message: null,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

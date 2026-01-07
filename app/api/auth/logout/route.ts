/**
 * API Endpoint para logout optimizado
 * Limpia sesiones del usuario específica o todas
 * OPTIMIZADO: Sin esperar limpieza de sesiones expiradas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { removeActiveSession, removeAllUserSessions } from '@/lib/sessionTracker';

// POST /api/auth/logout - Logout con limpieza de sesiones
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let tabId: string | undefined;
    try {
      const body = await req.json();
      tabId = body?.tabId;
    } catch {
      tabId = undefined;
    }

    // OPTIMIZACIÓN: Eliminar sin esperar limpieza de expiradas
    if (tabId) {
      await removeActiveSession(session.user.id, tabId);
    } else {
      await removeAllUserSessions(session.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

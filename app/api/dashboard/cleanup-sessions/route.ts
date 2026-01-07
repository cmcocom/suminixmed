import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cleanExpiredSessions } from '@/lib/sessionTracker';

// POST /api/dashboard/cleanup-sessions - Forzar limpieza de sesiones expiradas
export async function POST(_request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Forzar limpieza de sesiones expiradas
    const cleaned = await cleanExpiredSessions();

    return NextResponse.json({
      success: true,
      sessionsCleanedUp: cleaned,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

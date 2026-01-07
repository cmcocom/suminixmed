import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateSessionActivity, registerActiveSession } from '@/lib/sessionTracker';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { tabId } = await req.json();
    if (!tabId) {
      return NextResponse.json({ error: 'tabId requerido' }, { status: 400 });
    }

    // Asegurar que la sesión exista y luego actualizar actividad
    const reg = await registerActiveSession(session.user.id, tabId);
    if (reg && typeof reg === 'object' && 'success' in reg && !reg.success) {
      const msg =
        'message' in reg && typeof reg.message === 'string'
          ? reg.message
          : 'No se pudo registrar la sesión';
      const err = 'error' in reg && typeof reg.error === 'string' ? reg.error : 'SESSION_ERROR';
      const status = err === 'CONCURRENT_LIMIT_EXCEEDED' ? 409 : 400;
      return NextResponse.json({ success: false, error: err, message: msg }, { status });
    }
    await updateSessionActivity(session.user.id, tabId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

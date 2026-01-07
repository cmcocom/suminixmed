import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  registerActiveSession,
  updateSessionActivity,
  removeActiveSession,
} from '@/lib/sessionTracker';

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let body;
    try {
      // Intentar obtener el texto completo
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text);
      } else {
        return NextResponse.json({ error: 'Cuerpo de la petición vacío' }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 400 });
    }

    const { userId, tabId, action } = body;

    // Verificar que el usuario coincida con la sesión
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    let result: boolean | undefined = false;
    let error: string | undefined;
    let message: string | undefined;

    switch (action) {
      case 'update': {
        const r = await registerActiveSession(userId, tabId || 'default');
        if (r && typeof r === 'object' && 'success' in r) {
          result = !!r.success;
          if (!r.success) {
            error = 'error' in r && typeof r.error === 'string' ? r.error : 'SESSION_ERROR';
            message =
              'message' in r && typeof r.message === 'string'
                ? r.message
                : 'No se pudo registrar la sesión';
          }
        } else {
          result = !!r;
        }
        break;
      }
      case 'remove':
        result = await removeActiveSession(userId, tabId || 'default');
        break;
      case 'heartbeat':
        result = await updateSessionActivity(userId, tabId || 'default');
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const status = error === 'CONCURRENT_LIMIT_EXCEEDED' ? 409 : 200;
    return NextResponse.json(
      {
        success: result,
        action,
        error,
        message,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

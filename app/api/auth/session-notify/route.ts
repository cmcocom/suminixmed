import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action, userId } = await request.json();

    if (!action || !userId) {
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 });
    }

    if (userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    // Aquí simplemente confirmamos que el servidor recibió la notificación
    // La lógica real de notificación se maneja en el cliente vía localStorage

    return NextResponse.json({
      success: true,
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

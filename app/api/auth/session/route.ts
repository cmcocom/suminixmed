import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener los datos enviados
    const data = await request.json();

    // Actualizar el objeto de sesión con los nuevos datos
    session.user = {
      ...session.user,
      ...data,
    };

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la sesión' }, { status: 500 });
  }
}

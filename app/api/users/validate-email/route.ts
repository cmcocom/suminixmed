import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    // Buscar usuario con el mismo email, excluyendo el usuario actual si se está editando
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: userId ? { id: userId } : undefined,
      },
    });

    return NextResponse.json({
      isUnique: !existingUser,
      isAvailable: !existingUser,
      message: existingUser ? 'Email ya registrado' : 'Email disponible',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al validar email' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del body
    const requestBody = await request.json();
    const { email, userId } = requestBody;

    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    // Buscar usuario con el mismo email, excluyendo el usuario actual si se está editando
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: userId ? { id: userId } : undefined,
      },
    });
    const result = {
      isUnique: !existingUser,
      isAvailable: !existingUser,
      message: existingUser ? 'Email ya registrado' : 'Email disponible',
    };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al validar email' }, { status: 500 });
  }
}

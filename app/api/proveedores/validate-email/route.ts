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
    const proveedorId = searchParams.get('proveedorId');

    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    // Buscar proveedor con el mismo email, excluyendo el proveedor actual si se está editando
    const existingProveedor = await prisma.proveedores.findFirst({
      where: {
        email,
        NOT: proveedorId ? { id: proveedorId } : undefined,
      },
    });

    return NextResponse.json({
      isUnique: !existingProveedor,
      isAvailable: !existingProveedor,
      message: existingProveedor ? 'Email ya registrado' : 'Email disponible',
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
    const { email, proveedorId } = requestBody;

    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    // Buscar proveedor con el mismo email, excluyendo el proveedor actual si se está editando
    const existingProveedor = await prisma.proveedores.findFirst({
      where: {
        email,
        NOT: proveedorId ? { id: proveedorId } : undefined,
      },
    });
    const result = {
      isUnique: !existingProveedor,
      isAvailable: !existingProveedor,
      message: existingProveedor ? 'Email ya registrado' : 'Email disponible',
    };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al validar email' }, { status: 500 });
  }
}

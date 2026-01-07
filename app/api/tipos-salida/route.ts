import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const soloActivos = searchParams.get('activo') === 'true';

    const tipos = await prisma.tipos_salida.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: {
        orden: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    console.error('Error al obtener tipos de salida:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener tipos de salida',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { codigo, nombre, descripcion, activo, orden, requiere_cliente, requiere_referencia } =
      body;

    const tipo = await prisma.tipos_salida.create({
      data: {
        id: crypto.randomUUID(),
        codigo,
        nombre,
        descripcion,
        activo: activo ?? true,
        orden: orden ?? 0,
        requiere_cliente: requiere_cliente ?? false,
        requiere_referencia: requiere_referencia ?? false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tipo,
    });
  } catch (error) {
    console.error('Error al crear tipo de salida:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear tipo de salida',
      },
      { status: 500 }
    );
  }
}

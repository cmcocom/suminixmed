import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tipos = await prisma.tipos_entrada.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    logger.error('Error al obtener tipos de entrada:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener tipos de entrada',
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
    const { codigo, nombre, descripcion, activo, orden } = body;

    const tipo = await prisma.tipos_entrada.create({
      data: {
        id: crypto.randomUUID(),
        codigo,
        nombre,
        descripcion,
        activo: activo ?? true,
        orden: orden ?? 0,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: tipo,
    });
  } catch (error) {
    logger.error('Error al crear tipo de entrada:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear tipo de entrada',
      },
      { status: 500 }
    );
  }
}

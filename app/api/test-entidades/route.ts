import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint sin autenticación
export async function GET() {
  // Protección: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint de testing no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const entidades = await prisma.entidades.findMany({
      select: {
        id_empresa: true,
        nombre: true,
        rfc: true,
        tiempo_sesion_minutos: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: entidades,
      message: 'Test exitoso',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en test',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// Test de actualización sin autenticación
export async function PUT(request: NextRequest) {
  // Protección: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint de testing no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const { id, tiempo_sesion_minutos } = await request.json();
    const resultado = await prisma.entidades.update({
      where: { id_empresa: id },
      data: {
        tiempo_sesion_minutos: tiempo_sesion_minutos || 3,
      },
    });
    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Test actualización exitosa',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en test PUT',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

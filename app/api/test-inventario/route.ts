import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los productos del inventario
export async function GET() {
  // Protección: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint de testing no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const inventarios = await prisma.inventario.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json({ inventarios });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

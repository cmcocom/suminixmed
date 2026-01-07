import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Protección: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint de testing no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const clientes = await prisma.clientes.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con clientes',
      count: clientes.length,
      data: clientes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        activo: c.activo,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

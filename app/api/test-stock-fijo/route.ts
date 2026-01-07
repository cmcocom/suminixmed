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
    const fondosFijos = await prisma.ffijo.findMany({
      take: 5,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Inventario: {
          select: {
            id: true,
            categoria: true,
            precio: true,
            estado: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con fondos fijos',
      count: fondosFijos.length,
      data: fondosFijos.map((f) => ({
        id: f.id_fondo,
        departamento: f.id_departamento,
        producto: f.id_producto,
        cantidadAsignada: f.cantidad_asignada,
        cantidadDisponible: f.cantidad_disponible,
        cantidadMinima: f.cantidad_minima,
        usuario: f.User,
        inventario: f.Inventario,
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

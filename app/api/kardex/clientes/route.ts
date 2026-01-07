import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Obtener todos los clientes activos
export async function GET(_request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener clientes activos ordenados por nombre
    const clientes = await prisma.clientes.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        clave: true,
        rfc: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Transformar al formato requerido
    const resultado = clientes.map((cliente) => ({
      cliente_id: cliente.id, // id ya es string en la DB
      nombre: cliente.nombre,
    }));

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    const { logger } = await import('@/lib/logger');
    logger.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Obtener lista simple de clientes (solo id, nombre, empresa)
 * Útil para selectores y dropdowns
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const clientes = await prisma.clientes.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        empresa: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

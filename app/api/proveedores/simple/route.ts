import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/proveedores/simple - Lista simple de proveedores para selects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const proveedores = await prisma.proveedores.findMany({
      where: {
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        razon_social: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: proveedores,
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

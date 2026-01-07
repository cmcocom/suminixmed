import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const unidades = await prisma.unidades_medida.findMany({
      where: {
        activo: true,
      },
      orderBy: [{ clave: 'asc' }],
      select: {
        id: true,
        clave: true,
        nombre: true,
        descripcion: true,
      },
    });

    return NextResponse.json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades de medida:', error);
    return NextResponse.json({ error: 'Error al obtener unidades de medida' }, { status: 500 });
  }
}

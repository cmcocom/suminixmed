import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DatabaseService } from '@/lib/database.service';
import { prisma } from '@/lib/prisma';

// GET - Obtener la entidad activa
export async function GET() {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener entidad activa usando el servicio centralizado
    const entidadActiva = await DatabaseService.getActiveEntity();

    if (!entidadActiva) {
      return NextResponse.json({ error: 'No hay entidad activa configurada' }, { status: 404 });
    }

    // Obtener datos completos de la entidad
    const entidadCompleta = await prisma.entidades.findUnique({
      where: { id_empresa: entidadActiva.id_empresa },
    });

    return NextResponse.json({
      success: true,
      data: entidadCompleta,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Obtener configuración de folios
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'salida'; // Por defecto: salida

    // Obtener configuración de folios
    const configFolios = await prisma.config_folios.findUnique({
      where: { tipo: tipo },
    });

    if (!configFolios) {
      return NextResponse.json(
        { success: false, error: 'Configuración de folios no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tipo: configFolios.tipo,
      serie_actual: configFolios.serie_actual,
      proximo_folio: configFolios.proximo_folio,
      updated_at: configFolios.updated_at,
    });
  } catch (error) {
    console.error('Error al obtener configuración de folios:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración de folios' },
      { status: 500 }
    );
  }
}

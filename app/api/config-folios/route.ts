import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener configuración de folios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'entrada' o 'salida'

    if (tipo) {
      // Obtener configuración específica
      const config = await prisma.config_folios.findUnique({
        where: { tipo },
      });

      if (!config) {
        return NextResponse.json(
          { error: `Configuración no encontrada para tipo: ${tipo}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: config,
      });
    } else {
      // Obtener todas las configuraciones
      const configs = await prisma.config_folios.findMany({
        orderBy: { tipo: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: configs,
      });
    }
  } catch (error) {
    console.error('Error al obtener configuración de folios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar configuración de folios
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, serie_actual, proximo_folio } = body;

    // Validaciones
    if (!tipo || (tipo !== 'entrada' && tipo !== 'salida')) {
      return NextResponse.json(
        { error: "El campo 'tipo' debe ser 'entrada' o 'salida'" },
        { status: 400 }
      );
    }

    if (proximo_folio !== undefined && (typeof proximo_folio !== 'number' || proximo_folio < 1)) {
      return NextResponse.json(
        { error: "El campo 'proximo_folio' debe ser un número mayor a 0" },
        { status: 400 }
      );
    }

    if (serie_actual !== undefined && typeof serie_actual !== 'string') {
      return NextResponse.json(
        { error: "El campo 'serie_actual' debe ser una cadena de texto" },
        { status: 400 }
      );
    }

    // Validar que la serie no exceda 10 caracteres
    if (serie_actual && serie_actual.length > 10) {
      return NextResponse.json(
        { error: 'La serie no puede exceder 10 caracteres' },
        { status: 400 }
      );
    }

    // Actualizar o crear configuración (upsert)
    const updatedConfig = await prisma.config_folios.upsert({
      where: { tipo },
      update: {
        ...(serie_actual !== undefined && { serie_actual }),
        ...(proximo_folio !== undefined && { proximo_folio }),
        updated_at: new Date(),
      },
      create: {
        tipo,
        serie_actual: serie_actual || '',
        proximo_folio: proximo_folio || 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuración actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar configuración de folios:', error);

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

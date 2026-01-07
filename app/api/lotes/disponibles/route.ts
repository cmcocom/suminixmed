import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lotes/disponibles
 *
 * Consulta los lotes disponibles de un producto específico.
 * Ordena por FEFO (First Expired First Out) - primero los que vencen más pronto.
 *
 * Query params:
 * - producto_id (required): ID del producto del inventario
 *
 * Retorna:
 * - Array de lotes con: id, numero_lote, fecha_vencimiento, cantidad_disponible
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener producto_id de query params
    const searchParams = request.nextUrl.searchParams;
    const productoId = searchParams.get('producto_id');

    if (!productoId) {
      return NextResponse.json({ error: 'El parámetro producto_id es requerido' }, { status: 400 });
    }

    // Consultar lotes disponibles del producto
    // Solo lotes con cantidad_disponible > 0
    // Ordenados por FEFO: fecha_vencimiento ASC NULLS LAST
    const lotes = await prisma.partidas_entrada_inventario.findMany({
      where: {
        inventario_id: productoId,
        cantidad_disponible: {
          gt: 0,
        },
      },
      select: {
        id: true,
        numero_lote: true,
        fecha_vencimiento: true,
        cantidad_disponible: true,
        entrada_id: true,
        entradas_inventario: {
          select: {
            folio: true,
            fecha_entrada: true,
          },
        },
      },
      orderBy: [
        // FEFO: Primero los que vencen más pronto
        // NULLS LAST: Los sin vencimiento van al final
        {
          fecha_vencimiento: {
            sort: 'asc',
            nulls: 'last',
          },
        },
        // Desempate: por fecha de entrada (más antiguos primero)
        {
          createdAt: 'asc',
        },
      ],
    });

    // Formatear respuesta
    const lotesDisponibles = lotes.map((lote) => ({
      id: lote.id,
      numero_lote: lote.numero_lote || 'Sin lote',
      fecha_vencimiento: lote.fecha_vencimiento,
      cantidad_disponible: lote.cantidad_disponible,
      entrada_folio: lote.entradas_inventario.folio,
      entrada_fecha: lote.entradas_inventario.fecha_entrada,
    }));

    return NextResponse.json({
      success: true,
      data: lotesDisponibles,
    });
  } catch (error) {
    console.error('❌ Error en GET /api/lotes/disponibles:', error);
    return NextResponse.json(
      {
        error: 'Error al consultar lotes disponibles',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

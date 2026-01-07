import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener productos por vencimiento (próximos a vencer o vencidos)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 RBAC V2: Los permisos están garantizados, solo se requiere autenticación
    // La visibilidad del módulo se controla en el frontend, no aquí

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') as 'proximos-vencer' | 'vencidos';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const skip = (page - 1) * limit;

    const ahora = new Date();
    const treintaDiasDespues = new Date();
    treintaDiasDespues.setDate(ahora.getDate() + 30);

    const whereCondition: any = {
      fecha_vencimiento: { not: null },
      cantidad_disponible: { gt: 0 },
      // 🔧 Solo productos activos (filtrar por relación con Inventario)
      Inventario: {
        estado: { notIn: ['DESCONTINUADO', 'descontinuado'] },
      },
    };

    if (tipo === 'vencidos') {
      // Productos ya vencidos
      whereCondition.fecha_vencimiento = { lt: ahora };
    } else if (tipo === 'proximos-vencer') {
      // Productos que vencen en los próximos 30 días (pero no vencidos aún)
      whereCondition.fecha_vencimiento = {
        gte: ahora,
        lte: treintaDiasDespues,
      };
    }

    // Obtener partidas con sus productos
    const partidas = await prisma.partidas_entrada_inventario.findMany({
      where: whereCondition,
      include: {
        Inventario: {
          select: {
            id: true,
            clave: true,
            descripcion: true,
            categoria: true,
          },
        },
        entradas_inventario: {
          select: {
            folio: true,
            serie: true,
            fecha_entrada: true,
          },
        },
      },
      orderBy: {
        fecha_vencimiento: 'asc', // Los que vencen primero
      },
      skip,
      take: limit,
    });

    // Contar total
    const total = await prisma.partidas_entrada_inventario.count({
      where: whereCondition,
    });

    // Formatear respuesta
    const productosFormateados = partidas.map((partida) => ({
      id: partida.Inventario.id,
      clave: partida.Inventario.clave,
      descripcion: partida.Inventario.descripcion,
      categoria: partida.Inventario.categoria,
      numero_lote: partida.numero_lote,
      fecha_vencimiento: partida.fecha_vencimiento,
      cantidad_disponible: partida.cantidad_disponible,
      folio_entrada: partida.entradas_inventario.serie
        ? `${partida.entradas_inventario.serie}-${partida.entradas_inventario.folio}`
        : partida.entradas_inventario.folio,
      fecha_entrada: partida.entradas_inventario.fecha_entrada,
      dias_para_vencer: partida.fecha_vencimiento
        ? Math.ceil(
            (new Date(partida.fecha_vencimiento).getTime() - ahora.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: productosFormateados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error al obtener productos por vencimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Obtener contadores de vencimiento
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener configuración de la entidad activa
    const entidad = await prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: { capturar_lotes_entradas: true },
    });

    // Si no hay entidad activa o no está configurada para manejar lotes, retornar ceros
    if (!entidad || !entidad.capturar_lotes_entradas) {
      return NextResponse.json({
        success: true,
        vencidos: 0,
        proximosVencer: 0,
        manejaLotes: false,
      });
    }

    const ahora = new Date();
    const treintaDiasDespues = new Date();
    treintaDiasDespues.setDate(ahora.getDate() + 30);

    // Contar productos vencidos
    // 🔧 Solo productos activos
    const vencidos = await prisma.partidas_entrada_inventario.count({
      where: {
        fecha_vencimiento: {
          not: null,
          lt: ahora,
        },
        cantidad_disponible: { gt: 0 },
        Inventario: {
          estado: { notIn: ['DESCONTINUADO', 'descontinuado'] },
        },
      },
    });

    // Contar productos próximos a vencer (30 días)
    // 🔧 Solo productos activos
    const proximosVencer = await prisma.partidas_entrada_inventario.count({
      where: {
        fecha_vencimiento: {
          gte: ahora,
          lte: treintaDiasDespues,
        },
        cantidad_disponible: { gt: 0 },
        Inventario: {
          estado: { notIn: ['DESCONTINUADO', 'descontinuado'] },
        },
      },
    });

    return NextResponse.json({
      success: true,
      vencidos,
      proximosVencer,
      manejaLotes: true,
    });
  } catch (error) {
    logger.error('Error al contar productos por vencimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para obtener productos agotados y por agotarse
 * Soporta paginación y filtrado por tipo (agotados/por-agotarse)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 RBAC V2: Los permisos están garantizados, solo se requiere autenticación
    // La visibilidad del módulo se controla en el frontend, no aquí

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'agotados', 'por-agotarse' o 'sobre-stock'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const skip = (page - 1) * limit;

    if (tipo === 'agotados') {
      // Agotados: cantidad <= 0 (igual que el reporte)
      const whereCondition = {
        cantidad: { lte: 0 },
      };

      const [productos, total] = await Promise.all([
        prisma.inventario.findMany({
          where: whereCondition,
          select: {
            id: true,
            clave: true,
            descripcion: true,
            cantidad: true,
            precio: true,
            updatedAt: true,
            punto_reorden: true,
            cantidad_minima: true,
          },
          orderBy: [{ cantidad: 'asc' }, { descripcion: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.inventario.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: productos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } else if (tipo === 'por-agotarse') {
      // ✅ OPTIMIZACIÓN CRÍTICA: Usar SQL para filtrar en BD en lugar de cargar TODO en memoria
      // Antes: Cargaba 1M productos → 500MB RAM → OOM crash
      // Ahora: Carga solo 20 productos → 10KB → Estable

      const [productos, total] = await Promise.all([
        // Query SQL optimizado con filtro directo en BD
        prisma.$queryRaw<
          Array<{
            id: string;
            clave: string;
            descripcion: string;
            cantidad: number;
            precio: number;
            updatedAt: Date;
            punto_reorden: number;
            cantidad_minima: number;
          }>
        >`
          SELECT 
            id, clave, descripcion, cantidad, precio, "updatedAt",
            punto_reorden, cantidad_minima
          FROM "Inventario"
          WHERE cantidad > 0 
            AND punto_reorden > 0
            AND cantidad <= punto_reorden
          ORDER BY cantidad ASC, descripcion ASC
          LIMIT ${limit} OFFSET ${skip}
        `,

        // Count total (también en SQL)
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM "Inventario"
          WHERE cantidad > 0 
            AND punto_reorden > 0
            AND cantidad <= punto_reorden
        `,
      ]);

      const totalCount = Number(total[0]?.count || 0);
      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        data: productos,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } else if (tipo === 'sobre-stock') {
      // ✅ OPTIMIZACIÓN CRÍTICA: SQL en BD en lugar de filtrar en JavaScript

      const [productos, total] = await Promise.all([
        // Query SQL optimizado
        prisma.$queryRaw<
          Array<{
            id: string;
            clave: string;
            descripcion: string;
            cantidad: number;
            precio: number;
            updatedAt: Date;
            punto_reorden: number;
            cantidad_minima: number;
            cantidad_maxima: number;
          }>
        >`
          SELECT 
            id, clave, descripcion, cantidad, precio, "updatedAt",
            punto_reorden, cantidad_minima, cantidad_maxima
          FROM "Inventario"
          WHERE cantidad_maxima > 0 
            AND cantidad >= cantidad_maxima
          ORDER BY cantidad DESC, descripcion ASC
          LIMIT ${limit} OFFSET ${skip}
        `,

        // Count total
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM "Inventario"
          WHERE cantidad_maxima > 0 
            AND cantidad >= cantidad_maxima
        `,
      ]);

      const totalCount = Number(total[0]?.count || 0);
      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        data: productos,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    }

    // Si no se especifica tipo, retornar vacío
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('Error al obtener productos de stock:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener productos',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para obtener el conteo de productos agotados y por agotarse
 * Usado por los indicadores del dashboard
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Contar productos agotados (cantidad <= 0)
    const agotados = await prisma.inventario.count({
      where: {
        cantidad: { lte: 0 },
      },
    });

    // Para productos por agotarse, necesitamos obtener todos con cantidad > 0
    // y filtrar según punto_reorden o cantidad_minima
    const productosConStock = await prisma.inventario.findMany({
      where: {
        cantidad: { gt: 0 },
      },
      select: {
        cantidad: true,
        punto_reorden: true,
        cantidad_minima: true,
        cantidad_maxima: true,
      },
    });

    // Contar cuántos están por agotarse según punto de reorden
    const porAgotarse = productosConStock.filter((p) => {
      const umbral = p.punto_reorden || 0;
      return p.cantidad > 0 && umbral > 0 && p.cantidad <= umbral;
    }).length;

    // Para productos con exceso de stock, necesitamos obtener todos con cantidad_maxima > 0
    const productosConMaximo = await prisma.inventario.findMany({
      where: {
        cantidad_maxima: { gt: 0 },
      },
      select: {
        cantidad: true,
        cantidad_maxima: true,
      },
    });

    // Contar cuántos exceden el máximo
    const sobreStock = productosConMaximo.filter(
      (p) => p.cantidad_maxima && p.cantidad >= p.cantidad_maxima
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        agotados,
        porAgotarse,
        sobreStock,
      },
    });
  } catch (error) {
    console.error('Error al contar productos de stock:', error);
    return NextResponse.json(
      {
        error: 'Error al contar productos',
        success: false,
      },
      { status: 500 }
    );
  }
}

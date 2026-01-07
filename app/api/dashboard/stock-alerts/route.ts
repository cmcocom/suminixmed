import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Máximo 100
    const offset = (page - 1) * limit;
    const alertType = searchParams.get('alertType'); // Filtro opcional: out_of_stock, expired, low_stock, near_expiry

    // Fecha actual para comparaciones
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Contar totales en paralelo (rápido con índices existentes)
    const [lowStockCount, outOfStockCount, expiredCount, nearExpiryCount] = await Promise.all([
      prisma.inventario.count({
        where: { AND: [{ cantidad: { gt: 0 } }, { cantidad: { lte: 10 } }] },
      }),
      prisma.inventario.count({
        where: { cantidad: { lte: 0 } },
      }),
      prisma.inventario.count({
        where: { fechaVencimiento: { lt: now } },
      }),
      prisma.inventario.count({
        where: { fechaVencimiento: { gte: now, lte: thirtyDaysFromNow } },
      }),
    ]);

    // 2. Query única con UNION ALL + paginación SQL
    // Esto evita cargar TODO en memoria (crítico con millones de productos)
    const alertsRaw = await prisma.$queryRaw<
      Array<{
        id: string;
        descripcion: string;
        cantidad: number;
        precio: number | null;
        fecha_vencimiento: Date | null;
        categoria: string | null;
        alert_type: string;
        priority: number;
      }>
    >`
      WITH all_alerts AS (
        -- Out of stock (prioridad 1 - más crítico)
        SELECT 
          id, 
          descripcion, 
          cantidad, 
          precio,
          "fechaVencimiento" as fecha_vencimiento, 
          categoria,
          'out_of_stock' as alert_type,
          1 as priority
        FROM inventario
        WHERE cantidad <= 0
        ${alertType && alertType !== 'out_of_stock' ? Prisma.sql`AND FALSE` : Prisma.empty}
        
        UNION ALL
        
        -- Expired (prioridad 2 - muy importante)
        SELECT 
          id, 
          descripcion, 
          cantidad, 
          precio,
          "fechaVencimiento" as fecha_vencimiento, 
          categoria,
          'expired' as alert_type,
          2 as priority
        FROM inventario
        WHERE "fechaVencimiento" < ${now}
        ${alertType && alertType !== 'expired' ? Prisma.sql`AND FALSE` : Prisma.empty}
        
        UNION ALL
        
        -- Low stock (prioridad 3 - advertencia)
        SELECT 
          id, 
          descripcion, 
          cantidad, 
          precio,
          "fechaVencimiento" as fecha_vencimiento, 
          categoria,
          'low_stock' as alert_type,
          3 as priority
        FROM inventario
        WHERE cantidad > 0 AND cantidad <= 10
        ${alertType && alertType !== 'low_stock' ? Prisma.sql`AND FALSE` : Prisma.empty}
        
        UNION ALL
        
        -- Near expiry (prioridad 4 - información)
        SELECT 
          id, 
          descripcion, 
          cantidad, 
          precio,
          "fechaVencimiento" as fecha_vencimiento, 
          categoria,
          'near_expiry' as alert_type,
          4 as priority
        FROM inventario
        WHERE "fechaVencimiento" >= ${now} 
          AND "fechaVencimiento" <= ${thirtyDaysFromNow}
        ${alertType && alertType !== 'near_expiry' ? Prisma.sql`AND FALSE` : Prisma.empty}
      )
      SELECT DISTINCT ON (id) *
      FROM all_alerts
      ORDER BY id, priority ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Formatear respuesta
    const formattedAlerts = alertsRaw.map((product) => ({
      id: product.id,
      nombre: product.descripcion,
      cantidad: product.cantidad,
      stock_minimo: 10, // Valor fijo ya que no existe en el esquema
      categoria: product.categoria || 'Sin categoría',
      precio: product.precio || 0,
      fecha_vencimiento: product.fecha_vencimiento?.toISOString() || null,
      alertType: product.alert_type,
    }));

    const totalAlerts = lowStockCount + outOfStockCount + expiredCount + nearExpiryCount;
    const totalPages = Math.ceil(totalAlerts / limit);

    // Calcular totales para el resumen
    const summary = {
      totalAlerts,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      expired: expiredCount,
      nearExpiry: nearExpiryCount,
    };

    return NextResponse.json({
      alerts: formattedAlerts,
      pagination: {
        page,
        limit,
        total: totalAlerts,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary,
    });
  } catch (error) {
    console.error('Error en stock alerts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

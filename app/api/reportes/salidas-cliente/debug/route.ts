import { prisma } from '@/lib/prisma';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';
import { NextRequest, NextResponse } from 'next/server';

// DEBUG - Endpoint simplificado para diagnosticar el problema del reporte
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Iniciando diagnóstico del reporte...');

    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get('fechaInicio') || '2025-01-01';
    const fechaFin = searchParams.get('fechaFin') || '2025-12-31';
    const agruparPor = searchParams.get('agruparPor') || 'cliente';

    console.log('[DEBUG] Parámetros:', { fechaInicio, fechaFin, agruparPor });

    // Usar filtro de fechas correcto con zona horaria México
    const filtroFecha = crearFiltroFechasMexico(fechaInicio, fechaFin);
    const fechaInicioISO = filtroFecha?.gte?.toISOString() || new Date(fechaInicio).toISOString();
    const fechaFinISO = filtroFecha?.lte?.toISOString() || new Date(fechaFin).toISOString();

    console.log('[DEBUG] Fechas convertidas con timezone México:', { fechaInicioISO, fechaFinISO });

    const startTime = Date.now();

    if (agruparPor === 'cliente') {
      // Query original del API
      const sql = `
        SELECT
          s.cliente_id AS cliente_id,
          COALESCE(c.nombre, 'Sin cliente') AS cliente_nombre,
          i.clave AS producto_clave,
          i.nombre AS producto_nombre,
          COALESCE(um.nombre, um.clave, 'UND') AS unidad_medida,
          SUM(p.cantidad) AS cantidad_total
        FROM partidas_salida_inventario p
        JOIN salidas_inventario s ON p.salida_id = s.id
        JOIN "Inventario" i ON p.inventario_id = i.id
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN unidades_medida um ON i.unidad_medida_id = um.id
        WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
        AND s.fecha_creacion BETWEEN $1::timestamp AND $2::timestamp
        GROUP BY s.cliente_id, c.nombre, i.clave, i.nombre, um.nombre, um.clave
        ORDER BY s.cliente_id
      `;

      const rows: any[] = await prisma.$queryRawUnsafe(sql, fechaInicioISO, fechaFinISO);
      const queryTime = Date.now() - startTime;

      console.log(`[DEBUG] Query ejecutado en ${queryTime}ms`);
      console.log(`[DEBUG] Filas devueltas: ${rows.length}`);

      // Procesar datos igual que el API original
      const map: Record<string, any> = {};
      rows.forEach((r) => {
        const cid = r.cliente_id || 'sin_cliente';
        if (!map[cid]) {
          map[cid] = {
            cliente_id: cid,
            cliente_nombre: r.cliente_nombre,
            productos: {},
          };
        }
        const key = r.producto_clave || 'S/C';
        map[cid].productos[key] = {
          clave: key,
          producto: r.producto_nombre,
          unidad_medida: r.unidad_medida,
          cantidad_total: Number(r.cantidad_total || 0),
        };
      });

      const resultado = Object.values(map).map((g: any) => {
        const productos = Object.values(g.productos);
        return {
          cliente_id: g.cliente_id,
          cliente_nombre: g.cliente_nombre,
          productos,
          total_productos: productos.length,
          total_unidades: productos.reduce((s: number, p: any) => s + (p.cantidad_total || 0), 0),
        };
      });

      const processingTime = Date.now() - startTime;

      console.log(`[DEBUG] Procesamiento completado en ${processingTime}ms`);
      console.log(`[DEBUG] Clientes en resultado: ${resultado.length}`);
      console.log(`[DEBUG] Primer cliente:`, JSON.stringify(resultado[0], null, 2));

      return NextResponse.json({
        success: true,
        agruparPor: 'cliente',
        data: resultado,
        debug: {
          queryTime,
          processingTime,
          rawRows: rows.length,
          clientesProcessed: resultado.length,
          fechaInicioISO,
          fechaFinISO,
        },
      });
    }

    return NextResponse.json(
      { error: 'Solo soporta agrupación por cliente en debug' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      {
        error: 'Error en diagnóstico',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

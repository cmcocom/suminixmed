import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener salidas consolidadas por cliente, categoría o producto
export async function GET(request: NextRequest) {
  try {
    // Soporte temporal de depuración: permitir bypass de auth si se define la var de entorno
    // WARNING: esto es solo para pruebas locales y se usa con DEBUG_BYPASS_CONSOLIDADO=1
    let session: any = null;
    if (process.env.DEBUG_BYPASS_CONSOLIDADO === '1') {
      session = { user: { id: 'debug' } };
      if (process.env.NODE_ENV === 'development') {
        console.log('[CONSOLIDADO] DEBUG auth bypass activado');
      }
    } else {
      // Cast a any para sortear incompatibilidades de tipos del helper en este entorno
      session = await (getServerSession as any)(authOptions);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos RBAC para REPORTES_SALIDAS_CLIENTE
    if (process.env.DEBUG_BYPASS_CONSOLIDADO !== '1') {
      const hasPermission = await checkUserPermission(
        session.user.id,
        'REPORTES_SALIDAS_CLIENTE',
        'LEER'
      );

      if (!hasPermission) {
        return NextResponse.json(
          {
            error: 'Acceso denegado - Permisos insuficientes para reportes de salidas por cliente',
            code: 'RBAC_DENIED',
            requiredPermission: 'REPORTES_SALIDAS_CLIENTE:LEER',
          },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const fechaInicioRaw = searchParams.get('fechaInicio');
    const fechaFinRaw = searchParams.get('fechaFin');
    const clienteId = searchParams.get('clienteId');
    const categoriaId = searchParams.get('categoriaId');
    const productoId = searchParams.get('productoId');
    const agruparPor = searchParams.get('agruparPor') || 'cliente';

    if (!['cliente', 'categoria', 'producto'].includes(agruparPor)) {
      return NextResponse.json({ error: "Parámetro 'agruparPor' inválido" }, { status: 400 });
    }

    // Usar filtro de fechas correcto con zona horaria México
    const filtroFecha = crearFiltroFechasMexico(fechaInicioRaw, fechaFinRaw);

    // Para uso en queries SQL, necesitamos los valores ISO string
    const fechaInicio = filtroFecha?.gte?.toISOString() || new Date(0).toISOString();
    const fechaFin = filtroFecha?.lte?.toISOString() || new Date().toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[CONSOLIDADO] Iniciando (agruparPor=', agruparPor, ')', {
        fechaInicio,
        fechaFin,
        clienteId,
        categoriaId,
        productoId,
      });
    }

    // Helper para construir condiciones y parámetros
    function buildRangeAndFilters() {
      const conditions: string[] = [];
      const params: any[] = [];
      // fecha range - siempre los primeros dos parámetros
      params.push(fechaInicio);
      params.push(fechaFin);
      // fecha condicionada en SQL base; las condiciones opcionales se añaden aquí

      if (clienteId) {
        params.push(clienteId);
        conditions.push(`s.cliente_id = $${params.length}`);
      }

      if (categoriaId) {
        params.push(categoriaId);
        conditions.push(`i.categoria_id = $${params.length}`);
      }

      if (productoId) {
        // Aceptar tanto el id (cast a text) como la clave del producto
        params.push(productoId);
        conditions.push(
          `(p.inventario_id::text = $${params.length} OR i.clave = $${params.length})`
        );
      }

      return { conditions, params };
    }

    // ----------------------------------------
    // AGRUPAR POR CLIENTE (agregación en DB)
    // ----------------------------------------
    if (agruparPor === 'cliente') {
      const bf = buildRangeAndFilters();
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
  ${bf.conditions.length ? 'AND ' + bf.conditions.join('\n        AND ') : ''}
        GROUP BY s.cliente_id, c.nombre, i.clave, i.nombre, um.nombre, um.clave
        ORDER BY s.cliente_id
      `;

      const params = bf.params;
      const rows: any[] = await prisma.$queryRawUnsafe(sql, ...params);

      // Mapear a la estructura solicitada
      const map: Record<string, any> = {};
      rows.forEach((r) => {
        const cid = r.cliente_id || 'sin_cliente';
        if (!map[cid])
          map[cid] = { cliente_id: cid, cliente_nombre: r.cliente_nombre, productos: {} };
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

      return NextResponse.json({ success: true, agruparPor: 'cliente', data: resultado });
    }

    // ----------------------------------------
    // AGRUPAR POR CATEGORIA (agregación en DB)
    // ----------------------------------------
    if (agruparPor === 'categoria') {
      const bf = buildRangeAndFilters();
      const params = bf.params;
      const sql = `
        SELECT
          COALESCE(i.categoria_id, 'sin_categoria') AS categoria_id,
          COALESCE(cat.nombre, 'Sin Categoría') AS categoria_nombre,
          i.clave AS producto_clave,
          i.nombre AS producto_nombre,
          COALESCE(um.nombre, um.clave, 'UND') AS unidad_medida,
          SUM(p.cantidad) AS cantidad_total
        FROM partidas_salida_inventario p
  JOIN salidas_inventario s ON p.salida_id = s.id
  JOIN "Inventario" i ON p.inventario_id = i.id
        LEFT JOIN categorias cat ON i.categoria_id = cat.id
        LEFT JOIN unidades_medida um ON i.unidad_medida_id = um.id
  WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
  AND s.fecha_creacion BETWEEN $1::timestamp AND $2::timestamp
  ${bf.conditions.length ? 'AND ' + bf.conditions.join('\n        AND ') : ''}
        GROUP BY i.categoria_id, cat.nombre, i.clave, i.nombre, um.nombre, um.clave
        ORDER BY i.categoria_id
      `;

      const rows: any[] = await prisma.$queryRawUnsafe(sql, ...params);
      const map: Record<string, any> = {};
      rows.forEach((r) => {
        const cid = r.categoria_id || 'sin_categoria';
        if (!map[cid])
          map[cid] = { categoria_id: cid, categoria_nombre: r.categoria_nombre, productos: {} };
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
          categoria_id: g.categoria_id,
          categoria_nombre: g.categoria_nombre,
          productos,
          total_productos: productos.length,
          total_unidades: productos.reduce((s: number, p: any) => s + (p.cantidad_total || 0), 0),
        };
      });

      return NextResponse.json({ success: true, agruparPor: 'categoria', data: resultado });
    }

    // ----------------------------------------
    // AGRUPAR POR PRODUCTO (detalle)
    // ----------------------------------------
    if (agruparPor === 'producto') {
      const bf = buildRangeAndFilters();
      const params = bf.params;
      // Obtenemos filas detalladas: salida + partida + inventario + cliente
      const sql = `
        SELECT
          s.folio AS folio,
          s.serie AS serie,
          s.fecha_creacion AS fecha_creacion,
          s.cliente_id AS cliente_id,
          COALESCE(c.nombre, 'Sin cliente') AS cliente_nombre,
          i.id AS producto_id,
          i.clave AS producto_clave,
          i.nombre AS producto_nombre,
          COALESCE(cat.nombre, 'Sin Categoría') AS categoria_nombre,
          COALESCE(um.nombre, um.clave, 'UND') AS unidad_medida,
          p.cantidad AS cantidad
        FROM partidas_salida_inventario p
  JOIN salidas_inventario s ON p.salida_id = s.id
  JOIN "Inventario" i ON p.inventario_id = i.id
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN categorias cat ON i.categoria_id = cat.id
        LEFT JOIN unidades_medida um ON i.unidad_medida_id = um.id
        WHERE i.estado IS DISTINCT FROM 'DESCONTINUADO'
  AND s.fecha_creacion BETWEEN $1::timestamp AND $2::timestamp
        ${bf.conditions.length ? 'AND ' + bf.conditions.join('\n        AND ') : ''}
        ORDER BY i.id, s.fecha_creacion DESC
      `;

      const rows: any[] = await prisma.$queryRawUnsafe(sql, ...params);
      const map: Record<string, any> = {};
      rows.forEach((r) => {
        const pid = r.producto_id || 'sin_id';
        if (!map[pid])
          map[pid] = {
            producto_id: pid,
            producto_clave: r.producto_clave,
            producto_nombre: r.producto_nombre,
            categoria_nombre: r.categoria_nombre,
            unidad_medida: r.unidad_medida,
            salidas: [],
            total_unidades: 0,
          };
        map[pid].salidas.push({
          folio: r.folio || r.serie || 'S/F',
          fecha: new Date(r.fecha_creacion).toISOString(),
          cliente_nombre: r.cliente_nombre,
          cantidad: Number(r.cantidad || 0),
        });
        map[pid].total_unidades += Number(r.cantidad || 0);
      });

      const resultado = Object.values(map).map((g: any) => ({
        producto_id: g.producto_id,
        producto_clave: g.producto_clave,
        producto_nombre: g.producto_nombre,
        categoria_nombre: g.categoria_nombre,
        unidad_medida: g.unidad_medida,
        salidas: g.salidas,
        total_salidas: g.salidas.length,
        total_unidades: g.total_unidades,
      }));

      return NextResponse.json({ success: true, agruparPor: 'producto', data: resultado });
    }

    return NextResponse.json({ error: 'Tipo de agrupación no implementado' }, { status: 400 });
  } catch (error) {
    console.error('[CONSOLIDADO] Error:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar consolidación',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

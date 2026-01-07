const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const fechaInicioRaw = '2025-11-01';
    const fechaFinRaw = '2025-11-03';
    const clienteId = null;
    const categoriaId = null;
    const productoId = 'PROD-00431';
    const agruparPor = 'producto'; // 'cliente' | 'categoria' | 'producto'

    const fechaInicio = fechaInicioRaw ? new Date(fechaInicioRaw).toISOString() : new Date(0).toISOString();
    const fechaFin = fechaFinRaw ? new Date(fechaFinRaw).toISOString() : new Date().toISOString();

    function buildRangeAndFilters() {
      const conditions = [];
      const params = [];
      params.push(fechaInicio);
      params.push(fechaFin);

      if (clienteId) {
        params.push(clienteId);
        conditions.push(`s.cliente_id = $${params.length}`);
      }
      if (categoriaId) {
        params.push(categoriaId);
        conditions.push(`i.categoria_id = $${params.length}`);
      }
      if (productoId) {
        params.push(productoId);
        conditions.push(`(p.inventario_id::text = $${params.length} OR i.clave = $${params.length})`);
      }
      return { conditions, params };
    }

    if (agruparPor === 'producto') {
      const bf = buildRangeAndFilters();
      const params = bf.params;
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

      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      const map = {};
      rows.forEach(r => {
        const pid = r.producto_id || 'sin_id';
        if (!map[pid]) map[pid] = { producto_id: pid, producto_clave: r.producto_clave, producto_nombre: r.producto_nombre, categoria_nombre: r.categoria_nombre, unidad_medida: r.unidad_medida, salidas: [], total_unidades: 0 };
        map[pid].salidas.push({ folio: r.folio || r.serie || 'S/F', fecha: new Date(r.fecha_creacion).toISOString(), cliente_nombre: r.cliente_nombre, cantidad: Number(r.cantidad || 0) });
        map[pid].total_unidades += Number(r.cantidad || 0);
      });

      const resultado = Object.values(map).map(g => ({ producto_id: g.producto_id, producto_clave: g.producto_clave, producto_nombre: g.producto_nombre, categoria_nombre: g.categoria_nombre, unidad_medida: g.unidad_medida, salidas: g.salidas, total_salidas: g.salidas.length, total_unidades: g.total_unidades }));

      console.log(JSON.stringify({ success: true, agruparPor: 'producto', data: resultado }, null, 2));
    } else {
      console.log('agruparPor no implementado en este script');
    }
  } catch (e) {
    console.error('[ERROR]', e && e.message ? e.message : e);
    if (e && e.code) console.error('[ERROR_CODE]', e.code);
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();

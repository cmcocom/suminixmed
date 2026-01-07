const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const fechaInicio = new Date('2025-11-01').toISOString();
    const fechaFin = new Date('2025-11-03').toISOString();
    const productoId = 'PROD-00431';

    const conditions = [];
    const params = [fechaInicio, fechaFin];

    if (productoId) {
      params.push(productoId);
      conditions.push(`(p.inventario_id::text = $${params.length} OR i.clave = $${params.length})`);
    }

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
      ${conditions.length ? 'AND ' + conditions.join('\n      AND ') : ''}
      ORDER BY i.id, s.fecha_creacion DESC
    `;

    console.log('[DEBUG] SQL to run:', sql);
    console.log('[DEBUG] params:', params);

    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    console.log('[RESULT] rows.length=', rows.length);
    console.log(rows.slice(0, 20));
  } catch (e) {
    console.error('[ERROR]', e && e.message ? e.message : e);
    if (e && e.code) console.error('[ERROR_CODE]', e.code);
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();

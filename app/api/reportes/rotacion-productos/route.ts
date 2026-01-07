import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener rotación de productos (entradas, salidas, existencias)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos RBAC para REPORTES_ROTACION_PRODUCTOS
    const hasPermission = await checkUserPermission(
      session.user.id,
      'REPORTES_ROTACION_PRODUCTOS',
      'LEER'
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Acceso denegado - Permisos insuficientes para reportes de rotación',
          code: 'RBAC_DENIED',
          requiredPermission: 'REPORTES_ROTACION_PRODUCTOS:LEER',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fechaInicioRaw = searchParams.get('fechaInicio');
    const fechaFinRaw = searchParams.get('fechaFin');
    const productoId = searchParams.get('productoId');
    const categoriaId = searchParams.get('categoriaId');

    // Usar filtro de fechas correcto con zona horaria México
    const filtroFecha = crearFiltroFechasMexico(fechaInicioRaw, fechaFinRaw);

    // Para uso en queries SQL
    const fechaInicio = filtroFecha?.gte?.toISOString() || new Date(0).toISOString();
    const fechaFin = filtroFecha?.lte?.toISOString() || new Date().toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[ROTACION] Consultando rotación de productos', {
        fechaInicio,
        fechaFin,
        productoId,
        categoriaId,
      });
    }

    // Query SQL consolidada para rotación de productos
    // NOTA: Usar COALESCE para manejar fechas NULL (usar fecha_creacion como fallback)
    let query = `
      SELECT 
        i.id,
        i.clave,
        i.nombre as descripcion,
        i.cantidad as existencias,
        COALESCE(
          (SELECT SUM(pe.cantidad) 
           FROM partidas_entrada_inventario pe
           JOIN entradas_inventario e ON e.id = pe.entrada_id
           WHERE pe.inventario_id = i.id
           AND COALESCE(e.fecha_entrada, e.fecha_creacion) BETWEEN $1::timestamp AND $2::timestamp
          ), 0
        ) as total_entradas,
        COALESCE(
          (SELECT SUM(ps.cantidad)
           FROM partidas_salida_inventario ps
           JOIN salidas_inventario s ON s.id = ps.salida_id
           WHERE ps.inventario_id = i.id
           AND COALESCE(s.fecha_salida, s.fecha_creacion) BETWEEN $1::timestamp AND $2::timestamp
          ), 0
        ) as total_salidas
      FROM "Inventario" i
      WHERE 1=1
    `;

    const params: any[] = [fechaInicio, fechaFin];

    // Filtro por categoría
    if (categoriaId) {
      params.push(categoriaId);
      query += ` AND i.categoria_id = $${params.length}`;
    }

    // Filtro por producto específico
    if (productoId) {
      params.push(productoId);
      query += ` AND (i.id = $${params.length} OR i.clave = $${params.length})`;
    }

    // Envolver en subquery para poder ordenar por alias
    query = `
      SELECT * FROM (
        ${query}
      ) as subq
      ORDER BY total_salidas DESC, clave ASC
    `;

    const resultado = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    // Formatear resultados
    const datos = resultado.map((row) => ({
      id: row.id,
      clave: row.clave || 'S/C',
      descripcion: row.descripcion,
      entradas: Number(row.total_entradas),
      salidas: Number(row.total_salidas),
      existencias: Number(row.existencias),
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ROTACION] Retornando ${datos.length} productos`);
    }

    return NextResponse.json({
      success: true,
      data: datos,
      total: datos.length,
      fechaInicio,
      fechaFin,
    });
  } catch (error) {
    console.error('[ROTACION] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

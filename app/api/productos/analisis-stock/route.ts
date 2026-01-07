import { createProtectedAPI } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const GET = createProtectedAPI(
  'INVENTARIO',
  'LEER',
  async ({ req }: { req: NextRequest }) => {
    try {
      const { searchParams } = new URL(req.url);
      const tipo = searchParams.get('tipo') || 'punto_reorden';
      const proveedorId = searchParams.get('proveedorId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Máx 100
      const skip = (page - 1) * limit;

      // Agregar filtro de proveedor si se especifica
      let proveedorNombre: string | null = null;
      if (proveedorId) {
        const proveedor = await prisma.proveedores.findUnique({
          where: { id: proveedorId },
          select: { nombre: true },
        });
        if (proveedor) {
          proveedorNombre = proveedor.nombre;
        }
      }

      // Construir query SQL optimizada según el tipo
      let productos: any[];
      let total: number;

      if (tipo === 'agotados') {
        // Productos agotados (cantidad <= 0)
        const whereCondition: any = {
          estado: 'disponible',
          cantidad: { lte: 0 },
        };
        if (proveedorNombre) {
          whereCondition.proveedor = proveedorNombre;
        }

        [productos, total] = await Promise.all([
          prisma.inventario.findMany({
            where: whereCondition,
            include: {
              categorias: {
                select: {
                  nombre: true,
                  descripcion: true,
                },
              },
            },
            orderBy: [{ cantidad: 'asc' }, { descripcion: 'asc' }],
            skip,
            take: limit,
          }),
          prisma.inventario.count({ where: whereCondition }),
        ]);
      } else {
        // Productos en punto de reorden - usar SQL para comparación dinámica
        const proveedorFilter = proveedorNombre
          ? Prisma.sql`AND i.proveedor = ${proveedorNombre}`
          : Prisma.empty;

        // Query para obtener productos
        productos = await prisma.$queryRaw<any[]>`
          SELECT 
            i.id,
            i.clave,
            i.descripcion,
            i.cantidad,
            i.cantidad_minima,
            i.cantidad_maxima,
            i.punto_reorden,
            i.dias_reabastecimiento,
            i.precio,
            i.categoria,
            i.proveedor,
            c.nombre as categoria_nombre,
            c.descripcion as categoria_descripcion
          FROM inventario i
          LEFT JOIN categorias c ON i.categoria = c.nombre
          WHERE i.estado = 'disponible'
            AND i.cantidad <= COALESCE(i.punto_reorden, i.cantidad_minima, 10)
            ${proveedorFilter}
          ORDER BY i.cantidad ASC, i.descripcion ASC
          LIMIT ${limit} OFFSET ${skip}
        `;

        // Query para contar total
        const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*)::bigint as count
          FROM inventario i
          WHERE i.estado = 'disponible'
            AND i.cantidad <= COALESCE(i.punto_reorden, i.cantidad_minima, 10)
            ${proveedorFilter}
        `;
        total = Number(countResult[0].count);

        // Formatear productos para que coincidan con el formato esperado
        productos = productos.map((p) => ({
          ...p,
          categorias: p.categoria_nombre
            ? {
                nombre: p.categoria_nombre,
                descripcion: p.categoria_descripcion,
              }
            : null,
        }));
      }

      // Ya no necesitamos filtrar en memoria - la query lo hace
      const productosFiltrados = productos;

      // Calcular cantidad sugerida para cada producto
      const productosConSugerencia = productosFiltrados.map((producto) => {
        // Usar valores de inventario control o valores por defecto
        const cantidadMinima = producto.cantidad_minima || 5;
        const cantidadMaxima = producto.cantidad_maxima || 50;
        const puntoReorden = producto.punto_reorden || cantidadMinima * 2;
        const diasReabastecimiento = producto.dias_reabastecimiento || 7;

        // Calcular cantidad sugerida inteligente
        let cantidadSugerida = 0;

        if (producto.cantidad === 0) {
          // Si está agotado, sugerir llevar al máximo o al menos 3x el mínimo
          cantidadSugerida = Math.min(cantidadMaxima, cantidadMinima * 3);
        } else if (producto.cantidad <= puntoReorden) {
          // Si está en punto de reorden, calcular para llegar al stock óptimo
          const stockOptimo = Math.ceil((cantidadMinima + cantidadMaxima) / 2);
          cantidadSugerida = Math.max(stockOptimo - producto.cantidad, cantidadMinima);
        } else {
          // Fallback para casos edge
          cantidadSugerida = cantidadMinima;
        }

        // Ajustar según días de reabastecimiento (estimación simple)
        if (diasReabastecimiento > 7) {
          cantidadSugerida = Math.ceil(cantidadSugerida * 1.5);
        }

        return {
          id: producto.id,
          nombre: producto.descripcion,
          descripcion: producto.descripcion,
          stockActual: producto.cantidad,
          stockMinimo: cantidadMinima,
          puntoReorden: puntoReorden,
          stockMaximo: cantidadMaxima,
          diasReabastecimiento: diasReabastecimiento,
          precioPrimario: producto.precio,
          categoria: producto.categorias?.nombre || producto.categoria,
          sugeridoCantidad: cantidadSugerida,
        };
      });

      return NextResponse.json({
        success: true,
        productos: productosConSugerencia,
        tipo,
        proveedorId,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        configuracion: {
          usandoCamposControl: productos.some(
            (p) => p.punto_reorden !== null || p.cantidad_minima !== null
          ),
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  }
);

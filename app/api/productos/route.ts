import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener productos (alias para inventario simplificado)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 RBAC V2: Los permisos están garantizados, solo se requiere autenticación
    // La visibilidad del módulo se controla en el frontend, no aquí

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    // Construir filtros - SIN FILTRAR POR CANTIDAD (mostrar todos los productos)

    const whereClause: Record<string, any> = {};

    // Búsqueda en múltiples campos: nombre, descripción, claves, categoría, etc.
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        { clave: { contains: searchTerm, mode: 'insensitive' } },
        { clave2: { contains: searchTerm, mode: 'insensitive' } },
        { categoria: { contains: searchTerm, mode: 'insensitive' } },
        { numero_lote: { contains: searchTerm, mode: 'insensitive' } },
        { ubicacion_general: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.inventario.findMany({
      where: whereClause,
      select: {
        id: true,
        clave: true,
        clave2: true,
        nombre: true,
        descripcion: true,
        cantidad: true,
        precio: true,
        categoria: true,
        estado: true,
        numero_lote: true,
        ubicacion_general: true,
        unidad_medida_id: true,
        unidades_medida: {
          select: {
            clave: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        descripcion: 'asc',
      },
      take: limit ? parseInt(limit) : 1000, // Aumentado de 100 a 1000
    });

    // Transformar a formato simplificado para solicitudes
    const productosSimplificados = productos.map((producto) => ({
      id: producto.id,
      clave: producto.clave,
      clave2: producto.clave2,
      nombre: producto.nombre || producto.descripcion,
      descripcion: producto.descripcion,
      stock: producto.cantidad, // Mapear cantidad -> stock
      precio: parseFloat(producto.precio.toString()),
      categoria: producto.categoria,
      estado: producto.estado,
      numero_lote: producto.numero_lote,
      ubicacion_general: producto.ubicacion_general,
      unidad_medida: producto.unidades_medida
        ? {
            clave: producto.unidades_medida.clave,
            nombre: producto.unidades_medida.nombre,
          }
        : null,
    }));
    return NextResponse.json({
      success: true,
      data: productosSimplificados,
      total: productosSimplificados.length,
    });
  } catch (error) {
    console.error('[API PRODUCTOS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

import { deleteImageFile, isValidImagePath } from '@/lib/fileUtils';
import { calcularEstadoInventario } from '@/lib/helpers/inventario-estado';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener producto específico
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const inventario = await prisma.inventario.findUnique({
      where: { id },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ inventario });
  } catch (error) {
    logger.error('[INVENTARIO-GET] Error obteniendo producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const {
      descripcion,
      categoria,
      categoriaId,
      cantidad,
      precio,
      fechaVencimiento,
      imagen,
      clave,
      clave2,
      numero_lote,
      cantidad_minima,
      cantidad_maxima,
      punto_reorden,
      dias_reabastecimiento,
      unidad_medida_id,
      activo,
    } = await request.json();

    // Validaciones básicas
    if (!descripcion || (!categoria && !categoriaId)) {
      return NextResponse.json(
        { error: 'Descripción y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Si tenemos categoriaId pero no categoria, buscar el nombre de la categoría
    let categoriaNombre = categoria;
    if (!categoria && categoriaId) {
      const categoriaData = await prisma.categorias.findUnique({
        where: { id: categoriaId },
      });
      if (!categoriaData) {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 });
      }
      categoriaNombre = categoriaData.nombre;
    }

    if (cantidad < 0) {
      return NextResponse.json({ error: 'La cantidad no puede ser negativa' }, { status: 400 });
    }

    // Validar precio solo si se proporciona
    if (precio !== undefined && precio !== null && precio < 0) {
      return NextResponse.json({ error: 'El precio no puede ser negativo' }, { status: 400 });
    }

    // Verificar que el producto existe
    const existingInventario = await prisma.inventario.findUnique({
      where: { id },
    });

    if (!existingInventario) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Si la imagen cambió, eliminar la imagen anterior
    const imageChanged = existingInventario.imagen !== imagen;
    if (imageChanged && isValidImagePath(existingInventario.imagen)) {
      try {
        await deleteImageFile(existingInventario.imagen!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // No fallar la operación por no poder eliminar la imagen anterior
      }
    }

    // Calcular cantidad como número
    const nuevaCantidad = parseInt(cantidad) || 0;
    const nuevaFechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

    // Calcular el estado automáticamente basándose en cantidad y fecha de vencimiento
    const nuevoEstado = calcularEstadoInventario(nuevaCantidad, nuevaFechaVencimiento);

    // Preparar datos para actualización
    // CRÍTICO: Manejar tanto el campo de texto 'categoria' como la relación 'categorias'
    const updateData: any = {
      descripcion,
      clave: clave || null,
      clave2: clave2 || null,
      categoria: categoriaNombre,
      cantidad: nuevaCantidad,
      precio: parseFloat(precio) || 0,
      fechaVencimiento: nuevaFechaVencimiento,
      estado: activo !== undefined ? (activo ? nuevoEstado : 'DESCONTINUADO') : nuevoEstado,
      imagen,
      numero_lote: numero_lote || null,
      cantidad_minima: cantidad_minima !== undefined ? parseInt(cantidad_minima) || 0 : 0,
      cantidad_maxima: cantidad_maxima !== undefined ? parseInt(cantidad_maxima) || 0 : 0,
      punto_reorden: punto_reorden !== undefined ? parseInt(punto_reorden) || 0 : 0,
      dias_reabastecimiento:
        dias_reabastecimiento !== undefined ? parseInt(dias_reabastecimiento) || 7 : 7,
      unidad_medida_id: unidad_medida_id || null,
      // CRÍTICO: Actualizar categoria_id directamente, NO usar relación
      categoria_id: categoriaId || null,
    };

    const inventario = await prisma.inventario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ inventario });
  } catch (error) {
    logger.error('[INVENTARIO-UPDATE] Error actualizando producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que el producto existe
    const existingInventario = await prisma.inventario.findUnique({
      where: { id },
    });

    if (!existingInventario) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Eliminar la imagen del producto si existe, antes de eliminar el producto
    if (isValidImagePath(existingInventario.imagen)) {
      try {
        await deleteImageFile(existingInventario.imagen!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // Continuar con la eliminación del producto aunque la imagen no se pueda eliminar
      }
    }

    await prisma.inventario.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    logger.error('[INVENTARIO-DELETE] Error eliminando producto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

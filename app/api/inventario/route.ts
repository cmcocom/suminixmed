import { applyRoleBasedFilter, createProtectedAPI } from '@/lib/api-auth';
import { AuditAction, AuditSystem } from '@/lib/audit-system';
import { calcularEstadoInventario } from '@/lib/helpers/inventario-estado';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Obtener todos los productos del inventario
// 🆕 RBAC V2: Solo autenticación requerida, permisos garantizados
export const GET = createProtectedAPI('INVENTARIO', 'LEER', async ({ user, req }) => {
  try {
    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock') === 'true';
    // ✅ OPTIMIZACIÓN: Ajustado para mostrar más productos por defecto
    // 500 productos × 2KB = 1MB JSON → buen balance rendimiento/usabilidad
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '500');
    const limit = Math.min(requestedLimit, 1000); // Máximo 1000 productos
    const page = Number.parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Aplicar filtro basado en rol (si aplica, `applyRoleBasedFilter` devuelve un marcador
    // `__ownerFilter` en lugar de inyectar campos desconocidos para modelos que no los tienen).
    const baseFilter = applyRoleBasedFilter(user, {});

    // Extraer y limpiar el posible ownerFilter para evitar pasar claves inválidas a Prisma.
    // Las rutas que requieren filtrado por propietario deben mapear explícitamente `__ownerFilter`
    // a los campos reales del modelo aquí.
    const ownerFilter = (baseFilter as any)?.__ownerFilter;
    if (ownerFilter) {
      // Para `inventario` actualmente no hay campos owner estándar (user_id/id_usuario/id_departamento),
      // así que no aplicamos filtro por propietario. Si en el futuro el modelo soporta owner fields,
      // mapear aquí ownerFilter. Ejemplo: where.userId = ownerFilter.userId
    }

    // Construir filtros adicionales
    const cleanedBaseFilter = { ...baseFilter } as Record<string, any>;
    delete cleanedBaseFilter.__ownerFilter;

    const where: Record<string, any> = { ...cleanedBaseFilter };

    // Filtro de búsqueda
    if (search?.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        { categoria: { contains: searchTerm, mode: 'insensitive' } },
        // { proveedor: { contains: searchTerm, mode: 'insensitive' } }, // ❌ Campo eliminado
        { clave: { contains: searchTerm, mode: 'insensitive' } },
        { clave2: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Filtro por categoría
    if (category && category !== 'all') {
      where.categoria = category;
    }

    // Filtro por stock disponible
    if (inStock) {
      where.cantidad = { gt: 0 };
    }

    // Obtener inventarios con paginación y SELECT optimizado
    const [inventarios, total] = await Promise.all([
      prisma.inventario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          clave: true,
          clave2: true,
          descripcion: true,
          categoria: true,
          cantidad: true,
          precio: true,
          fechaVencimiento: true,
          estado: true,
          imagen: true,
          numero_lote: true,
          cantidad_minima: true,
          cantidad_maxima: true,
          punto_reorden: true,
          ubicacion_general: true,
          createdAt: true,
          updatedAt: true,
          categoria_id: true,
          unidad_medida_id: true,
          dias_reabastecimiento: true,
          categorias: {
            select: {
              id: true,
              nombre: true,
            },
          },
          unidades_medida: {
            select: {
              id: true,
              clave: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.inventario.count({ where }),
    ]);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      inventarios,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});

// POST - Crear nuevo producto en inventario
// 🆕 RBAC V2: Solo autenticación requerida, permisos garantizados
export const POST = createProtectedAPI('INVENTARIO', 'CREAR', async ({ req, user }) => {
  try {
    // auditMiddleware removed: usamos AuditSystem.logCRUD directamente para auditoría
    const body = await req.json();

    const {
      clave,
      clave2,
      descripcion,
      categoria,
      categoriaId,
      categoria_id,
      cantidad,
      precio,
      proveedor: _proveedor,
      proveedor_id: _proveedor_id,
      fechaVencimiento,
      estado: _estado,
      imagen,
      codigo_barras: _codigo_barras,
      numero_lote,
      cantidad_maxima,
      punto_reorden,
      dias_reabastecimiento,
      unidad_medida_id,
    } = body;

    // Validaciones básicas
    if (!descripcion || (!categoria && !categoriaId && !categoria_id)) {
      return NextResponse.json(
        { error: 'Descripción y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Validar que al menos una clave esté presente
    if (!clave && !clave2) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos una clave (clave o clave2)' },
        { status: 400 }
      );
    }

    // Validar que las claves no estén duplicadas si se proporcionan
    if (clave) {
      const existeClave = await prisma.inventario.findUnique({
        where: { clave },
      });
      if (existeClave) {
        return NextResponse.json({ error: 'La clave ya existe en el sistema' }, { status: 400 });
      }
    }

    if (clave2) {
      const existeClave2 = await prisma.inventario.findUnique({
        where: { clave2 },
      });
      if (existeClave2) {
        return NextResponse.json({ error: 'La clave2 ya existe en el sistema' }, { status: 400 });
      }
    }

    // Obtener el nombre de la categoría si se proporcionó categoriaId
    let categoriaNombre = categoria;
    const finalCategoriaId = categoriaId || categoria_id;

    logger.debug('[API INVENTARIO POST] Procesando categoría:', {
      categoria,
      categoriaId,
      categoria_id,
      finalCategoriaId,
    });

    if (!categoriaNombre && finalCategoriaId) {
      const categoriaObj = await prisma.categorias.findUnique({
        where: { id: finalCategoriaId },
      });
      if (categoriaObj) {
        categoriaNombre = categoriaObj.nombre;
      } else {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 });
      }
    }

    if (cantidad < 0) {
      return NextResponse.json({ error: 'La cantidad no puede ser negativa' }, { status: 400 });
    }

    // Validar precio solo si se proporciona
    if (precio !== undefined && precio !== null && precio < 0) {
      return NextResponse.json({ error: 'El precio no puede ser negativo' }, { status: 400 });
    }

    // Establecer contexto de usuario para auditoría automática por triggers
    if (user?.id) {
      await AuditSystem.setDatabaseUserContext(user.id, user.name || user.email || undefined);
    }

    // Calcular cantidad y estado automáticamente
    const nuevaCantidad = Number.parseInt(cantidad) || 0;
    const nuevaFechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    const nuevoEstado = calcularEstadoInventario(nuevaCantidad, nuevaFechaVencimiento);

    // Crear producto
    const createData: any = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      nombre: descripcion,
      clave: clave || null,
      clave2: clave2 || null,
      descripcion,
      categoria: categoriaNombre,
      cantidad: nuevaCantidad,
      precio: Number.parseFloat(precio) || 0,
      fechaVencimiento: nuevaFechaVencimiento,
      estado: nuevoEstado,
      imagen,
      numero_lote: numero_lote || null,
      cantidad_minima: 0, // Deprecated: usar punto_reorden
      cantidad_maxima:
        cantidad_maxima !== undefined && cantidad_maxima !== null ? Number.parseInt(cantidad_maxima) : 0,
      punto_reorden:
        punto_reorden !== undefined && punto_reorden !== null ? Number.parseInt(punto_reorden) : 0,
      dias_reabastecimiento:
        dias_reabastecimiento !== undefined && dias_reabastecimiento !== null
          ? Number.parseInt(dias_reabastecimiento)
          : 7,
      unidad_medida_id: unidad_medida_id || null,
      updatedAt: new Date(),
    };

    // Solo agregar categoria_id si existe
    if (finalCategoriaId) {
      createData.categoria_id = finalCategoriaId;
    }

    const inventario = await prisma.inventario.create({
      data: createData,
    });

    // Registrar auditoría
    await AuditSystem.logCRUD(
      'Inventario',
      inventario.id,
      AuditAction.CREATE,
      undefined,
      {
        descripcion: inventario.descripcion,
        categoria: inventario.categoria,
        cantidad: inventario.cantidad,
        precio: inventario.precio,
        estado: inventario.estado,
      },
      req
    );

    return NextResponse.json(
      {
        success: true,
        inventario,
        message: 'Producto creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API INVENTARIO POST] Error:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

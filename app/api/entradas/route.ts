import { AuditSystem } from '@/lib/audit-system';
import { authOptions } from '@/lib/auth';
import { calcularEstadoInventario } from '@/lib/helpers/inventario-estado';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

interface PartidaEntradaData {
  inventario_id: string;
  cantidad: number;
  precio: number;
  numero_lote?: string | null;
  fecha_vencimiento?: string | null;
}

// GET - Obtener entradas de inventario con paginación server-side
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '10');
    const limit = Math.min(Math.max(1, requestedLimit), 100); // Máximo 100 por seguridad
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'fecha_creacion';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // ✅ LÍMITE FIJO: Solo las últimas 30 entradas
    const MAX_ENTRADAS = 30;

    // Construir filtros de búsqueda
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { folio: { contains: search, mode: 'insensitive' } },
        { serie: { contains: search, mode: 'insensitive' } },
        { motivo: { contains: search, mode: 'insensitive' } },
        { observaciones: { contains: search, mode: 'insensitive' } },
        {
          tipos_entrada: {
            nombre: { contains: search, mode: 'insensitive' },
          },
        },
        {
          proveedores: {
            nombre: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // ✅ Validar que no se exceda el límite de 30 entradas
    if (skip >= MAX_ENTRADAS) {
      // Si pide más allá de las 30, retornar vacío
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: MAX_ENTRADAS,
          totalPages: Math.ceil(MAX_ENTRADAS / limit),
          hasNext: false,
          hasPrev: page > 1,
        },
      });
    }

    // Ajustar limit para no exceder MAX_ENTRADAS
    const adjustedLimit = Math.min(limit, MAX_ENTRADAS - skip);

    // Obtener total real de registros (para info, pero limitamos a 30)
    const totalReal = await prisma.entradas_inventario.count({
      where: whereConditions,
    });

    // ✅ El total reportado siempre será máximo 30
    const total = Math.min(totalReal, MAX_ENTRADAS);

    // ✅ Obtener solo las últimas 30 entradas, paginadas
    const entradas = await prisma.entradas_inventario.findMany({
      where: whereConditions,
      include: {
        // ✅ OPTIMIZACIÓN: Solo contar partidas, no cargar todas (reduce payload 90%)
        _count: {
          select: {
            partidas_entrada_inventario: true,
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        tipos_entrada: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            descripcion: true,
            color: true,
            icono: true,
          },
        },
        proveedores: {
          select: {
            id: true,
            nombre: true,
            razon_social: true,
            rfc: true,
          },
        },
      },
      orderBy:
        sortBy === 'folio'
          ? { folio: sortOrder as 'asc' | 'desc' }
          : { [sortBy]: sortOrder as 'asc' | 'desc' },
      skip,
      take: adjustedLimit, // ✅ Usar límite ajustado para no exceder 30 total
    });

    // Transformar la respuesta para que coincida con la interface del frontend
    const entradasTransformadas = entradas.map((entrada: any) => ({
      id: entrada.id,
      folio: entrada.folio,
      serie: entrada.serie,
      fecha_entrada: entrada.fecha_entrada,
      motivo: entrada.motivo,
      observaciones: entrada.observaciones,
      total: Number(entrada.total),
      estado: entrada.estado,
      fecha_creacion: entrada.fecha_creacion,
      fechaCreacion: entrada.fecha_creacion.toISOString(),
      user_id: entrada.user_id,
      almacen_id: entrada.almacen_id,
      tipo_entrada_id: entrada.tipo_entrada_id,
      tipo_entrada_rel: entrada.tipos_entrada,
      tipos_entrada: entrada.tipos_entrada,
      proveedor_id: entrada.proveedor_id,
      proveedor: entrada.proveedores,
      proveedores: entrada.proveedores,
      // ✅ Solo contador de partidas (no datos completos)
      partidas: [], // Lista vacía para compatibilidad
      cantidadPartidas: entrada._count.partidas_entrada_inventario,
    }));

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: entradasTransformadas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/entradas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva entrada de inventario
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requestBody = await request.json();
    const {
      motivo,
      observaciones,
      partidas,
      tipo_entrada_id,
      proveedor_id,
      referencia_externa,
      fecha_captura,
    } = requestBody;

    // Validaciones básicas
    if (!motivo || !partidas || partidas.length === 0) {
      return NextResponse.json(
        { error: 'Motivo y partidas son campos requeridos' },
        { status: 400 }
      );
    }

    // ✅ Validar cantidades negativas en partidas
    for (const partida of partidas) {
      if (!partida.inventario_id || partida.cantidad <= 0) {
        return NextResponse.json(
          { error: 'Todas las partidas deben tener producto y cantidad positiva' },
          { status: 400 }
        );
      }
    }

    // ✅ OPTIMIZACIÓN: Validar productos con una sola query batch (evita N+1)
    const inventarioIds = partidas.map((p: any) => p.inventario_id);
    const productos = await prisma.inventario.findMany({
      where: { id: { in: inventarioIds } },
      select: { id: true, descripcion: true },
    });

    // Crear Map para acceso O(1) en validaciones
    const productosMap = new Map(productos.map((p) => [p.id, p]));

    // Validar en memoria (sin queries adicionales)
    for (const partida of partidas) {
      const producto = productosMap.get(partida.inventario_id);

      if (!producto) {
        return NextResponse.json(
          { error: `Producto con ID ${partida.inventario_id} no encontrado` },
          { status: 400 }
        );
      }
    }

    // Calcular total
    const total = partidas.reduce(
      (sum: number, partida: PartidaEntradaData) => sum + partida.cantidad * partida.precio,
      0
    );

    // Establecer contexto de usuario para auditoría
    // NOTA: Función set_audit_user comentada temporalmente - requiere creación en PostgreSQL
    // if (session.user?.id) {
    //   await prisma.$executeRaw`SELECT set_audit_user(${session.user.id})`;
    // }

    // Usar transacción para crear la entrada y actualizar inventario
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener configuración de folios para entradas
      const configFolios = await tx.config_folios.findUnique({
        where: { tipo: 'entrada' },
      });

      if (!configFolios) {
        throw new Error('Configuración de folios no encontrada');
      }

      // Usar el próximo folio de la configuración
      const folioNumero = configFolios.proximo_folio;
      const folioActual = String(folioNumero); // Convertir a string porque la BD espera String
      const serieActual = configFolios.serie_actual || '';

      // Validar que el folio no esté duplicado
      const folioExiste = await tx.entradas_inventario.findFirst({
        where: {
          folio: folioActual,
          serie: serieActual,
        },
        select: { id: true, folio: true },
      });

      if (folioExiste) {
        throw new Error(
          `El folio ${serieActual ? serieActual + '-' : ''}${folioActual} ya existe. Por favor, elige otro folio.`
        );
      }

      // Procesar fecha_captura: si es solo fecha (YYYY-MM-DD), convertir a medianoche en México
      let fechaEntrada: Date;
      if (fecha_captura) {
        // Si es solo fecha (sin hora), convertir a medianoche en México
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha_captura)) {
          // Crear fecha en zona horaria de México (UTC-6)
          const [year, month, day] = fecha_captura.split('-').map(Number);
          fechaEntrada = new Date(Date.UTC(year, month - 1, day, 6, 0, 0)); // 6 horas = medianoche México
        } else {
          // Si incluye hora, usarla tal cual
          fechaEntrada = new Date(fecha_captura);
        }
      } else {
        // Si no se proporciona, usar la fecha actual
        fechaEntrada = new Date();
      }

      // Crear la entrada con folio y serie
      const entrada = await tx.entradas_inventario.create({
        data: {
          id: `entrada_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          motivo,
          observaciones,
          total,
          estado: 'COMPLETADA',
          user_id: session.user?.id || '',
          tipo_entrada_id: tipo_entrada_id || null,
          proveedor_id: proveedor_id || null,
          referencia_externa: referencia_externa || null,
          serie: serieActual,
          folio: folioActual,
          fecha_creacion: fechaEntrada,
          updatedAt: new Date(),
        },
      });

      // Incrementar el próximo folio
      await tx.config_folios.update({
        where: { tipo: 'entrada' },
        data: {
          proximo_folio: { increment: 1 },
          updated_at: new Date(),
        },
      });

      // =====================================================================
      // OPTIMIZACIÓN: Batch operations para reducir queries de 60 a 5
      // =====================================================================

      // PASO 1: Obtener TODOS los productos de una sola vez
      const inventarioIds = partidas.map((p: any) => p.inventario_id);
      const productos = await tx.inventario.findMany({
        where: { id: { in: inventarioIds } },
        select: {
          id: true,
          descripcion: true,
          cantidad: true,
          fechaVencimiento: true,
        },
      });

      // Crear Map para lookup O(1)
      const productosMap = new Map(productos.map((p) => [p.id, p]));

      // Validar que todos los productos existen
      for (const partida of partidas) {
        if (!productosMap.has(partida.inventario_id)) {
          throw new Error(`Producto ${partida.inventario_id} no encontrado`);
        }
      }

      // PASO 2: Preparar datos para batch operations
      const partidasData = [];
      const productosMovimiento = [];
      const inventarioUpdates = [];

      for (let i = 0; i < partidas.length; i++) {
        const partida = partidas[i];
        const productoBefore = productosMap.get(partida.inventario_id)!;

        // Calcular nueva cantidad y estado
        const nuevaCantidad = productoBefore.cantidad + partida.cantidad;
        const nuevoEstado = calcularEstadoInventario(
          nuevaCantidad,
          productoBefore.fechaVencimiento
        );

        // Preparar data para partida
        partidasData.push({
          id: `partida_entrada_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 11)}`,
          entrada_id: entrada.id,
          inventario_id: partida.inventario_id,
          cantidad: partida.cantidad,
          precio: partida.precio,
          orden: i,
          numero_lote: partida.numero_lote || null,
          fecha_vencimiento: partida.fecha_vencimiento
            ? new Date(partida.fecha_vencimiento)
            : null,
          cantidad_disponible: partida.cantidad,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Preparar update de inventario
        inventarioUpdates.push({
          where: { id: partida.inventario_id },
          data: {
            cantidad: nuevaCantidad,
            estado: nuevoEstado,
            updatedAt: new Date(),
          },
        });

        // Preparar auditoría
        productosMovimiento.push({
          productId: partida.inventario_id,
          productName: productoBefore.descripcion || 'Producto sin descripción',
          quantity: partida.cantidad,
          previousStock: productoBefore.cantidad,
          newStock: nuevaCantidad,
        });
      }

      // PASO 3: Ejecutar TODAS las operaciones en paralelo
      await Promise.all([
        // Crear todas las partidas de una vez
        tx.partidas_entrada_inventario.createMany({
          data: partidasData,
        }),

        // Actualizar todos los inventarios en paralelo
        ...inventarioUpdates.map((update) => tx.inventario.update(update)),
      ]);

      // Registrar auditoría de movimientos de inventario
      if (productosMovimiento.length > 0) {
        await AuditSystem.logInventoryMovement(
          'ENTRADA',
          entrada.id,
          productosMovimiento,
          motivo,
          request
        );
      }

      return entrada;
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Entrada de inventario creada exitosamente',
    });
  } catch (error) {
    // Determinar si es un error de validación (400) o error del servidor (500)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const isValidationError =
      errorMessage.includes('folio') ||
      errorMessage.includes('no encontrado') ||
      errorMessage.includes('requeridos') ||
      errorMessage.includes('Configuración');

    // Log completo para errores técnicos (500), no para validaciones esperadas
    if (isValidationError) {
      console.log('⚠️ Error de validación en POST /api/entradas:', errorMessage);
    } else {
      console.error('❌ Error técnico en POST /api/entradas:', error);
      console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorMessage,
        // Solo enviar stack en desarrollo y para errores técnicos
        ...(process.env.NODE_ENV === 'development' &&
          !isValidationError && {
            stack: error instanceof Error ? error.stack : undefined,
          }),
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

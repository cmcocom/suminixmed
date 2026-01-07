import { AuditSystem } from '@/lib/audit-system';
import { authOptions } from '@/lib/auth';
import { calcularEstadoInventario } from '@/lib/helpers/inventario-estado';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// Límite máximo de salidas a cargar (optimización para rendimiento)
const MAX_SALIDAS = 30;

interface PartidaSalidaData {
  inventarioId: string; // Cambiar de number a string para coincidir con IDs reales
  cantidad: number;
  precio: number;
  lote_entrada_id?: string | null;
  numero_lote?: string | null;
  fecha_vencimiento_lote?: string | null;
}

// Nota: la función getLocalDateTime fue removida porque no se usa actualmente.

// GET - Obtener salidas de inventario con paginación server-side
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Validar límite de 30 salidas máximas
    if (skip >= MAX_SALIDAS) {
      return NextResponse.json({
        salidas: [],
        pagination: {
          page,
          limit,
          total: MAX_SALIDAS,
          totalPages: Math.ceil(MAX_SALIDAS / limit),
          hasMore: false,
        },
      });
    }

    // Ajustar limit para no exceder MAX_SALIDAS
    const adjustedLimit = Math.min(limit, MAX_SALIDAS - skip);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'fecha_creacion';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const tipo = searchParams.get('tipo'); // Permitir filtrar por tipo

    // Construir filtros de búsqueda
    const whereConditions: any = {};

    // Filtro por tipo de salida (si se especifica)
    if (tipo) {
      whereConditions.tipo_salida_id = tipo;
    }

    // Búsqueda en múltiples campos
    if (search) {
      whereConditions.OR = [
        { folio: { contains: search, mode: 'insensitive' } },
        { serie: { contains: search, mode: 'insensitive' } },
        { motivo: { contains: search, mode: 'insensitive' } },
        { observaciones: { contains: search, mode: 'insensitive' } },
        {
          tipos_salida: {
            nombre: { contains: search, mode: 'insensitive' },
          },
        },
        {
          clientes: {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { empresa: { contains: search, mode: 'insensitive' } },
              { clave: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Obtener total de registros limitado a MAX_SALIDAS
    const totalRegistros = await prisma.salidas_inventario.count({
      where: whereConditions,
    });
    const total = Math.min(totalRegistros, MAX_SALIDAS);

    // ✅ OPTIMIZACIÓN: Ordenamiento por folio numérico descendente (mayor a menor)
    // Para millones de registros, es crucial limitar lo que se trae de BD
    let salidas: any[];

    if (sortBy === 'folio' && !search) {
      // CASO 1: Ordenar por folio sin búsqueda (más eficiente con query raw)
      const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';

      // Construir parámetros para query
      const params: any[] = [];
      let whereClause = 'WHERE 1=1';

      if (tipo) {
        whereClause += ` AND tipo_salida_id = $${params.length + 1}`;
        params.push(tipo);
      }

      // Query optimizada para obtener IDs ordenados numéricamente
      const queryText = `
        SELECT id
        FROM salidas_inventario
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN folio ~ '^[0-9]+$' THEN CAST(folio AS INTEGER)
            ELSE 0 
          END ${direction},
          folio ${direction}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;

      params.push(adjustedLimit, skip);

      const resultados = await prisma.$queryRawUnsafe<Array<{ id: string }>>(queryText, ...params);

      const idsOrdenados = resultados.map((r) => r.id);

      // Obtener salidas completas solo para los IDs necesarios
      if (idsOrdenados.length > 0) {
        salidas = await prisma.salidas_inventario.findMany({
          where: { id: { in: idsOrdenados } },
          include: {
            partidas_salida_inventario: {
              select: {
                id: true,
                inventario_id: true,
                cantidad: true,
                precio: true,
                lote_entrada_id: true,
                numero_lote: true,
                fecha_vencimiento_lote: true,
                Inventario: {
                  select: {
                    clave: true,
                    nombre: true,
                    descripcion: true,
                    unidades_medida: {
                      select: {
                        clave: true,
                        nombre: true,
                      },
                    },
                  },
                },
              },
              orderBy: { orden: 'asc' },
            },
            User: {
              select: { name: true, email: true },
            },
            tipos_salida: {
              select: { nombre: true, descripcion: true },
            },
            clientes: {
              select: {
                id: true,
                nombre: true,
                empresa: true,
                rfc: true,
                clave: true,
              },
            },
          },
        });

        // Reordenar según el orden de IDs obtenido
        const ordenMap = new Map(idsOrdenados.map((id, index) => [id, index]));
        salidas.sort((a, b) => (ordenMap.get(a.id) ?? 0) - (ordenMap.get(b.id) ?? 0));
      } else {
        salidas = [];
      }
    } else {
      // CASO 2: Ordenamiento estándar o con búsqueda (usar Prisma normal)
      // Cuando hay búsqueda, Prisma maneja mejor los WHERE complejos
      salidas = await prisma.salidas_inventario.findMany({
        where: whereConditions,
        include: {
          partidas_salida_inventario: {
            select: {
              id: true,
              inventario_id: true,
              cantidad: true,
              precio: true,
              lote_entrada_id: true,
              numero_lote: true,
              fecha_vencimiento_lote: true,
              Inventario: {
                select: {
                  clave: true,
                  nombre: true,
                  descripcion: true,
                  unidades_medida: {
                    select: {
                      clave: true,
                      nombre: true,
                    },
                  },
                },
              },
            },
            orderBy: { orden: 'asc' },
          },
          User: {
            select: { name: true, email: true },
          },
          tipos_salida: {
            select: { nombre: true, descripcion: true },
          },
          clientes: {
            select: {
              id: true,
              nombre: true,
              empresa: true,
              rfc: true,
              clave: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip,
        take: adjustedLimit,
      });
    }

    // Transformar la respuesta para que coincida con la interface del frontend
    const salidasTransformadas = salidas.map((salida: any) => ({
      id: salida.id,
      folio: salida.folio,
      serie: salida.serie,
      fecha_salida: salida.fecha_salida,
      motivo: salida.motivo,
      observaciones: salida.observaciones,
      total: Number(salida.total),
      estado: salida.estado,
      fecha_creacion: salida.fecha_creacion,
      fechaCreacion: salida.fecha_creacion.toISOString(),
      user_id: salida.user_id,
      tipo_salida_id: salida.tipo_salida_id,
      tipo_salida_rel: salida.tipos_salida,
      tipos_salida: salida.tipos_salida,
      cliente: salida.clientes,
      clientes: salida.clientes,
      // Resumen de partidas
      partidas: salida.partidas_salida_inventario.map((partida: any) => ({
        id: partida.id,
        inventarioId: partida.inventario_id,
        inventario_id: partida.inventario_id,
        cantidad: partida.cantidad,
        precio: Number(partida.precio),
        lote_entrada_id: partida.lote_entrada_id,
        numero_lote: partida.numero_lote,
        fecha_vencimiento_lote: partida.fecha_vencimiento_lote
          ? partida.fecha_vencimiento_lote.toISOString()
          : null,
        Inventario: partida.Inventario,
        inventario: partida.Inventario,
        subtotal: partida.cantidad * Number(partida.precio),
      })),
      // Contador de partidas
      cantidadPartidas: salida.partidas_salida_inventario.length,
    }));

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: salidasTransformadas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API SALIDAS GET] Error al obtener salidas:', errorMessage);
    logger.debug(
      '[API SALIDAS GET] Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    return NextResponse.json(
      {
        error: 'Error al obtener las salidas',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

// POST - Crear nueva salida de inventario
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requestBody = await request.json();

    const {
      tipo_salida_id,
      cliente_id,
      observaciones,
      referencia_externa,
      fecha_captura,
      partidas,
      folio: folioManual,
    } = requestBody;

    // Validaciones básicas
    if (!tipo_salida_id || !partidas || partidas.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de salida y partidas son campos requeridos' },
        { status: 400 }
      );
    }

    // ✅ OPTIMIZACIÓN: Validar productos con una sola query batch (evita N+1)
    const inventarioIds = partidas.map((p: any) => p.inventarioId);
    const productos = await prisma.inventario.findMany({
      where: { id: { in: inventarioIds } },
      select: { id: true, cantidad: true, descripcion: true },
    });

    // Crear Map para acceso O(1) en validaciones
    const productosMap = new Map(productos.map((p) => [p.id, p]));

    // Validar en memoria (sin queries adicionales)
    for (const partida of partidas) {
      const producto = productosMap.get(partida.inventarioId);

      if (!producto) {
        return NextResponse.json(
          { error: `Producto con ID ${partida.inventarioId} no encontrado` },
          { status: 400 }
        );
      }

      if (producto.cantidad < partida.cantidad) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para ${producto.descripcion}. Disponible: ${producto.cantidad}, Solicitado: ${partida.cantidad}`,
          },
          { status: 400 }
        );
      }
    }

    // Calcular total
    const total = partidas.reduce(
      (sum: number, partida: PartidaSalidaData) => sum + partida.cantidad * partida.precio,
      0
    );

    // Establecer contexto de usuario para auditoría
    // NOTA: Función set_audit_user comentada temporalmente - requiere creación en PostgreSQL
    // if (session.user?.id) {
    //   await prisma.$executeRaw`SELECT set_audit_user(${session.user.id})`;
    // }

    // Usar transacción para crear la salida y actualizar inventario
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener configuración de folios para salidas
      const configFolios = await tx.config_folios.findUnique({
        where: { tipo: 'salida' },
      });

      if (!configFolios) {
        throw new Error('Configuración de folios no encontrada');
      }

      // ✅ CORRECCIÓN: Usar folio manual si se proporciona, sino usar el automático
      let folioActual: string;
      let debeIncrementarFolio: boolean;

      if (folioManual !== undefined && folioManual !== null) {
        // Usuario proporcionó un folio específico - usarlo tal cual
        folioActual = String(folioManual);
        // NO incrementar el contador automático
        debeIncrementarFolio = false;
      } else {
        // Usar el próximo folio de la configuración (automático)
        const folioNumero = configFolios.proximo_folio;
        folioActual = String(folioNumero);
        // SÍ incrementar el contador
        debeIncrementarFolio = true;
      }

      const serieActual = configFolios.serie_actual || '';

      // Validar que el folio no esté duplicado
      const folioExiste = await tx.salidas_inventario.findFirst({
        where: {
          folio: folioActual,
          serie: serieActual,
        },
        select: { id: true, folio: true },
      });

      if (folioExiste) {
        throw new Error(
          `El folio ${serieActual ? serieActual + '-' : ''}${folioActual} ya existe. Por favor, contacte al administrador.`
        );
      }

      // Procesar fecha_captura
      let fechaCreacion;
      if (fecha_captura) {
        // Verificar si es formato ISO completo (con hora) o solo fecha
        const esFormatoISO = fecha_captura.includes('T');

        if (esFormatoISO) {
          // Fecha y hora completa del cliente (navegador) - usar directamente
          fechaCreacion = new Date(fecha_captura);
        } else {
          // Solo fecha (YYYY-MM-DD) - usuario seleccionó fecha específica
          // Crear fecha a las 00:00 de México (UTC-6)
          const [year, month, day] = fecha_captura.split('-');
          fechaCreacion = new Date(
            Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 6, 0, 0)
          );
        }
      } else {
        // No se envió fecha_captura, usar fecha/hora actual del servidor
        fechaCreacion = new Date();
      }

      // Crear la salida con folio y serie
      const salida = await tx.salidas_inventario.create({
        data: {
          id: `salida_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          motivo: referencia_externa || `Salida ${new Date().toLocaleDateString()}`,
          observaciones: observaciones || '',
          total,
          estado: 'COMPLETADA',
          user_id: session.user?.id || '',
          tipo_salida_id: tipo_salida_id,
          cliente_id: cliente_id || null,
          serie: serieActual,
          folio: folioActual,
          fecha_creacion: fechaCreacion,
          updatedAt: new Date(),
        },
      });

      // ✅ CORRECCIÓN: Solo incrementar si se usó el folio automático
      if (debeIncrementarFolio) {
        await tx.config_folios.update({
          where: { tipo: 'salida' },
          data: {
            proximo_folio: { increment: 1 },
            updated_at: new Date(),
          },
        });
      } else if (folioManual !== undefined && folioManual !== null) {
        // ✅ AJUSTE: Si el folio manual es >= proximo_folio, actualizar para evitar huecos
        const folioNumerico = Number.parseInt(String(folioManual), 10);
        const proximoActual = configFolios.proximo_folio ?? 1;

        if (!Number.isNaN(folioNumerico) && folioNumerico >= proximoActual) {
          const nuevoProximo = folioNumerico + 1;

          await tx.config_folios.update({
            where: { tipo: 'salida' },
            data: {
              proximo_folio: nuevoProximo,
              updated_at: new Date(),
            },
          });

          logger.info(
            `📊 [POST SALIDA] Folio manual ${folioNumerico} >= ${proximoActual}. Ajustado proximo_folio → ${nuevoProximo}`
          );
        }
      }

      // =====================================================================
      // OPTIMIZACIÓN: Batch operations para reducir queries de 60-80 a 5-10
      // =====================================================================

      // PASO 1: Obtener TODOS los productos de una sola vez
      const inventarioIds = partidas.map((p: any) => p.inventarioId);
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
        if (!productosMap.has(partida.inventarioId)) {
          throw new Error(`Producto ${partida.inventarioId} no encontrado`);
        }
      }

      // PASO 2: Obtener TODOS los lotes de una sola vez (si aplica)
      const loteIds = partidas.map((p: PartidaSalidaData) => p.lote_entrada_id).filter(Boolean) as string[];

      const lotesMap = await (async () => {
        if (loteIds.length === 0) {
          return new Map<string, { id: string; cantidad_disponible: number; numero_lote: string | null }>();
        }
        const lotes = await tx.partidas_entrada_inventario.findMany({
          where: { id: { in: loteIds } },
          select: {
            id: true,
            cantidad_disponible: true,
            numero_lote: true,
          },
        });
        return new Map(lotes.map((l) => [l.id, l]));
      })();

      // Validar disponibilidad de lotes (solo si hay lotes)
      if (loteIds.length > 0) {
        for (const partida of partidas) {
          const loteId = partida.lote_entrada_id;
          if (loteId) {
            const lote = lotesMap.get(loteId);
            if (!lote) {
              throw new Error(`Lote ${partida.numero_lote} no encontrado`);
            }
            if (lote.cantidad_disponible < partida.cantidad) {
              throw new Error(
                `Cantidad insuficiente en lote ${lote.numero_lote}. ` +
                  `Disponible: ${lote.cantidad_disponible}, Solicitado: ${partida.cantidad}`
              );
            }
          }
        }
      }

      // PASO 3: Preparar datos para batch operations
      const partidasData = [];
      const productosMovimiento = [];
      const inventarioUpdates = [];
      const loteUpdates = new Map(); // Map para acumular decrementos por lote

      for (let i = 0; i < partidas.length; i++) {
        const partida = partidas[i];
        const productoBefore = productosMap.get(partida.inventarioId)!;

        // Calcular nueva cantidad y estado
        const nuevaCantidad = productoBefore.cantidad - partida.cantidad;
        const nuevoEstado = calcularEstadoInventario(
          nuevaCantidad,
          productoBefore.fechaVencimiento
        );

        // Preparar data para partida
        partidasData.push({
          id: `partida_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 11)}`,
          salida_id: salida.id,
          inventario_id: partida.inventarioId,
          cantidad: partida.cantidad,
          precio: partida.precio,
          orden: i,
          lote_entrada_id: partida.lote_entrada_id || null,
          numero_lote: partida.numero_lote || null,
          fecha_vencimiento_lote: partida.fecha_vencimiento_lote
            ? ((): Date | null => {
                const fv = partida.fecha_vencimiento_lote;
                if (!fv) return null;
                const parts = String(fv).split('-').map(Number);
                if (parts.length === 3) {
                  const [y, m, d] = parts;
                  return new Date(y, m - 1, d, 0, 0, 0, 0);
                }
                return new Date(String(fv));
              })()
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Preparar update de inventario
        inventarioUpdates.push({
          where: { id: partida.inventarioId },
          data: {
            cantidad: nuevaCantidad,
            estado: nuevoEstado,
            updatedAt: new Date(),
          },
        });

        // Acumular decrementos de lotes (si aplica)
        const loteId = partida.lote_entrada_id;
        if (loteId) {
          const decrementoActual = loteUpdates.get(loteId) || 0;
          loteUpdates.set(loteId, decrementoActual + partida.cantidad);
        }

        // Preparar auditoría
        productosMovimiento.push({
          productId: partida.inventarioId,
          productName: productoBefore.descripcion || 'Producto sin descripción',
          quantity: partida.cantidad,
          previousStock: productoBefore.cantidad,
          newStock: nuevaCantidad,
        });
      }

      // PASO 4: Ejecutar TODAS las operaciones en paralelo
      await Promise.all([
        // Crear todas las partidas de una vez
        tx.partidas_salida_inventario.createMany({
          data: partidasData,
        }),

        // Actualizar todos los inventarios en paralelo
        ...inventarioUpdates.map((update) => tx.inventario.update(update)),

        // Actualizar todos los lotes en paralelo
        ...Array.from(loteUpdates.entries()).map(([loteId, decremento]) =>
          tx.partidas_entrada_inventario.update({
            where: { id: loteId },
            data: {
              cantidad_disponible: { decrement: decremento },
              updatedAt: new Date(),
            },
          })
        ),
      ]);

      // Registrar auditoría de movimientos de inventario
      if (productosMovimiento.length > 0) {
        await AuditSystem.logInventoryMovement(
          'SALIDA',
          salida.id,
          productosMovimiento,
          `Salida ${salida.id}`,
          request
        );
      }

      return salida;
    });
    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Salida de inventario creada exitosamente',
    });
  } catch (error) {
    // Determinar si es un error de validación (400) o error del servidor (500)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const isValidationError =
      errorMessage.includes('folio') ||
      errorMessage.includes('Stock insuficiente') ||
      errorMessage.includes('no encontrado') ||
      errorMessage.includes('requeridos');

    // Log solo para errores técnicos (500), no para validaciones esperadas
    if (!isValidationError) {
      logger.error('❌ Error técnico en POST /api/salidas:', error);
      logger.debug('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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

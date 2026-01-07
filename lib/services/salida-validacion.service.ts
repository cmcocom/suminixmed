import { calcularEstadoInventario } from '@/lib/helpers/inventario-estado';
import { prisma } from '@/lib/prisma';
import type { configuracion_salidas } from '@prisma/client';

interface SolicitudPartida {
  id_producto: string;
  cantidad: number;
  precio?: number;
}

interface SolicitudSalida {
  motivo: string;
  observaciones?: string;
  user_id: string;
  partidas: SolicitudPartida[];
}

interface ValidacionProducto {
  producto_id: string;
  producto_nombre: string | null;
  cantidad_solicitada: number;
  cantidad_fondo_fijo: number;
  cantidad_inventario: number;
  resultado: 'completo' | 'exceso' | 'pendiente' | 'sin_fondo';
  cantidad_autorizada: number;
  cantidad_vale: number;
  cantidad_pendiente: number;
}

interface ResultadoValidacion {
  success: boolean;
  error?: string;
  solicitudes_generadas: {
    original?: string;
    vale?: string;
    pendiente?: string;
  };
  validaciones: ValidacionProducto[];
}

export class SalidaValidacionService {
  /**
   * Procesa y valida una solicitud de salida aplicando la lógica compleja
   */
  static async procesarSolicitudSalida(solicitud: SolicitudSalida): Promise<ResultadoValidacion> {
    try {
      // Obtener configuración
      const config = await prisma.configuracion_salidas.findFirst();
      if (!config) {
        throw new Error('No se encontró configuración de salidas');
      }

      const validaciones = [];
      const solicitudesGeneradas: ResultadoValidacion['solicitudes_generadas'] = {};

      // Agrupar partidas por producto para procesar
      const partidasAgrupadas = new Map<string, number>();
      for (const partida of solicitud.partidas) {
        const cantidadActual = partidasAgrupadas.get(partida.id_producto) || 0;
        partidasAgrupadas.set(partida.id_producto, cantidadActual + partida.cantidad);
      }

      // Validar cada producto
      for (const [productoId, cantidadSolicitada] of partidasAgrupadas.entries()) {
        const validacion = await this.validarProducto(
          productoId,
          cantidadSolicitada,
          solicitud.user_id,
          config
        );

        validaciones.push(validacion);
      }

      // Generar solicitudes basadas en las validaciones
      await this.generarSolicitudes(solicitud, validaciones, solicitudesGeneradas);
      return {
        success: true,
        solicitudes_generadas: solicitudesGeneradas,
        validaciones,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        solicitudes_generadas: {},
        validaciones: [],
      };
    }
  }

  /**
   * Valida un producto específico aplicando la lógica de negocio
   */
  private static async validarProducto(
    productoId: string,
    cantidadSolicitada: number,
    userId: string,
    config: configuracion_salidas
  ) {
    // Obtener información del producto
    const producto = await prisma.inventario.findUnique({
      where: { id: productoId },
      select: { id: true, descripcion: true, cantidad: true },
    });

    if (!producto) {
      throw new Error(`Producto ${productoId} no encontrado`);
    }

    // Buscar fondo fijo para este usuario y producto
    const fondoFijo = await prisma.ffijo.findFirst({
      where: {
        id_departamento: userId,
        id_producto: productoId,
        estado: 'activo',
      },
    });

    const cantidadFondoFijo = fondoFijo?.cantidad_disponible || 0;
    const cantidadInventario = producto.cantidad;

    // Aplicar lógica de validación
    let resultado: 'completo' | 'exceso' | 'pendiente' | 'sin_fondo';
    let cantidadAutorizada = 0;
    let cantidadVale = 0;
    let cantidadPendiente = 0;

    if (cantidadFondoFijo === 0) {
      // No hay fondo fijo para este producto
      resultado = 'sin_fondo';
      if (config.permitir_solicitudes_sin_stock) {
        if (cantidadInventario >= cantidadSolicitada) {
          cantidadAutorizada = cantidadSolicitada;
        } else {
          cantidadAutorizada = cantidadInventario;
          cantidadPendiente = cantidadSolicitada - cantidadInventario;
        }
      }
    } else if (cantidadSolicitada <= cantidadFondoFijo) {
      // La solicitud cabe completamente en el fondo fijo
      resultado = 'completo';
      cantidadAutorizada = cantidadSolicitada;
    } else {
      // La solicitud excede el fondo fijo
      const exceso = cantidadSolicitada - cantidadFondoFijo;

      if (cantidadInventario >= cantidadSolicitada) {
        // Hay suficiente inventario para todo
        resultado = 'exceso';
        cantidadAutorizada = cantidadFondoFijo;
        cantidadVale = exceso;
      } else if (cantidadInventario >= cantidadFondoFijo) {
        // Hay inventario para el fondo fijo y algo más
        resultado = 'exceso';
        cantidadAutorizada = cantidadFondoFijo;
        const inventarioDisponibleParaVale = cantidadInventario - cantidadFondoFijo;
        cantidadVale = Math.min(exceso, inventarioDisponibleParaVale);
        cantidadPendiente = exceso - cantidadVale;
      } else {
        // No hay suficiente inventario ni para el fondo fijo
        resultado = 'pendiente';
        cantidadAutorizada = Math.min(cantidadFondoFijo, cantidadInventario);
        cantidadPendiente = cantidadSolicitada - cantidadAutorizada;
      }
    }
    return {
      producto_id: productoId,
      producto_nombre: producto.descripcion,
      cantidad_solicitada: cantidadSolicitada,
      cantidad_fondo_fijo: cantidadFondoFijo,
      cantidad_inventario: cantidadInventario,
      resultado,
      cantidad_autorizada: cantidadAutorizada,
      cantidad_vale: cantidadVale,
      cantidad_pendiente: cantidadPendiente,
    };
  }

  /**
   * Genera las solicitudes de salida basadas en las validaciones
   */
  private static async generarSolicitudes(
    solicitudOriginal: SolicitudSalida,
    validaciones: ValidacionProducto[],
    solicitudesGeneradas: ResultadoValidacion['solicitudes_generadas']
  ) {
    // Generar ID único para vincular las solicitudes
    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-');
    const origenId = `${solicitudOriginal.user_id}-${fechaHora}`;

    // Crear solicitud principal (cantidades autorizadas)
    const partidasPrincipales = validaciones
      .filter((v) => v.cantidad_autorizada > 0)
      .map((v) => ({
        id_producto: v.producto_id,
        cantidad: v.cantidad_autorizada,
        precio: 0,
      }));

    if (partidasPrincipales.length > 0) {
      const solicitudPrincipal = await this.crearSolicitudSalida(
        {
          ...solicitudOriginal,
          partidas: partidasPrincipales,
        },
        'normal',
        'surtido',
        origenId
      );

      solicitudesGeneradas.original = solicitudPrincipal;

      // Actualizar fondos fijos
      await this.actualizarFondosFijos(validaciones, solicitudOriginal.user_id);
    }

    // Crear solicitud de vale (excesos)
    const partidasVale = validaciones
      .filter((v) => v.cantidad_vale > 0)
      .map((v) => ({
        id_producto: v.producto_id,
        cantidad: v.cantidad_vale,
        precio: 0,
      }));

    if (partidasVale.length > 0) {
      const solicitudVale = await this.crearSolicitudSalida(
        {
          motivo: `VALE - ${solicitudOriginal.motivo}`,
          observaciones: `Vale generado automáticamente por exceso de fondo fijo. Solicitud origen: ${origenId}`,
          user_id: solicitudOriginal.user_id,
          partidas: partidasVale,
        },
        'vale',
        'surtido',
        origenId
      );

      solicitudesGeneradas.vale = solicitudVale;
    }

    // Crear solicitud pendiente
    const partidasPendientes = validaciones
      .filter((v) => v.cantidad_pendiente > 0)
      .map((v) => ({
        id_producto: v.producto_id,
        cantidad: v.cantidad_pendiente,
        precio: 0,
      }));

    if (partidasPendientes.length > 0) {
      const solicitudPendiente = await this.crearSolicitudSalida(
        {
          motivo: `PENDIENTE - ${solicitudOriginal.motivo}`,
          observaciones: `Solicitud pendiente por falta de inventario. Solicitud origen: ${origenId}`,
          user_id: solicitudOriginal.user_id,
          partidas: partidasPendientes,
        },
        'pendiente',
        'pendiente_surtido',
        origenId
      );

      solicitudesGeneradas.pendiente = solicitudPendiente;
    }
  }

  /**
   * Crea una solicitud de salida en la base de datos
   */
  private static async crearSolicitudSalida(
    solicitud: SolicitudSalida,
    tipo: string,
    estadoSurtido: string,
    origenId: string
  ): Promise<string> {
    const salidaId = `salida_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const total = solicitud.partidas.reduce((sum, p) => sum + p.cantidad * (p.precio || 0), 0);

    await prisma.salidas_inventario.create({
      data: {
        id: salidaId,
        motivo: solicitud.motivo,
        observaciones: solicitud.observaciones || '',
        total: total,
        estado: 'COMPLETADA',
        user_id: solicitud.user_id,
        tipo_salida: tipo,
        estado_surtido: estadoSurtido,
        solicitud_origen_id: origenId,
        updatedAt: new Date(),
        partidas_salida_inventario: {
          create: solicitud.partidas.map((partida, index) => ({
            id: `partida_${salidaId}_${index}`,
            salida_id: salidaId,
            inventario_id: partida.id_producto,
            cantidad: partida.cantidad,
            precio: partida.precio || 0,
            orden: index,
            updatedAt: new Date(),
          })),
        },
      },
    });

    // Actualizar inventario solo para solicitudes autorizadas (no pendientes)
    if (estadoSurtido === 'surtido') {
      await this.actualizarInventario(solicitud.partidas);
    }
    return salidaId;
  }

  /**
   * Actualiza los fondos fijos después de una salida autorizada
   */
  private static async actualizarFondosFijos(validaciones: ValidacionProducto[], userId: string) {
    for (const validacion of validaciones) {
      if (validacion.cantidad_autorizada > 0 && validacion.cantidad_fondo_fijo > 0) {
        await prisma.ffijo.updateMany({
          where: {
            id_departamento: userId,
            id_producto: validacion.producto_id,
            estado: 'activo',
          },
          data: {
            cantidad_disponible: {
              decrement: Math.min(validacion.cantidad_autorizada, validacion.cantidad_fondo_fijo),
            },
          },
        });
      }
    }
  }

  /**
   * Actualiza el inventario después de una salida
   */
  private static async actualizarInventario(partidas: SolicitudPartida[]) {
    for (const partida of partidas) {
      // Obtener el producto actual para conocer la cantidad y fecha de vencimiento
      const productoActual = await prisma.inventario.findUnique({
        where: { id: partida.id_producto },
        select: { cantidad: true, fechaVencimiento: true },
      });

      if (!productoActual) continue;

      // Calcular nueva cantidad
      const nuevaCantidad = productoActual.cantidad - partida.cantidad;

      // Calcular el nuevo estado basándose en la cantidad
      const nuevoEstado = calcularEstadoInventario(nuevaCantidad, productoActual.fechaVencimiento);

      await prisma.inventario.update({
        where: { id: partida.id_producto },
        data: {
          cantidad: nuevaCantidad,
          estado: nuevoEstado,
        },
      });
    }
  }

  /**
   * Obtiene el resumen de una solicitud procesada
   */
  static async obtenerResumenSolicitud(origenId: string) {
    const solicitudes = await prisma.salidas_inventario.findMany({
      where: {
        solicitud_origen_id: origenId,
      },
      include: {
        partidas_salida_inventario: {
          include: {
            Inventario: {
              select: { descripcion: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      origen_id: origenId,
      total_solicitudes: solicitudes.length,
      solicitudes: solicitudes.map((s) => ({
        id: s.id,
        tipo: s.tipo_salida,
        estado_surtido: s.estado_surtido,
        motivo: s.motivo,
        total: s.total,
        partidas: s.partidas_salida_inventario.map((p) => ({
          producto: p.Inventario.descripcion,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
      })),
    };
  }
}

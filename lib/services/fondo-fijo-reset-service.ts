import { prisma } from '@/lib/prisma';
import type { ffijo, User, Inventario, clientes, configuracion_salidas } from '@prisma/client';

type FondoConRelaciones = ffijo & {
  User: Pick<User, 'name' | 'email'>;
  Inventario: Pick<Inventario, 'descripcion'>;
  clientes: Pick<clientes, 'nombre'> | null;
};

export class FondoFijoResetService {
  /**
   * Ejecuta el reset automático de fondos fijos basado en la configuración
   */
  static async ejecutarResetAutomatico() {
    try {
      // Obtener configuración global
      const config = await prisma.configuracion_salidas.findFirst();

      const diasGlobales = config?.dias_restablecimiento_global || 30;

      // Buscar fondos que necesitan reset
      const hoy = new Date();
      const fondosParaReset = await prisma.ffijo.findMany({
        where: {
          estado: 'activo',
          OR: [
            // Fondos con configuración individual
            {
              AND: [
                { dias_restablecimiento: { gt: 0 } },
                {
                  ultima_fecha_restablecimiento: {
                    lte: FondoFijoResetService.calcularFechaLimite(hoy, 'individual'),
                  },
                },
              ],
            },
            // Fondos sin configuración individual (usar global)
            {
              AND: [
                { dias_restablecimiento: diasGlobales },
                {
                  ultima_fecha_restablecimiento: {
                    lte: FondoFijoResetService.calcularFechaLimite(hoy, 'global', diasGlobales),
                  },
                },
              ],
            },
          ],
        },
        include: {
          User: {
            select: { name: true, email: true },
          },
          Inventario: {
            select: { descripcion: true },
          },
          clientes: {
            select: { nombre: true },
          },
        },
      });

      if (fondosParaReset.length === 0) {
        return { success: true, fondosReset: 0, mensaje: 'No hay fondos para resetear' };
      }

      // Procesar cada fondo
      const resultados = [];
      for (const fondo of fondosParaReset) {
        try {
          await FondoFijoResetService.resetearFondoIndividual(fondo, config);
          resultados.push({
            id: fondo.id_fondo,
            departamento: fondo.User.name || 'Sin nombre',
            producto: fondo.Inventario.descripcion,
            cliente: fondo.clientes?.nombre || 'Sin cliente',
            status: 'success',
          });
        } catch (error) {
          resultados.push({
            id: fondo.id_fondo,
            departamento: fondo.User.name || 'Sin nombre',
            producto: fondo.Inventario.descripcion,
            cliente: fondo.clientes?.nombre || 'Sin cliente',
            status: 'error',
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }

      const exitosos = resultados.filter((r) => r.status === 'success').length;
      const errores = resultados.filter((r) => r.status === 'error').length;

      return {
        success: true,
        fondosReset: exitosos,
        errores,
        resultados,
        mensaje: `Reset automático completado: ${exitosos}/${fondosParaReset.length} fondos procesados`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        mensaje: 'Error durante el proceso de reset automático',
      };
    }
  }

  /**
   * Resetea un fondo individual
   */
  private static async resetearFondoIndividual(
    fondo: FondoConRelaciones,
    config: configuracion_salidas | null
  ) {
    const { acumular_pendientes_con_fijo } = config || { acumular_pendientes_con_fijo: true };

    // Calcular nueva cantidad disponible
    let nuevaCantidadDisponible = fondo.cantidad_asignada;

    if (acumular_pendientes_con_fijo) {
      // Obtener solicitudes pendientes para este fondo
      const solicitudesPendientes = await prisma.salidas_inventario.findMany({
        where: {
          estado_surtido: 'pendiente_surtido',
          tipo_salida: 'pendiente',
          solicitud_origen_id: {
            contains: fondo.id_fondo,
          },
        },
        include: {
          partidas_salida_inventario: {
            where: {
              inventario_id: fondo.id_producto,
            },
          },
        },
      });

      // Sumar cantidades pendientes
      const cantidadPendiente = solicitudesPendientes.reduce((total, solicitud) => {
        return (
          total +
          solicitud.partidas_salida_inventario.reduce((subtotal, partida) => {
            return subtotal + partida.cantidad;
          }, 0)
        );
      }, 0);

      nuevaCantidadDisponible += cantidadPendiente;
    }

    // Actualizar el fondo
    await prisma.ffijo.update({
      where: { id_fondo: fondo.id_fondo },
      data: {
        cantidad_disponible: nuevaCantidadDisponible,
        ultima_fecha_restablecimiento: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calcula la fecha límite para determinar si un fondo necesita reset
   */
  private static calcularFechaLimite(
    fechaActual: Date,
    tipo: 'individual' | 'global',
    diasGlobales?: number
  ): Date {
    const fecha = new Date(fechaActual);

    if (tipo === 'individual') {
      // Para fondos individuales, usaremos una consulta SQL más compleja
      // Por ahora, usamos 30 días como fallback
      fecha.setDate(fecha.getDate() - 30);
    } else {
      fecha.setDate(fecha.getDate() - (diasGlobales || 30));
    }

    return fecha;
  }

  /**
   * Verifica manualmente qué fondos necesitan reset (para debugging)
   */
  static async verificarFondosParaReset() {
    try {
      const config = await prisma.configuracion_salidas.findFirst();
      const diasGlobales = config?.dias_restablecimiento_global || 30;

      const fondos = await prisma.ffijo.findMany({
        where: { estado: 'activo' },
        include: {
          User: { select: { name: true } },
          Inventario: { select: { descripcion: true } },
        },
        orderBy: { ultima_fecha_restablecimiento: 'asc' },
      });

      const hoy = new Date();
      const analisis = fondos.map((fondo) => {
        const diasTranscurridos = Math.floor(
          (hoy.getTime() - new Date(fondo.ultima_fecha_restablecimiento).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const diasConfiguracion = fondo.dias_restablecimiento || diasGlobales;
        const necesitaReset = diasTranscurridos >= diasConfiguracion;

        return {
          id: fondo.id_fondo,
          departamento: fondo.User.name || 'Sin nombre',
          producto: fondo.Inventario.descripcion,
          ultimoReset: fondo.ultima_fecha_restablecimiento,
          diasTranscurridos,
          diasConfiguracion,
          necesitaReset,
          cantidadDisponible: fondo.cantidad_disponible,
          cantidadAsignada: fondo.cantidad_asignada,
        };
      });

      return {
        totalFondos: fondos.length,
        fondosQueNecesitanReset: analisis.filter((f) => f.necesitaReset).length,
        diasGlobalesConfiguracion: diasGlobales,
        analisisDetallado: analisis,
      };
    } catch (error) {
      throw error;
    }
  }
}

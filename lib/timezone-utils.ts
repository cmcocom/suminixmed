/**
 * Utilidades para manejo correcto de zona horaria México (CST, UTC-6)
 *
 * Estos métodos aseguran que las fechas se interpreten correctamente
 * en la zona horaria de México para consultas a la base de datos.
 */

/**
 * Convierte una fecha en formato YYYY-MM-DD a rango UTC para México
 * Considera automáticamente horario de verano (CDT = UTC-5) y estándar (CST = UTC-6)
 *
 * @param fechaString - Fecha en formato YYYY-MM-DD
 * @param esInicio - true para inicio del día (00:00:00), false para fin del día (23:59:59)
 * @returns Date object en UTC ajustado para zona horaria México
 *
 * @example
 * // Para 2025-10-16 inicio del día (horario de verano CDT):
 * convertirFechaMexicoToUTC('2025-10-16', true)
 * // Retorna: 2025-10-16T05:00:00.000Z (2025-10-16 00:00:00 CDT)
 *
 * // Para 2025-12-16 inicio del día (horario estándar CST):
 * convertirFechaMexicoToUTC('2025-12-16', true)
 * // Retorna: 2025-12-16T06:00:00.000Z (2025-12-16 00:00:00 CST)
 */
export function convertirFechaMexicoToUTC(fechaString: string, esInicio: boolean = true): Date {
  // Estrategia: Crear la fecha en UTC simulando como si fuera México,
  // luego usar toLocaleString para confirmar que representa la fecha correcta en México

  if (esInicio) {
    // Para el inicio del día, crear varias opciones de UTC y ver cuál da la fecha correcta en México
    const posiblesUTC = [
      new Date(`${fechaString}T05:00:00.000Z`), // CDT (UTC-5) - horario de verano
      new Date(`${fechaString}T06:00:00.000Z`), // CST (UTC-6) - horario estándar
    ];

    // Verificar cuál da la fecha correcta (00:00:00 en México)
    for (const fechaUTC of posiblesUTC) {
      const enMexico = fechaUTC.toLocaleString('sv-SE', {
        timeZone: 'America/Mexico_City',
      });

      // Si la fecha en México corresponde a las 00:00:00 del día correcto
      if (enMexico.startsWith(fechaString + ' 00:00:00')) {
        return fechaUTC;
      }
    }

    // Fallback: usar CDT (más común en México)
    return new Date(`${fechaString}T05:00:00.000Z`);
  } else {
    // Para el fin del día, necesitamos buscar en el día siguiente UTC
    // porque las 23:59 de México pueden estar al día siguiente en UTC
    const [year, month, day] = fechaString.split('-').map(Number);
    const fechaSiguiente = new Date(year, month - 1, day + 1);
    const fechaSiguienteStr = fechaSiguiente.toISOString().split('T')[0];

    const posiblesUTC = [
      new Date(`${fechaSiguienteStr}T04:59:59.999Z`), // CDT - fin del día México en UTC+1
      new Date(`${fechaSiguienteStr}T05:59:59.999Z`), // CST - fin del día México en UTC+1
    ];

    for (const fechaUTC of posiblesUTC) {
      const enMexico = fechaUTC.toLocaleString('sv-SE', {
        timeZone: 'America/Mexico_City',
      });

      // Si la fecha en México corresponde a las 23:59:59 del día correcto
      if (enMexico.startsWith(fechaString + ' 23:59:59')) {
        return fechaUTC;
      }
    }

    // Fallback: usar CDT
    return new Date(`${fechaSiguienteStr}T04:59:59.999Z`);
  }
}

/**
 * Crea un filtro de rango de fechas para Prisma usando zona horaria México
 *
 * @param fechaInicio - Fecha inicio en formato YYYY-MM-DD (opcional)
 * @param fechaFin - Fecha fin en formato YYYY-MM-DD (opcional)
 * @returns Objeto con filtros gte/lte para usar en Prisma where
 *
 * @example
 * const filtro = crearFiltroFechasMexico('2025-10-16', '2025-10-16');
 * // Retorna: { gte: Date(2025-10-16T06:00:00.000Z), lte: Date(2025-10-17T05:59:59.999Z) }
 *
 * await prisma.salidas_inventario.findMany({
 *   where: {
 *     fecha_creacion: crearFiltroFechasMexico(fechaInicio, fechaFin)
 *   }
 * });
 */
export function crearFiltroFechasMexico(
  fechaInicio?: string | null,
  fechaFin?: string | null
): { gte?: Date; lte?: Date } | undefined {
  if (!fechaInicio && !fechaFin) {
    return undefined;
  }

  const filtro: { gte?: Date; lte?: Date } = {};

  if (fechaInicio) {
    filtro.gte = convertirFechaMexicoToUTC(fechaInicio, true);
  }

  if (fechaFin) {
    filtro.lte = convertirFechaMexicoToUTC(fechaFin, false);
  }

  return filtro;
}

/**
 * Formatea una fecha de la BD a string en zona horaria de México
 *
 * @param fecha - Date object de la base de datos
 * @param formato - 'corto' (dd/MM/yyyy) o 'completo' (dd/MM/yyyy HH:mm)
 * @returns String formateado en zona horaria México
 *
 * @example
 * formatearFechaMexico(new Date('2025-10-16T19:07:49Z'), 'completo')
 * // Retorna: "16/10/2025 13:07" (UTC-6)
 */
export function formatearFechaMexico(
  fecha: Date | string,
  formato: 'corto' | 'completo' = 'completo'
): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;

  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (formato === 'completo') {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }

  return fechaObj.toLocaleString('es-MX', opciones);
}

/**
 * Verifica si una fecha de la BD está dentro de un rango en zona horaria México
 * (Para uso en frontend cuando se filtran arrays)
 *
 * @param fechaBD - Date de la base de datos
 * @param fechaInicio - String YYYY-MM-DD
 * @param fechaFin - String YYYY-MM-DD
 * @returns true si la fecha está en el rango
 */
export function estaEnRangoMexico(
  fechaBD: Date | string,
  fechaInicio?: string | null,
  fechaFin?: string | null
): boolean {
  const fecha = typeof fechaBD === 'string' ? new Date(fechaBD) : fechaBD;

  if (fechaInicio) {
    const inicio = convertirFechaMexicoToUTC(fechaInicio, true);
    if (fecha < inicio) return false;
  }

  if (fechaFin) {
    const fin = convertirFechaMexicoToUTC(fechaFin, false);
    if (fecha > fin) return false;
  }

  return true;
}

/**
 * Convierte una fecha de input HTML (YYYY-MM-DD) a Date considerando zona horaria local
 * SIN conversión a UTC. Útil para comparaciones en frontend.
 *
 * @param fechaString - Fecha del input type="date" (YYYY-MM-DD)
 * @param esInicio - true para 00:00:00, false para 23:59:59
 * @returns Date en hora local
 */
export function crearFechaLocal(fechaString: string, esInicio: boolean = true): Date {
  const [year, month, day] = fechaString.split('-').map(Number);

  if (esInicio) {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
}

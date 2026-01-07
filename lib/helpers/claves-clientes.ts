import { prisma } from '../prisma';

// Tipos para las configuraciones
interface ConfigClaveCliente {
  tipo_cliente: string;
  prefijo: string;
  siguiente_numero: number;
  longitud_clave: number;
}

/**
 * Obtiene la próxima clave disponible para un tipo de cliente
 * Usa transacción para evitar duplicados en concurrencia
 *
 * @param tipoCliente - 'paciente', 'empresa', 'departamento', 'rfc'
 * @param rfc - RFC del cliente (opcional, solo si tipoCliente = 'rfc')
 * @returns La clave generada
 */
export async function obtenerProximaClaveCliente(
  tipoCliente: string = 'paciente',
  rfc: string | null = null
): Promise<string> {
  // Si el tipo es RFC, validar y devolver el RFC limpio
  if (tipoCliente === 'rfc') {
    if (!rfc) {
      throw new Error('Se requiere RFC cuando el tipo de cliente es "rfc"');
    }
    return limpiarRFC(rfc);
  }

  try {
    // Transacción para evitar condiciones de carrera
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener configuración actual con bloqueo
      const config = await tx.$queryRaw<ConfigClaveCliente[]>`
        SELECT tipo_cliente, prefijo, siguiente_numero, longitud_clave
        FROM config_claves_clientes
        WHERE tipo_cliente = ${tipoCliente}
          AND activo = true
        FOR UPDATE
      `;

      if (!config || config.length === 0) {
        throw new Error(`Tipo de cliente "${tipoCliente}" no encontrado o inactivo`);
      }

      const { prefijo, siguiente_numero, longitud_clave } = config[0];

      // 2. Formatear número con ceros a la izquierda
      const numeroFormateado = String(siguiente_numero).padStart(longitud_clave, '0');
      const claveGenerada = `${prefijo}${numeroFormateado}`;

      // 3. Verificar que no exista (por seguridad)
      const existe = await tx.clientes.findFirst({
        where: { clave: claveGenerada },
      });

      if (existe) {
        throw new Error(
          `La clave "${claveGenerada}" ya existe. Posible inconsistencia en consecutivos.`
        );
      }

      // 4. Incrementar consecutivo
      await tx.$executeRaw`
        UPDATE config_claves_clientes
        SET siguiente_numero = siguiente_numero + 1,
            updated_at = NOW()
        WHERE tipo_cliente = ${tipoCliente}
      `;

      return claveGenerada;
    });

    return resultado;
  } catch (error) {
    console.error('Error generando clave:', error);
    throw error;
  }
}

/**
 * Limpia y normaliza un RFC
 *
 * @param rfc - RFC a limpiar
 * @returns RFC limpio y validado
 */
export function limpiarRFC(rfc: string | null | undefined): string {
  if (!rfc) return '';

  // Quitar espacios, guiones, barras diagonales
  const rfcLimpio = rfc
    .replace(/[\s\-\/]/g, '')
    .toUpperCase()
    .trim();

  // Validar longitud (12-13 caracteres)
  if (rfcLimpio.length < 12 || rfcLimpio.length > 13) {
    throw new Error(`RFC inválido: "${rfc}". Debe tener 12 o 13 caracteres.`);
  }

  // Validar formato básico (letras y números)
  if (!/^[A-Z0-9]+$/.test(rfcLimpio)) {
    throw new Error(`RFC inválido: "${rfc}". Solo debe contener letras y números.`);
  }

  return rfcLimpio;
}

/**
 * Valida que una clave no exista en la base de datos
 *
 * @param clave - Clave a validar
 * @param excludeId - ID del cliente a excluir (para ediciones)
 * @returns true si es única, false si ya existe
 */
export async function validarClaveUnica(
  clave: string,
  excludeId: string | null = null
): Promise<boolean> {
  try {
    const cliente = await prisma.clientes.findFirst({
      where: { clave },
      select: { id: true },
    });

    // Si no existe, es única
    if (!cliente) return true;

    // Si existe pero es el mismo cliente que estamos editando, es válida
    if (excludeId && cliente.id === excludeId) return true;

    // Ya existe y es otro cliente
    return false;
  } catch (error) {
    console.error('Error validando clave única:', error);
    return false;
  }
}

/**
 * Valida que un RFC no exista en la base de datos
 *
 * @param rfc - RFC a validar
 * @param excludeId - ID del cliente a excluir (para ediciones)
 * @returns true si es único, false si ya existe
 */
export async function validarRFCUnico(
  rfc: string | null | undefined,
  excludeId: string | null = null
): Promise<boolean> {
  if (!rfc) return true; // RFC vacío es válido (no todos los clientes tienen RFC)

  try {
    const rfcLimpio = limpiarRFC(rfc);

    const cliente = await prisma.clientes.findFirst({
      where: {
        AND: [{ rfc: rfcLimpio }, { rfc: { not: '' } }],
      },
      select: { id: true },
    });

    // Si no existe, es único
    if (!cliente) return true;

    // Si existe pero es el mismo cliente que estamos editando, es válido
    if (excludeId && cliente.id === excludeId) return true;

    // Ya existe y es otro cliente
    return false;
  } catch (error) {
    console.error('Error validando RFC único:', error);
    return false;
  }
}

/**
 * Obtiene información sobre el próximo consecutivo sin generarlo
 * Útil para mostrar preview en formularios
 *
 * @param tipoCliente - 'paciente', 'empresa', 'departamento'
 * @returns Información del próximo consecutivo
 */
export async function previsualizarProximaClave(tipoCliente: string = 'paciente') {
  try {
    const config = await prisma.$queryRaw<ConfigClaveCliente[]>`
      SELECT tipo_cliente, prefijo, siguiente_numero, longitud_clave
      FROM config_claves_clientes
      WHERE tipo_cliente = ${tipoCliente}
        AND activo = true
    `;

    if (!config || config.length === 0) {
      return {
        error: `Tipo "${tipoCliente}" no configurado`,
        proximaClave: null,
      };
    }

    const { prefijo, siguiente_numero, longitud_clave } = config[0];
    const numeroFormateado = String(siguiente_numero).padStart(longitud_clave, '0');
    const proximaClave = `${prefijo}${numeroFormateado}`;

    return {
      tipoCliente,
      prefijo: prefijo || '(sin prefijo)',
      siguienteNumero: siguiente_numero,
      longitudClave: longitud_clave,
      proximaClave,
      error: null,
    };
  } catch (error) {
    console.error('Error previsualizando clave:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      error: errorMessage,
      proximaClave: null,
    };
  }
}

/**
 * Resetea el consecutivo de un tipo de cliente a un valor específico
 * ⚠️ USAR CON PRECAUCIÓN - Solo en migraciones o correcciones
 *
 * @param tipoCliente - Tipo de cliente
 * @param nuevoConsecutivo - Nuevo valor del consecutivo
 * @returns Resultado de la operación
 */
export async function resetearConsecutivo(tipoCliente: string, nuevoConsecutivo: number) {
  try {
    // Validar que el nuevo consecutivo sea mayor al actual
    const config = await prisma.$queryRaw<Array<{ siguiente_numero: number }>>`
      SELECT siguiente_numero
      FROM config_claves_clientes
      WHERE tipo_cliente = ${tipoCliente}
    `;

    if (!config || config.length === 0) {
      throw new Error(`Tipo "${tipoCliente}" no encontrado`);
    }

    const actualConsecutivo = config[0].siguiente_numero;

    if (nuevoConsecutivo <= actualConsecutivo) {
      console.warn(
        `⚠️ ADVERTENCIA: El nuevo consecutivo (${nuevoConsecutivo}) es menor o igual al actual (${actualConsecutivo})`
      );
    }

    await prisma.$executeRaw`
      UPDATE config_claves_clientes
      SET siguiente_numero = ${nuevoConsecutivo},
          updated_at = NOW()
      WHERE tipo_cliente = ${tipoCliente}
    `;

    return {
      success: true,
      tipoCliente,
      consecutivoAnterior: actualConsecutivo,
      nuevoConsecutivo,
      mensaje: `Consecutivo actualizado: ${actualConsecutivo} → ${nuevoConsecutivo}`,
    };
  } catch (error) {
    console.error('Error reseteando consecutivo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Export individual de funciones
export default {
  obtenerProximaClaveCliente,
  limpiarRFC,
  validarClaveUnica,
  validarRFCUnico,
  previsualizarProximaClave,
  resetearConsecutivo,
};

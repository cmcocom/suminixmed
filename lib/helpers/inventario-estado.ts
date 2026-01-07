/**
 * Helper para calcular el estado de un producto basándose en su cantidad
 */
export function calcularEstadoInventario(
  cantidad: number,
  fechaVencimiento?: Date | null
): 'disponible' | 'agotado' | 'vencido' {
  // Si está vencido, tiene prioridad
  if (fechaVencimiento && new Date(fechaVencimiento) < new Date()) {
    return 'vencido';
  }

  // Si no tiene cantidad, está agotado
  if (cantidad <= 0) {
    return 'agotado';
  }

  // En cualquier otro caso, está disponible
  return 'disponible';
}

/**
 * Datos para actualizar inventario con estado automático
 */
export function prepararActualizacionInventario(data: {
  cantidad?: number;
  fechaVencimiento?: Date | null;
  estado?: string;
}) {
  const updateData: any = { ...data };

  // Si se proporciona cantidad o fechaVencimiento, recalcular estado
  if (data.cantidad !== undefined || data.fechaVencimiento !== undefined) {
    const cantidad = data.cantidad ?? 0;
    const fechaVencimiento = data.fechaVencimiento;
    updateData.estado = calcularEstadoInventario(cantidad, fechaVencimiento);
  }

  return updateData;
}

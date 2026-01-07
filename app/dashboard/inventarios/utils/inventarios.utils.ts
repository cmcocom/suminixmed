/**
 * @fileoverview Funciones Utilitarias para Inventarios Físicos
 * @description Helpers y funciones de apoyo para el módulo
 * @date 2025-10-07
 */

import type {
  InventarioFisico,
  InventarioFisicoDetalle,
  EstadisticasInventario,
} from './inventarios.types';
import { ESTADOS_INVENTARIO } from './inventarios.constants';

/**
 * Filtra inventarios según término de búsqueda
 */
export function filterInventarios(
  inventarios: InventarioFisico[],
  searchTerm: string,
  showAll: boolean
): InventarioFisico[] {
  let filtered = inventarios;

  if (!showAll) {
    filtered = filtered.filter((inv) => inv.estado !== 'CANCELADO');
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.nombre.toLowerCase().includes(term) ||
        inv.descripcion?.toLowerCase().includes(term) ||
        inv.User?.name?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Calcula paginación
 */
export function calculatePagination<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): { totalPages: number; paginatedItems: T[] } {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return { totalPages, paginatedItems };
}

/**
 * Formatea fecha a string legible
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea fecha corta
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Obtiene configuración de estado
 */
export function getEstadoConfig(estado: string) {
  return (
    ESTADOS_INVENTARIO[estado as keyof typeof ESTADOS_INVENTARIO] || {
      value: estado,
      label: estado,
      color: 'bg-gray-100 text-gray-800',
      icon: '❓',
    }
  );
}

/**
 * Calcula diferencia entre cantidades
 */
export function calcularDiferencia(
  cantidadContada: number | null,
  cantidadSistema: number
): number | null {
  if (cantidadContada === null) return null;
  return cantidadContada - cantidadSistema;
}

/**
 * Obtiene clase de color según diferencia
 */
export function getDiferenciaColor(diferencia: number | null): string {
  if (diferencia === null) return 'text-gray-400';
  if (diferencia > 0) return 'text-green-600';
  if (diferencia < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Formatea número con signo
 */
export function formatDiferencia(diferencia: number | null): string {
  if (diferencia === null) return '-';
  if (diferencia === 0) return '0';
  return diferencia > 0 ? `+${diferencia}` : `${diferencia}`;
}

/**
 * Calcula estadísticas del inventario
 */
export function calcularEstadisticas(detalles: InventarioFisicoDetalle[]): EstadisticasInventario {
  const totalProductos = detalles.length;
  const productosContados = detalles.filter((d) => d.cantidad_contada !== null).length;
  const productosPendientes = totalProductos - productosContados;

  const diferenciasPositivas = detalles.filter(
    (d) => d.diferencia !== null && d.diferencia !== undefined && d.diferencia > 0
  ).length;

  const diferenciasNegativas = detalles.filter(
    (d) => d.diferencia !== null && d.diferencia !== undefined && d.diferencia < 0
  ).length;

  const sinDiferencias = detalles.filter(
    (d) => d.diferencia !== null && d.diferencia !== undefined && d.diferencia === 0
  ).length;

  return {
    totalProductos,
    productosContados,
    productosPendientes,
    diferenciasPositivas,
    diferenciasNegativas,
    sinDiferencias,
  };
}

/**
 * Valida si se puede finalizar un inventario
 */
export function canFinalize(detalles: InventarioFisicoDetalle[]): boolean {
  if (detalles.length === 0) return false;
  return detalles.every((d) => d.cantidad_contada !== null);
}

/**
 * Valida si se pueden aplicar ajustes
 */
export function canApplyAdjustments(
  inventario: InventarioFisico,
  detalles: InventarioFisicoDetalle[]
): boolean {
  if (inventario.estado !== 'FINALIZADO') return false;
  const hayDiferencias = detalles.some((d) => d.diferencia !== null && d.diferencia !== 0);
  const hayNoAjustados = detalles.some((d) => !d.ajustado);
  return hayDiferencias && hayNoAjustados;
}

/**
 * Ordena detalles por nombre de producto
 */
export function sortDetallesByProductName(
  detalles: InventarioFisicoDetalle[]
): InventarioFisicoDetalle[] {
  return [...detalles].sort((a, b) => {
    const nameA = a.producto?.nombre || '';
    const nameB = b.producto?.nombre || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Genera ID único
 */
export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

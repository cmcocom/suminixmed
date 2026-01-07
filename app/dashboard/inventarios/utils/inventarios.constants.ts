/**
 * @fileoverview Constantes para Inventarios Físicos
 * @description Configuraciones y valores constantes del módulo
 * @date 2025-10-07
 */

// Estados de inventario físico
export const ESTADOS_INVENTARIO = {
  EN_PROCESO: {
    value: 'EN_PROCESO',
    label: 'En Proceso',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🔄',
  },
  FINALIZADO: {
    value: 'FINALIZADO',
    label: 'Finalizado',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  CANCELADO: {
    value: 'CANCELADO',
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
} as const;

// Configuración de paginación
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 10,
  DETALLES_PER_PAGE: 20,
} as const;

// Valores por defecto del formulario
export const DEFAULT_FORM_DATA = {
  nombre: '',
  descripcion: '',
  almacen_id: '',
} as const;

// Colores para diferencias
export const DIFERENCIA_COLORS = {
  positiva: 'text-green-600',
  negativa: 'text-red-600',
  neutral: 'text-gray-600',
} as const;

// Mensajes del sistema
export const MESSAGES = {
  SUCCESS: {
    CREATE: 'Inventario físico creado exitosamente',
    UPDATE: 'Inventario actualizado correctamente',
    DELETE: 'Inventario eliminado correctamente',
    FINALIZE: 'Inventario finalizado correctamente',
    APPLY_ADJUSTMENTS: 'Ajustes aplicados exitosamente',
  },
  ERROR: {
    GENERIC: 'Ha ocurrido un error. Por favor, intenta nuevamente',
    LOAD: 'Error al cargar los datos',
    CREATE: 'Error al crear el inventario',
    UPDATE: 'Error al actualizar el inventario',
    DELETE: 'Error al eliminar el inventario',
    FINALIZE: 'Error al finalizar el inventario',
    APPLY_ADJUSTMENTS: 'Error al aplicar ajustes',
    NO_PRODUCTS: 'No hay productos para inventariar',
  },
  CONFIRM: {
    DELETE: '¿Estás seguro de eliminar este inventario?',
    FINALIZE: '¿Confirmas finalizar este inventario? No podrás modificarlo después',
    APPLY_ADJUSTMENTS: '¿Aplicar los ajustes de stock? Esta acción actualizará el inventario',
  },
} as const;

// Configuración de validaciones
export const VALIDATION = {
  NOMBRE_MIN_LENGTH: 3,
  NOMBRE_MAX_LENGTH: 200,
  DESCRIPCION_MAX_LENGTH: 500,
} as const;

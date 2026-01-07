/**
 * Constantes para el módulo de entradas de inventario
 * Incluye mapeo de colores, configuraciones y valores por defecto
 */

/**
 * Mapeo estático de colores para Tailwind CSS
 * NOTA: Estos colores están hardcodeados para Tailwind y deben estar en el CSS compilado
 */
export const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    ring: 'focus:ring-blue-500',
    border: 'border-blue-300',
  },
  green: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    ring: 'focus:ring-green-500',
    border: 'border-green-300',
  },
  red: {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
    ring: 'focus:ring-red-500',
    border: 'border-red-300',
  },
  yellow: {
    bg: 'bg-yellow-600',
    hover: 'hover:bg-yellow-700',
    ring: 'focus:ring-yellow-500',
    border: 'border-yellow-300',
  },
  purple: {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-700',
    ring: 'focus:ring-purple-500',
    border: 'border-purple-300',
  },
  indigo: {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-700',
    ring: 'focus:ring-indigo-500',
    border: 'border-indigo-300',
  },
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 8,
  MAX_DROPDOWN_ITEMS: 5,
} as const;

/**
 * Orden de campos para navegación con teclado
 */
export const CAMPO_NAVIGATION_ORDER = ['inventarioId', 'cantidad', 'precio'] as const;

/**
 * Selectores CSS para navegación automática
 */
export const CSS_SELECTORS = {
  PROVEEDOR_INPUT: 'input[name="proveedor"]',
  REFERENCIA_INPUT: 'input[name="referencia_externa"]',
  OBSERVACIONES_TEXTAREA: 'textarea[name="observaciones"]',
  PRODUCTO_SEARCH: 'input[placeholder="Buscar producto..."]',
  PARTIDA_FIELD: (partidaId: string, campo: string) =>
    `[data-partida-id="${partidaId}"][data-campo="${campo}"]`,
} as const;

/**
 * Mensajes de error por defecto
 */
export const ERROR_MESSAGES = {
  TIPO_ENTRADA_REQUIRED: 'Debe seleccionar un tipo de entrada',
  PROVEEDOR_REQUIRED: 'Debe seleccionar un proveedor',
  PARTIDAS_REQUIRED: 'Debe agregar al menos una partida',
  PARTIDAS_INVALID: 'Debe tener al menos una partida válida',
  CONEXION_ERROR: 'Error de conexión',
  GUARDAR_ERROR: 'Error al guardar la entrada',
} as const;

/**
 * Configuración de timeouts y delays
 */
export const TIMING_CONFIG = {
  AUTO_NAVIGATE_DELAY: 50,
  FOCUS_DELAY: 100,
  SEARCH_DEBOUNCE: 300,
} as const;

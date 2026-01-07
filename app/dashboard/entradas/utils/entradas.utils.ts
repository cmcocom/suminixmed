/**
 * Funciones utilitarias para el módulo de entradas de inventario
 * Incluye validaciones, formateo, cálculos y helpers
 */

import { toast } from 'react-hot-toast';
import { COLOR_CLASSES, ERROR_MESSAGES } from './entradas.constants';
import type {
  EntradaInventario,
  FormData,
  FormErrors,
  Inventario,
  PartidaEntrada,
  Proveedor,
  TipoEntrada,
} from './entradas.types';

/**
 * Obtiene las clases CSS para un color específico
 * @param color - Color a mapear
 * @returns Objeto con clases CSS de Tailwind
 */
export const getColorClasses = (color: string) => {
  return COLOR_CLASSES[color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue;
};

/**
 * Valida el formulario de entrada
 * @param formData - Datos del formulario
 * @returns Objeto con errores encontrados
 */
export const validateEntradaForm = (formData: FormData): FormErrors => {
  const errores: FormErrors = {};

  if (!formData.tipo_entrada) {
    errores.tipo_entrada = ERROR_MESSAGES.TIPO_ENTRADA_REQUIRED;
  }

  if (!formData.proveedor_id) {
    errores.proveedor_id = ERROR_MESSAGES.PROVEEDOR_REQUIRED;
  }

  if (formData.partidas.length === 0) {
    errores.partidas = ERROR_MESSAGES.PARTIDAS_REQUIRED;
  } else {
    const partidasValidas = formData.partidas.filter(
      (p) => p.inventarioId > 0 && p.cantidad > 0 && p.precio >= 0
    );
    if (partidasValidas.length === 0) {
      errores.partidas = ERROR_MESSAGES.PARTIDAS_INVALID;
    }
  }

  return errores;
};

/**
 * Crea una partida vacía con valores por defecto
 * @param orden - Orden de la partida en la lista
 * @returns Nueva partida inicializada
 */
export const createEmptyPartida = (orden: number = 0): PartidaEntrada => ({
  id: `partida_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  inventarioId: 0,
  nombre: '',
  cantidad: 1,
  precio: 0,
  orden,
  bloqueada: false,
});

/**
 * Crea un formulario inicial basado en el tipo de entrada
 * @param tipo - Tipo de entrada seleccionado
 * @returns FormData inicializado
 */
export const createInitialFormData = (tipo: string = ''): FormData => ({
  tipo_entrada: tipo,
  proveedor_id: '',
  referencia_externa: '',
  observaciones: '',
  partidas: [createEmptyPartida(0)],
});

/**
 * Calcula el total de las partidas
 * @param partidas - Array de partidas
 * @returns Total calculado
 */
export const calculateTotal = (partidas: PartidaEntrada[]): number => {
  return partidas.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
};

/**
 * Filtra partidas válidas para envío al backend
 * @param partidas - Array de partidas
 * @returns Partidas válidas para envío
 */
export const getValidPartidas = (partidas: PartidaEntrada[]) => {
  return partidas
    .filter((p) => p.inventarioId > 0 && p.cantidad > 0 && p.precio >= 0)
    .map((p) => ({
      inventarioId: p.inventarioId,
      cantidad: p.cantidad,
      precio: p.precio,
    }));
};

/**
 * Filtra proveedores por término de búsqueda
 * @param proveedores - Array de proveedores
 * @param searchTerm - Término de búsqueda
 * @returns Proveedores filtrados
 */
/**
 * Normaliza un término de búsqueda potencialmente inválido
 * Acepta strings, numbers y objetos con value/target.value (como eventos)
 */
const normalizeSearchTerm = (term: unknown): string => {
  // Protección absoluta contra undefined/null
  if (term === null || term === undefined) {
    return '';
  }

  if (typeof term === 'string') {
    return term.trim();
  }

  if (typeof term === 'number') {
    return String(term).trim();
  }

  if (typeof term === 'boolean') {
    return '';
  }

  // Solo procesar objetos válidos
  if (typeof term === 'object') {
    try {
      const withValue = term as { value?: unknown };
      if (
        withValue.value !== null &&
        withValue.value !== undefined &&
        typeof withValue.value === 'string'
      ) {
        return withValue.value.trim();
      }

      const withTarget = term as { target?: { value?: unknown } };
      if (
        withTarget.target?.value !== null &&
        withTarget.target?.value !== undefined &&
        typeof withTarget.target.value === 'string'
      ) {
        return withTarget.target.value.trim();
      }
    } catch {
      // Si hay cualquier error, devolver vacío
      return '';
    }
  }

  return '';
};

const stringIncludes = (value: unknown, search: string): boolean => {
  if (value === null || value === undefined || typeof value !== 'string') {
    return false;
  }
  try {
    return value.toLowerCase().includes(search);
  } catch {
    return false;
  }
};

export const filterProveedores = (proveedores: Proveedor[], searchTerm: unknown): Proveedor[] => {
  if (!Array.isArray(proveedores)) return [];

  const normalizedSearch = normalizeSearchTerm(searchTerm);
  if (!normalizedSearch) return proveedores;

  const searchLower = normalizedSearch.toLowerCase();

  return proveedores.filter(
    (proveedor) => proveedor.activo && stringIncludes(proveedor.nombre, searchLower)
  );
};

/**
 * Filtra inventarios por término de búsqueda
 * @param inventarios - Array de inventarios
 * @param searchTerm - Término de búsqueda
 * @returns Inventarios filtrados
 */
export const filterInventarios = (inventarios: Inventario[], searchTerm: unknown): Inventario[] => {
  // Validaciones robustas
  if (!Array.isArray(inventarios)) return [];

  const normalizedSearch = normalizeSearchTerm(searchTerm);
  if (!normalizedSearch) return inventarios;

  const searchLower = normalizedSearch.toLowerCase();

  return inventarios.filter((inventario) => {
    // Validar que el inventario tenga la estructura correcta
    if (!inventario || typeof inventario !== 'object') return false;

    // Buscar en múltiples campos: descripción, nombre, claves, código de barras
    return (
      stringIncludes(inventario.descripcion, searchLower) ||
      stringIncludes(inventario.nombre, searchLower) ||
      stringIncludes(inventario.clave, searchLower) ||
      stringIncludes(inventario.clave2, searchLower) ||
      stringIncludes(inventario.codigo_barras, searchLower)
    );
  });
};

/**
 * Filtra entradas por término de búsqueda
 * @param entradas - Array de entradas
 * @param searchTerm - Término de búsqueda
 * @param showAll - Si debe mostrar todas las entradas
 * @returns Entradas filtradas
 */
export const filterEntradas = (
  entradas: EntradaInventario[],
  searchTerm: string,
  showAll: boolean
): EntradaInventario[] => {
  if (!Array.isArray(entradas)) return [];

  const safeSearchTerm = searchTerm || '';

  if (!showAll && safeSearchTerm.trim() === '') {
    return [];
  }

  if (showAll && safeSearchTerm.trim() === '') {
    return entradas;
  }

  if (safeSearchTerm.trim() !== '') {
    const searchLower = safeSearchTerm.toLowerCase().trim();
    return entradas.filter((entrada) => {
      if (!entrada || typeof entrada !== 'object') return false;

      try {
        return (
          (entrada.motivo &&
            typeof entrada.motivo === 'string' &&
            entrada.motivo.toLowerCase().includes(searchLower)) ||
          (entrada.observaciones &&
            typeof entrada.observaciones === 'string' &&
            entrada.observaciones.toLowerCase().includes(searchLower))
        );
      } catch {
        return false;
      }
    });
  }

  return [];
};

/**
 * Calcula la paginación para las entradas
 * @param entradas - Array de entradas filtradas
 * @param currentPage - Página actual
 * @param itemsPerPage - Items por página
 * @returns Datos de paginación
 */
export const calculatePagination = (
  entradas: EntradaInventario[],
  currentPage: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(entradas.length / itemsPerPage);
  const paginatedEntradas = entradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    totalPages,
    paginatedEntradas,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    totalItems: entradas.length,
  };
};

/**
 * Muestra mensaje de éxito al guardar una entrada
 * @param tipoEntrada - Configuración del tipo de entrada
 */
export const showSuccessMessage = (tipoEntrada?: TipoEntrada) => {
  toast.success(`✅ ${tipoEntrada?.label || 'Entrada'} registrada exitosamente!`);
};

/**
 * Muestra mensaje de error
 * @param error - Error a mostrar
 */
export const showErrorMessage = (error: string) => {
  toast.error(error || ERROR_MESSAGES.GUARDAR_ERROR);
};

/**
 * Reordena las partidas después de un drag & drop
 * @param partidas - Array de partidas
 * @param fromIndex - Índice origen
 * @param toIndex - Índice destino
 * @returns Array reordenado
 */
export const reorderPartidas = (
  partidas: PartidaEntrada[],
  fromIndex: number,
  toIndex: number
): PartidaEntrada[] => {
  const result = [...partidas];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Actualizar orden
  result.forEach((p, i) => (p.orden = i));

  return result;
};

/**
 * Formatea una fecha para mostrar
 * @param dateString - Fecha en string
 * @returns Fecha formateada
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Formatea un precio para mostrar
 * @param price - Precio a formatear
 * @returns Precio formateado
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Trunca un texto si es muy largo
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Verifica si una estructura de respuesta API es válida
 * @param data - Datos de respuesta
 * @returns Array de datos extraído
 */
export const extractApiData = (data: unknown): unknown[] => {
  if (Array.isArray(data)) {
    return data;
  } else if (
    data &&
    typeof data === 'object' &&
    'inventarios' in data &&
    Array.isArray((data as { inventarios: unknown[] }).inventarios)
  ) {
    return (data as { inventarios: unknown[] }).inventarios;
  } else if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown[] }).data)
  ) {
    return (data as { data: unknown[] }).data;
  } else {
    return [];
  }
};

/**
 * Logging helpers para debug
 */
export const logApiCall = (
  _endpoint: string,
  status: 'start' | 'success' | 'error',
  data?: unknown
) => {
  const emoji = status === 'start' ? '🔄' : status === 'success' ? '✅' : '❌';
  const message = status === 'start' ? 'Cargando' : status === 'success' ? 'Éxito' : 'Error';
  // Usar variables para evitar warnings si el hook/tooling no las usa directamente
  void emoji;
  void message;
  void data;
};

/**
 * NOTA: Oportunidades de optimización backend identificadas:
 *
 * 1. CÁLCULO DE TOTALES:
 *    - Actualmente: calculateTotal() en frontend
 *    - Sugerencia: Mover a stored procedure o función de BD
 *    - Beneficio: Atomicidad, consistencia, menos transferencia de datos
 *
 * 2. VALIDACIONES:
 *    - Actualmente: validateEntradaForm() duplicada frontend/backend
 *    - Sugerencia: Centralizar en triggers de BD o validaciones server-side
 *    - Beneficio: Única fuente de verdad, mejor seguridad
 *
 * 3. FILTROS Y BÚSQUEDAS:
 *    - Actualmente: filterInventarios(), filterProveedores() en frontend
 *    - Sugerencia: Parámetros de búsqueda en API endpoints
 *    - Beneficio: Mejor performance, menos datos transferidos
 *
 * 4. PAGINACIÓN:
 *    - Actualmente: calculatePagination() client-side
 *    - Sugerencia: Paginación server-side con LIMIT/OFFSET
 *    - Beneficio: Escalabilidad, menor uso de memoria
 *
 * Cambios necesarios para implementar optimizaciones backend:
 * - Modificar endpoints API para aceptar parámetros de filtro
 * - Crear stored procedures para cálculos complejos
 * - Implementar paginación server-side en controladores
 * - Crear triggers para validaciones automáticas
 */

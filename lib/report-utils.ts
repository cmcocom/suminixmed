/**
 * Utilidades para reportes de inventario
 * Centralizan lógica de formateo, cálculos y validaciones
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 */

// Interfaces extraídas del archivo original para mantener tipado
export interface Inventario {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  cantidad: number;
  precio: number;
  proveedor: string | null;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  estado: string;
  imagen: string | null;
  createdAt: string;
  updatedAt: string;
  categoriaRelacion?: {
    id: string;
    nombre: string;
  };
}

export interface Categoria {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface ReportFilters {
  categoria: string;
  estado: string;
  fechaIngresoDesde: string;
  fechaIngresoHasta: string;
  fechaVencimientoDesde: string;
  fechaVencimientoHasta: string;
  proveedor: string;
  cantidadMinima: number | '';
  cantidadMaxima: number | '';
  precioMinimo: number | '';
  precioMaximo: number | '';
}

// Función para normalizar texto removiendo acentos - REUTILIZADA desde página original
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Formateo de fechas para reportes - aprovecha utils existentes pero optimiza para MX
export const formatDateMX = (date: string | Date | null): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-MX');
};

// Formateo de precios para México - extiende formatPrice existente
export const formatPriceMX = (price: number): string => {
  return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
};

// Cálculo de valor total del inventario
export const calculateInventoryValue = (items: Inventario[]): number => {
  return items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);
};

// Identificar items con stock bajo (configurable, por defecto 10)
export const getLowStockItems = (items: Inventario[], threshold: number = 10): Inventario[] => {
  return items.filter((item) => item.cantidad <= threshold);
};

// Identificar items vencidos
export const getExpiredItems = (items: Inventario[]): Inventario[] => {
  const now = new Date();
  return items.filter((item) => item.fechaVencimiento && new Date(item.fechaVencimiento) < now);
};

// Calcular estadísticas del inventario - CENTRALIZADO para evitar duplicación
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  expiredCount: number;
  availableCount: number;
  outOfStockCount: number;
}

export const calculateInventoryStats = (items: Inventario[]): InventoryStats => {
  const lowStockItems = getLowStockItems(items);
  const expiredItems = getExpiredItems(items);

  return {
    totalItems: items.length,
    totalValue: calculateInventoryValue(items),
    lowStockCount: lowStockItems.length,
    expiredCount: expiredItems.length,
    availableCount: items.filter((item) => item.estado === 'disponible').length,
    outOfStockCount: items.filter((item) => item.estado === 'agotado').length,
  };
};

// Estados disponibles - CONSTANTE reutilizable
export const ESTADOS_DISPONIBLES = [
  'disponible',
  'agotado',
  'reservado',
  'dañado',
  'vencido',
] as const;

export type EstadoInventario = (typeof ESTADOS_DISPONIBLES)[number];

// Configuración de columnas por defecto - EXTRAÍDA de página original
export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'nombre', label: 'Producto', enabled: true },
  { key: 'cantidad', label: 'Cantidad', enabled: true },
  { key: 'estado', label: 'Estado', enabled: true },
  { key: 'fechaIngreso', label: 'Fecha Ingreso', enabled: true },
  { key: 'fechaVencimiento', label: 'Fecha Vencimiento', enabled: true },
  { key: 'categoria', label: 'Categoría', enabled: false },
  { key: 'precio', label: 'Precio Unit.', enabled: false },
  { key: 'valorTotal', label: 'Valor Total', enabled: false },
  { key: 'proveedor', label: 'Proveedor', enabled: false },
  { key: 'descripcion', label: 'Descripción', enabled: false },
];

// Función para obtener CSS class del estado - CENTRALIZADA
export const getEstadoClasses = (estado: string): string => {
  switch (estado) {
    case 'disponible':
      return 'bg-green-100 text-green-800';
    case 'agotado':
      return 'bg-red-100 text-red-800';
    case 'reservado':
      return 'bg-yellow-100 text-yellow-800';
    case 'dañado':
      return 'bg-red-100 text-red-800';
    case 'vencido':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Función para renderizar valor de celda - EXTRAÍDA y optimizada
export const renderCellValue = (item: Inventario, columnKey: string): React.ReactNode | string => {
  switch (columnKey) {
    case 'nombre':
      return item.descripcion;
    case 'categoria':
      return item.categoriaRelacion?.nombre || item.categoria;
    case 'cantidad':
      return item.cantidad;
    case 'precio':
      return formatPriceMX(item.precio);
    case 'valorTotal':
      return formatPriceMX(item.cantidad * item.precio);
    case 'proveedor':
      return item.proveedor || '-';
    case 'estado':
      return item.estado;
    case 'fechaIngreso':
      return formatDateMX(item.fechaIngreso);
    case 'fechaVencimiento':
      return formatDateMX(item.fechaVencimiento);
    case 'descripcion':
      return item.descripcion || '-';
    default:
      return '-';
  }
};

// Validaciones de filtros de reportes
export const validateFilters = (filters: ReportFilters): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar rangos de fechas
  if (filters.fechaIngresoDesde && filters.fechaIngresoHasta) {
    if (new Date(filters.fechaIngresoDesde) > new Date(filters.fechaIngresoHasta)) {
      errors.push('La fecha de ingreso "desde" no puede ser mayor que "hasta"');
    }
  }

  if (filters.fechaVencimientoDesde && filters.fechaVencimientoHasta) {
    if (new Date(filters.fechaVencimientoDesde) > new Date(filters.fechaVencimientoHasta)) {
      errors.push('La fecha de vencimiento "desde" no puede ser mayor que "hasta"');
    }
  }

  // Validar rangos numéricos
  if (filters.cantidadMinima !== '' && filters.cantidadMaxima !== '') {
    if (Number(filters.cantidadMinima) > Number(filters.cantidadMaxima)) {
      errors.push('La cantidad mínima no puede ser mayor que la máxima');
    }
  }

  if (filters.precioMinimo !== '' && filters.precioMaximo !== '') {
    if (Number(filters.precioMinimo) > Number(filters.precioMaximo)) {
      errors.push('El precio mínimo no puede ser mayor que el máximo');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// SUGERENCIA DE OPTIMIZACIÓN BACKEND:
// Esta función de filtrado debería ejecutarse en el servidor para mejor rendimiento
// Se podría crear un endpoint /api/inventario/filter que reciba estos parámetros
// y retorne datos ya filtrados con paginación, especialmente para inventarios grandes

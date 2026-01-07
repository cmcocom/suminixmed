/**
 * Whitelist de Tablas y Columnas Permitidas
 * Para reportes dinámicos seguros
 *
 * Este módulo define qué tablas y columnas pueden ser consultadas
 * en reportes generados dinámicamente, previniendo SQL injection.
 */

/**
 * Tablas permitidas para reportes dinámicos
 */
export const ALLOWED_TABLES = [
  'clientes',
  'proveedores',
  'inventario',
  'categorias',
  'entradas_inventario',
  'salidas_inventario',
  'partidas_entrada_inventario',
  'partidas_salida_inventario',
  'tipos_entrada',
  'tipos_salida',
  'unidades_medida',
  'user',
] as const;

export type AllowedTable = (typeof ALLOWED_TABLES)[number];

/**
 * Columnas permitidas por tabla
 * Solo las columnas listadas aquí pueden ser consultadas
 */
export const ALLOWED_COLUMNS: Record<AllowedTable, string[]> = {
  clientes: [
    'id',
    'nombre',
    'clave',
    'email',
    'telefono',
    'direccion',
    'rfc',
    'empresa',
    'contacto',
    'codigo_postal',
    'activo',
    'medico_tratante',
    'especialidad',
    'localidad',
    'estado',
    'pais',
    'createdAt',
    'updatedAt',
  ],
  proveedores: [
    'id',
    'nombre',
    'razon_social',
    'email',
    'telefono',
    'direccion',
    'rfc',
    'contacto',
    'sitio_web',
    'activo',
    'createdAt',
    'updatedAt',
  ],
  inventario: [
    'id',
    'clave',
    'clave2',
    'nombre',
    'descripcion',
    'cantidad',
    'precio',
    'categoria',
    'categoria_id',
    'estado',
    'numero_lote',
    'cantidad_minima',
    'cantidad_maxima',
    'punto_reorden',
    'ubicacion_general',
    'dias_reabastecimiento',
    'fechaVencimiento',
    'createdAt',
    'updatedAt',
  ],
  categorias: ['id', 'nombre', 'descripcion', 'activo', 'createdAt', 'updatedAt'],
  entradas_inventario: [
    'id',
    'folio',
    'serie',
    'fecha_creacion',
    'tipo_entrada_id',
    'proveedor_id',
    'motivo',
    'observaciones',
    'user_id',
    'createdAt',
    'updatedAt',
  ],
  salidas_inventario: [
    'id',
    'folio',
    'serie',
    'fecha_creacion',
    'tipo_salida_id',
    'cliente_id',
    'motivo',
    'observaciones',
    'user_id',
    'createdAt',
    'updatedAt',
  ],
  partidas_entrada_inventario: [
    'id',
    'entrada_id',
    'inventario_id',
    'cantidad',
    'precio',
    'numero_lote',
    'fecha_vencimiento_lote',
    'orden',
    'createdAt',
  ],
  partidas_salida_inventario: [
    'id',
    'salida_id',
    'inventario_id',
    'lote_entrada_id',
    'cantidad',
    'precio',
    'numero_lote',
    'fecha_vencimiento_lote',
    'orden',
    'createdAt',
  ],
  tipos_entrada: ['id', 'codigo', 'nombre', 'descripcion', 'activo', 'createdAt'],
  tipos_salida: ['id', 'codigo', 'nombre', 'descripcion', 'activo', 'createdAt'],
  unidades_medida: ['id', 'clave', 'nombre', 'descripcion', 'activo', 'createdAt'],
  user: ['id', 'name', 'email', 'clave', 'activo', 'createdAt', 'updatedAt'],
};

/**
 * Operadores permitidos para filtros
 */
export const ALLOWED_OPERATORS = [
  'equals',
  'contains',
  'starts_with',
  'ends_with',
  'gt',
  'lt',
  'gte',
  'lte',
] as const;

export type AllowedOperator = (typeof ALLOWED_OPERATORS)[number];

/**
 * Mapeo de operadores a sintaxis Prisma
 */
export const OPERATOR_TO_PRISMA: Record<AllowedOperator, string> = {
  equals: 'equals',
  contains: 'contains',
  starts_with: 'startsWith',
  ends_with: 'endsWith',
  gt: 'gt',
  lt: 'lt',
  gte: 'gte',
  lte: 'lte',
};

/**
 * Columnas permitidas para ordenamiento por tabla
 * Subconjunto de columnas permitidas que tienen sentido para ORDER BY
 */
export const SORTABLE_COLUMNS: Record<AllowedTable, string[]> = {
  clientes: ['nombre', 'email', 'createdAt', 'updatedAt', 'activo'],
  proveedores: ['nombre', 'razon_social', 'createdAt', 'updatedAt', 'activo'],
  inventario: [
    'nombre',
    'descripcion',
    'cantidad',
    'precio',
    'categoria',
    'createdAt',
    'fechaVencimiento',
  ],
  categorias: ['nombre', 'createdAt', 'activo'],
  entradas_inventario: ['folio', 'fecha_creacion', 'createdAt'],
  salidas_inventario: ['folio', 'fecha_creacion', 'createdAt'],
  partidas_entrada_inventario: ['orden', 'createdAt'],
  partidas_salida_inventario: ['orden', 'createdAt'],
  tipos_entrada: ['codigo', 'nombre', 'createdAt'],
  tipos_salida: ['codigo', 'nombre', 'createdAt'],
  unidades_medida: ['clave', 'nombre', 'createdAt'],
  user: ['name', 'email', 'createdAt', 'activo'],
};

/**
 * Validar que una tabla esté permitida
 */
export function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

/**
 * Validar que una columna esté permitida para una tabla
 */
export function isAllowedColumn(table: AllowedTable, column: string): boolean {
  return ALLOWED_COLUMNS[table]?.includes(column) || false;
}

/**
 * Validar que un operador esté permitido
 */
export function isAllowedOperator(operator: string): operator is AllowedOperator {
  return ALLOWED_OPERATORS.includes(operator as AllowedOperator);
}

/**
 * Validar que una columna sea ordenable
 */
export function isSortableColumn(table: AllowedTable, column: string): boolean {
  return SORTABLE_COLUMNS[table]?.includes(column) || false;
}

/**
 * Obtener columnas permitidas para una tabla
 */
export function getAllowedColumnsForTable(table: AllowedTable): string[] {
  return ALLOWED_COLUMNS[table] || [];
}

/**
 * Obtener columnas ordenables para una tabla
 */
export function getSortableColumnsForTable(table: AllowedTable): string[] {
  return SORTABLE_COLUMNS[table] || [];
}

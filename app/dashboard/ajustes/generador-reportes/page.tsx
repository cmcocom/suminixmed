'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/fetcher';
import ProtectedPage from '@/app/components/ProtectedPage';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon,
  KeyIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
  columns: TableColumn[];
  relationships: {
    hasMany: string[];
    belongsTo: string[];
  };
}

interface DatabaseMetadata {
  tables: TableInfo[];
  summary: {
    totalTables: number;
    totalColumns: number;
  };
}

interface SelectedTable {
  name: string;
  alias?: string;
  displayName: string;
}

interface SelectedColumn {
  table: string;
  column: string;
  alias?: string;
  label: string;
  type: string;
  format?: string;
  sortable: boolean;
  filterable: boolean;
}

interface FilterConfig {
  column: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string }>;
}

const FILTER_TYPES = [
  { value: 'text', label: 'Texto', icon: '📝' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'date', label: 'Fecha', icon: '📅' },
  { value: 'select', label: 'Lista', icon: '📋' },
  { value: 'boolean', label: 'Sí/No', icon: '✅' },
];

const AVAILABLE_ROLES = [
  { value: 'DESARROLLADOR', label: 'Desarrollador', color: 'bg-purple-100 text-purple-800' },
  { value: 'ADMINISTRADOR', label: 'Administrador', color: 'bg-blue-100 text-blue-800' },
  { value: 'COLABORADOR', label: 'Colaborador', color: 'bg-green-100 text-green-800' },
  { value: 'OPERADOR', label: 'Operador', color: 'bg-yellow-100 text-yellow-800' },
];

export default function GeneratorPage() {
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Estado del formulario
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSlug, setReportSlug] = useState('');
  const [selectedTables, setSelectedTables] = useState<SelectedTable[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumn[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['ADMINISTRADOR']);
  const [showFilters, setShowFilters] = useState(true);
  const [showExport, setShowExport] = useState(true);
  const [pageSize, setPageSize] = useState(50);

  const [creating, setCreating] = useState(false);

  // Cargar metadatos de la base de datos
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await api.get('/api/database/metadata');
        if (response.ok) {
          const data = await response.json();
          setMetadata(data.data);
        } else {
          toast.error('Error al cargar metadatos de la base de datos');
        }
      } catch (error) {
        toast.error('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  // Generar slug automáticamente
  useEffect(() => {
    if (reportName) {
      const slug = reportName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setReportSlug(slug);
    }
  }, [reportName]);

  // Agregar tabla seleccionada
  const addTable = (table: TableInfo) => {
    if (!selectedTables.find((t) => t.name === table.name)) {
      setSelectedTables([
        ...selectedTables,
        {
          name: table.name,
          displayName: table.displayName,
        },
      ]);
    }
  };

  // Remover tabla seleccionada
  const removeTable = (tableName: string) => {
    setSelectedTables(selectedTables.filter((t) => t.name !== tableName));
    // Remover columnas de esa tabla
    setSelectedColumns(selectedColumns.filter((c) => c.table !== tableName));
    // Remover filtros de esa tabla
    setFilters(filters.filter((f) => !f.column.startsWith(tableName + '.')));
  };

  // Agregar columna seleccionada
  const addColumn = (table: string, column: TableColumn) => {
    if (!selectedColumns.find((c) => c.table === table && c.column === column.name)) {
      setSelectedColumns([
        ...selectedColumns,
        {
          table,
          column: column.name,
          label: column.name.charAt(0).toUpperCase() + column.name.slice(1),
          type: column.type,
          sortable: true,
          filterable: true,
        },
      ]);
    }
  };

  // Remover columna seleccionada
  const removeColumn = (table: string, column: string) => {
    setSelectedColumns(selectedColumns.filter((c) => !(c.table === table && c.column === column)));
  };

  // Agregar filtro
  const addFilter = (column: string, columnType: string) => {
    if (!filters.find((f) => f.column === column)) {
      const filterType = getFilterTypeFromColumnType(columnType);
      setFilters([
        ...filters,
        {
          column,
          type: filterType,
          label: column.split('.')[1].charAt(0).toUpperCase() + column.split('.')[1].slice(1),
          required: false,
        },
      ]);
    }
  };

  // Obtener tipo de filtro basado en tipo de columna
  const getFilterTypeFromColumnType = (columnType: string): FilterConfig['type'] => {
    if (columnType.includes('text') || columnType.includes('varchar')) return 'text';
    if (columnType.includes('int') || columnType.includes('number')) return 'number';
    if (columnType.includes('date') || columnType.includes('timestamp')) return 'date';
    if (columnType.includes('boolean')) return 'boolean';
    return 'text';
  };

  // Crear reporte
  const createReport = async () => {
    if (!reportName || !reportSlug || selectedTables.length === 0 || selectedColumns.length === 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/api/generated-reports', {
        name: reportName,
        description: reportDescription,
        slug: reportSlug,
        tables: selectedTables.map((t) => ({ name: t.name, alias: t.alias })),
        columns: selectedColumns,
        filters,
        allowedRoles,
        showFilters,
        showExport,
        pageSize,
      });

      if (response.ok) {
        toast.success('Reporte creado exitosamente');
        // Limpiar formulario
        setReportName('');
        setReportDescription('');
        setReportSlug('');
        setSelectedTables([]);
        setSelectedColumns([]);
        setFilters([]);
        setAllowedRoles(['ADMINISTRADOR']);
        setStep(1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear el reporte');
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedPage requiredPermission={{ modulo: 'GESTION_REPORTES', accion: 'LEER' }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-7 h-7 text-blue-600" />
              Generador de Reportes
            </h1>
            <p className="text-gray-600 mt-1">
              Crea reportes dinámicos seleccionando tablas, columnas y configurando filtros
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className="text-sm text-gray-500">Paso {step} de 4</span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s === step
                      ? 'bg-blue-600 text-white'
                      : s < step
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? <CheckIcon className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido por pasos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Paso 1: Información básica */}
          {step === 1 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Información del Reporte</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Reporte *
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Ej: Reporte de Inventario por Categoría"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug de URL *
                  </label>
                  <input
                    type="text"
                    value={reportSlug}
                    onChange={(e) => setReportSlug(e.target.value)}
                    placeholder="inventario-por-categoria"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /dashboard/reportes/{reportSlug}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Descripción opcional del reporte"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!reportName || !reportSlug}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente: Seleccionar Tablas
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Selección de tablas */}
          {step === 2 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TableCellsIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Tablas</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tablas disponibles */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tablas Disponibles</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {metadata?.tables.map((table) => (
                      <div
                        key={table.name}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => addTable(table)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{table.displayName}</h4>
                            <p className="text-sm text-gray-500">{table.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {table.columns.length} columnas
                            </p>
                          </div>
                          <PlusIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tablas seleccionadas */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Tablas Seleccionadas ({selectedTables.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTables.map((table) => (
                      <div
                        key={table.name}
                        className="p-4 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{table.displayName}</h4>
                            <p className="text-sm text-gray-600">Tabla: {table.name}</p>
                          </div>
                          <button
                            onClick={() => removeTable(table.name)}
                            className="text-red-600 hover:text-red-800"
                            title="Remover tabla"
                            aria-label="Remover tabla"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedTables.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <TableCellsIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay tablas seleccionadas</p>
                        <p className="text-sm">Selecciona al menos una tabla de la izquierda</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedTables.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente: Seleccionar Columnas
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Selección de columnas */}
          {step === 3 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Columnas</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columnas disponibles por tabla */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Columnas Disponibles</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTables.map((selectedTable) => {
                      const table = metadata?.tables.find((t) => t.name === selectedTable.name);
                      if (!table) return null;

                      return (
                        <div key={table.name} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">{table.displayName}</h4>
                          <div className="space-y-2">
                            {table.columns.map((column) => (
                              <div
                                key={column.name}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => addColumn(table.name, column)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {column.isPrimaryKey && (
                                      <KeyIcon
                                        className="w-3 h-3 text-yellow-600"
                                        title="Clave primaria"
                                      />
                                    )}
                                    {column.isForeignKey && (
                                      <span className="text-blue-600 text-xs" title="Clave foránea">
                                        🔗
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium">{column.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {column.type}
                                    </span>
                                  </div>
                                </div>
                                <PlusIcon className="w-4 h-4 text-blue-600" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Columnas seleccionadas */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Columnas Seleccionadas ({selectedColumns.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedColumns.map((column) => (
                      <div
                        key={`${column.table}.${column.column}`}
                        className="p-3 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{column.label}</span>
                            <p className="text-sm text-gray-600">
                              {column.table}.{column.column} ({column.type})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                addFilter(`${column.table}.${column.column}`, column.type)
                              }
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Agregar como filtro"
                            >
                              + Filtro
                            </button>
                            <button
                              onClick={() => removeColumn(column.table, column.column)}
                              className="text-red-600 hover:text-red-800"
                              title="Remover columna"
                              aria-label="Remover columna"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedColumns.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AdjustmentsHorizontalIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay columnas seleccionadas</p>
                        <p className="text-sm">Selecciona columnas de las tablas elegidas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={selectedColumns.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente: Configuración Final
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Configuración final */}
          {step === 4 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <SparklesIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Configuración Final</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Permisos */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos de Acceso</h3>
                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allowedRoles.includes(role.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAllowedRoles([...allowedRoles, role.value]);
                            } else {
                              setAllowedRoles(allowedRoles.filter((r) => r !== role.value));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`px-2 py-1 text-sm rounded-full ${role.color}`}>
                          {role.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Configuraciones adicionales */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configuraciones</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={showFilters}
                        onChange={(e) => setShowFilters(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>Mostrar panel de filtros</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={showExport}
                        onChange={(e) => setShowExport(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>Permitir exportación</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño de página
                      </label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        title="Seleccionar tamaño de página"
                      >
                        <option value={25}>25 registros</option>
                        <option value={50}>50 registros</option>
                        <option value={100}>100 registros</option>
                        <option value={200}>200 registros</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros configurados */}
              {filters.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Filtros Configurados ({filters.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filters.map((filter, index) => {
                      const filterType = FILTER_TYPES.find((t) => t.value === filter.type);
                      return (
                        <div
                          key={filter.column}
                          className="p-3 border border-blue-200 bg-blue-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{filter.label}</span>
                              <p className="text-sm text-gray-600">
                                {filterType?.icon} {filterType?.label}
                              </p>
                            </div>
                            <button
                              onClick={() => setFilters(filters.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800"
                              title="Remover filtro"
                              aria-label="Remover filtro"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={createReport}
                  disabled={creating || allowedRoles.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" />
                      Crear Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import { generated_reports } from '@prisma/client';
import {
  ChevronDownIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface DynamicReportPageProps {
  reportConfig: generated_reports & {
    user: {
      name: string | null;
      email: string | null;
    } | null;
  };
}

interface ReportData {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
}

interface FilterValue {
  column: string;
  operator: string;
  value: string;
}

export default function DynamicReportPage({ reportConfig }: DynamicReportPageProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  // Parsear configuración del reporte
  const tables = reportConfig.tables as string[];
  const columns = reportConfig.columns as Record<string, string[]>;

  // Cargar datos del reporte
  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tables: JSON.stringify(tables),
        columns: JSON.stringify(columns),
        filters: JSON.stringify(filters),
        sort: sortBy,
        order: sortOrder,
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      const response = await api.get(`/api/generated-reports/execute?${params}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [tables, columns, filters, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    loadReportData();
  }, [filters, sortBy, sortOrder, currentPage, pageSize, loadReportData]);

  // Agregar filtro
  const addFilter = () => {
    const availableColumns = Object.values(columns).flat();
    if (availableColumns.length > 0) {
      setFilters([
        ...filters,
        {
          column: availableColumns[0],
          operator: 'equals',
          value: '',
        },
      ]);
    }
  };

  // Remover filtro
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Actualizar filtro
  const updateFilter = (index: number, field: keyof FilterValue, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  // Manejar ordenamiento
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Exportar datos
  const exportData = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      if (format === 'pdf') {
        // Generar PDF en el frontend usando los datos actuales
        await generatePDFReport();
        return;
      }

      const params = new URLSearchParams({
        tables: JSON.stringify(tables),
        columns: JSON.stringify(columns),
        filters: JSON.stringify(filters),
        sort: sortBy,
        order: sortOrder,
        format,
      });

      const response = await api.get(`/api/generated-reports/export?${params}`);

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportConfig.slug}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error al exportar el reporte');
    }
  };

  // Generar PDF en el frontend
  const generatePDFReport = async () => {
    try {
      // Importar jsPDF dinámicamente para evitar problemas de SSR
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();

      // Título del reporte
      doc.setFontSize(18);
      doc.text(reportConfig.name, 14, 22);

      if (reportConfig.description) {
        doc.setFontSize(12);
        doc.text(reportConfig.description, 14, 32);
      }

      // Fecha de generación
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 42);

      if (data && data.rows.length > 0) {
        // Preparar datos para la tabla
        const tableColumns = data.columns.map((col) => ({ header: col, dataKey: col }));

        // Mapear filas para el PDF
        const tableRows: Record<string, string>[] = [];

        for (const row of data.rows) {
          const processedRow: Record<string, string> = {};
          for (const col of data.columns) {
            processedRow[col] = String(row[col] || '');
          }
          tableRows.push(processedRow);
        }

        // Agregar tabla usando any para evitar problemas de tipos con jsPDF

        (doc as any).autoTable({
          columns: tableColumns,
          body: tableRows,
          startY: 50,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });
      } else {
        doc.text('No hay datos disponibles para mostrar.', 14, 60);
      }

      // Descargar el PDF
      doc.save(`${reportConfig.slug}.pdf`);
    } catch (err) {
      alert('Error al generar el PDF');
    }
  };

  const availableColumns = Object.values(columns).flat();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{reportConfig.name}</h1>
                {reportConfig.description && (
                  <p className="mt-2 text-gray-600">{reportConfig.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  Creado por:{' '}
                  {reportConfig.user?.name || reportConfig.user?.email || 'Usuario desconocido'}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filtros
                </button>

                <button
                  onClick={loadReportData}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportData('excel')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Exportar a Excel"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => exportData('csv')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Exportar a CSV"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => exportData('pdf')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Exportar a PDF"
                  >
                    <PrinterIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                <button
                  onClick={addFilter}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Agregar filtro
                </button>
              </div>

              {filters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <select
                    value={filter.column}
                    onChange={(e) => updateFilter(index, 'column', e.target.value)}
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    title="Seleccionar columna para filtrar"
                    aria-label="Columna del filtro"
                  >
                    {availableColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                    className="block w-1/6 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    title="Seleccionar operador del filtro"
                    aria-label="Operador del filtro"
                  >
                    <option value="equals">Igual a</option>
                    <option value="contains">Contiene</option>
                    <option value="starts_with">Empieza con</option>
                    <option value="ends_with">Termina con</option>
                    <option value="gt">Mayor que</option>
                    <option value="lt">Menor que</option>
                    <option value="gte">Mayor o igual</option>
                    <option value="lte">Menor o igual</option>
                  </select>

                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="Valor del filtro"
                    className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => removeFilter(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando reporte...</span>
          </div>
        ) : data ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Información del dataset */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {Math.min((currentPage - 1) * pageSize + 1, data.totalCount)} -{' '}
                  {Math.min(currentPage * pageSize, data.totalCount)} de {data.totalCount} registros
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Registros por página:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm rounded border-gray-300"
                      title="Registros por página"
                      aria-label="Número de registros por página"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column}</span>
                          {sortBy === column && (
                            <ChevronDownIcon
                              className={`h-4 w-4 transition-transform ${
                                sortOrder === 'desc' ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.rows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {data.columns.map((column) => (
                        <td
                          key={column}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {data.totalCount > pageSize && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {Math.ceil(data.totalCount / pageSize)}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(Math.ceil(data.totalCount / pageSize), currentPage + 1)
                      )
                    }
                    disabled={currentPage >= Math.ceil(data.totalCount / pageSize)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">No hay datos disponibles</div>
          </div>
        )}
      </div>
    </div>
  );
}

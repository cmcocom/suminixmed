/**
 * Componente de tabla para mostrar datos de inventario en reportes
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Tabla optimizada con renderizado eficiente y estilos adaptativos
 */

'use client';

import React from 'react';
import { DocumentTextIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import {
  Inventario,
  ColumnConfig,
  renderCellValue,
  getEstadoClasses,
  formatPriceMX,
} from '@/lib/report-utils';

interface ReportTableProps {
  data: Inventario[];
  columns: ColumnConfig[];
  title?: string;
  className?: string;
}

export default function ReportTable({
  data,
  columns,
  title = 'Datos del Inventario',
  className = '',
}: ReportTableProps) {
  const enabledColumns = columns.filter((col) => col.enabled);

  // Función para renderizar el contenido de cada celda con estilos específicos
  const renderTableCell = (item: Inventario, column: ColumnConfig) => {
    switch (column.key) {
      case 'nombre':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{item.descripcion}</div>
            {item.descripcion && (
              <div className="text-sm text-gray-500 truncate max-w-xs" title={item.descripcion}>
                {item.descripcion}
              </div>
            )}
          </div>
        );

      case 'cantidad':
        return (
          <span
            className={`text-sm font-medium ${
              item.cantidad <= 10 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {item.cantidad}
            {item.cantidad <= 10 && (
              <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">Bajo</span>
            )}
          </span>
        );

      case 'precio':
        return (
          <span className="text-sm font-medium text-green-600">{formatPriceMX(item.precio)}</span>
        );

      case 'valorTotal':
        return (
          <span className="text-sm font-bold text-green-700">
            {formatPriceMX(item.cantidad * item.precio)}
          </span>
        );

      case 'estado':
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClasses(item.estado)}`}
          >
            {item.estado}
          </span>
        );

      case 'fechaVencimiento':
        if (!item.fechaVencimiento) return <span className="text-gray-400">-</span>;

        const vencimiento = new Date(item.fechaVencimiento);
        const hoy = new Date();
        const diasRestantes = Math.ceil(
          (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <div>
            <div
              className={`text-sm ${
                diasRestantes < 0
                  ? 'text-red-600 font-medium'
                  : diasRestantes <= 30
                    ? 'text-yellow-600'
                    : 'text-gray-900'
              }`}
            >
              {vencimiento.toLocaleDateString('es-MX')}
            </div>
            {diasRestantes < 30 && (
              <div className={`text-xs ${diasRestantes < 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                {diasRestantes < 0
                  ? `Vencido hace ${Math.abs(diasRestantes)} días`
                  : diasRestantes === 0
                    ? 'Vence hoy'
                    : `${diasRestantes} días restantes`}
              </div>
            )}
          </div>
        );

      default:
        return <span className="text-sm text-gray-900">{renderCellValue(item, column.key)}</span>;
    }
  };

  if (enabledColumns.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay columnas seleccionadas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Seleccione al menos una columna para mostrar los datos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
          {title} ({data.length} productos)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {enabledColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.key === 'cantidad'
                      ? 'text-center'
                      : ['precio', 'valorTotal'].includes(column.key)
                        ? 'text-right'
                        : 'text-left'
                  }`}
                >
                  {column.label}
                  {column.key === 'cantidad' && (
                    <div className="text-xs normal-case text-gray-400 mt-1">Stock</div>
                  )}
                  {column.key === 'fechaVencimiento' && (
                    <div className="text-xs normal-case text-gray-400 mt-1">Días restantes</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                {enabledColumns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap ${
                      column.key === 'cantidad'
                        ? 'text-center'
                        : ['precio', 'valorTotal'].includes(column.key)
                          ? 'text-right'
                          : 'text-left'
                    }`}
                  >
                    {renderTableCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Estado vacío */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron productos que coincidan con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Pie de tabla con información adicional */}
      {data.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Mostrando {data.length} productos</span>
            <span>Columnas: {enabledColumns.map((col) => col.label).join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// OPTIMIZACIONES FUTURAS:
// 1. Virtualización para tablas con miles de registros
// 2. Ordenamiento por columna clickeable
// 3. Selección múltiple de filas
// 4. Filtrado inline por columna
// 5. Exportación selectiva de filas

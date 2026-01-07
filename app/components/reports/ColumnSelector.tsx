/**
 * Componente selector de columnas para reportes
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Permite configurar qué columnas incluir en el reporte
 */

'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ColumnConfig } from '@/lib/report-utils';

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onToggleColumn: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isVisible: boolean;
}

export default function ColumnSelector({
  columns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
  isVisible,
}: ColumnSelectorProps) {
  if (!isVisible) return null;

  const enabledColumns = columns.filter((col) => col.enabled);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Configurar Columnas del Reporte</h3>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Seleccionar todas
          </button>
          <button
            onClick={onDeselectAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Deseleccionar todas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {columns.map((column) => (
          <label key={column.key} className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={column.enabled}
                onChange={() => onToggleColumn(column.key)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                  column.enabled
                    ? 'bg-green-500 border-green-500 shadow-sm'
                    : 'border-gray-300 bg-white group-hover:border-gray-400'
                } flex items-center justify-center`}
              >
                {column.enabled && <CheckIcon className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span
              className={`text-sm transition-colors ${
                column.enabled
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500 group-hover:text-gray-700'
              }`}
            >
              {column.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Columnas seleccionadas:</strong> {enabledColumns.length} de {columns.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Las columnas seleccionadas aparecerán en la tabla y en los reportes exportados.
        </p>

        {enabledColumns.length === 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Debe seleccionar al menos una columna para generar reportes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// FUNCIONALIDAD EXTENDIDA:
// - Permite guardar configuraciones de columnas personalizadas
// - Preset de columnas por tipo de reporte (resumen, detallado, etc.)
// - Reordenamiento drag & drop de columnas

/**
 * Componente de acciones de reporte (botones de exportación, impresión, etc.)
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza todas las acciones disponibles para reportes
 */

'use client';

import React from 'react';
import {
  FunnelIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ReportActionsProps {
  onToggleFilters: () => void;
  onToggleColumns: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onPreview?: () => void;
  showFilters: boolean;
  showColumns: boolean;
  showPreview?: boolean;
  hasData: boolean;
  enabledColumnsCount: number;
  className?: string;
}

export default function ReportActions({
  onToggleFilters,
  onToggleColumns,
  onExportExcel,
  onExportPDF,
  onPrint,
  onPreview,
  showFilters,
  showColumns,
  showPreview = false,
  hasData,
  enabledColumnsCount,
  className = '',
}: ReportActionsProps) {
  // Verificar si las acciones están habilitadas
  const canExport = hasData && enabledColumnsCount > 0;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Botón de Filtros */}
      <button
        onClick={onToggleFilters}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
          showFilters
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Mostrar/ocultar panel de filtros"
      >
        <FunnelIcon className="w-4 h-4 mr-2" />
        Filtros
        {showFilters && (
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Activo
          </span>
        )}
      </button>

      {/* Botón de Columnas */}
      <button
        onClick={onToggleColumns}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
          showColumns
            ? 'bg-green-50 text-green-700 border-green-300'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Configurar columnas del reporte"
      >
        <Cog6ToothIcon className="w-4 h-4 mr-2" />
        Columnas
        <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
          {enabledColumnsCount}
        </span>
      </button>

      {/* Separador visual */}
      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Botón de Vista Previa */}
      {onPreview && (
        <button
          onClick={onPreview}
          disabled={!canExport}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
            showPreview
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : canExport
                ? 'bg-white text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Ver vista previa del reporte"
        >
          <EyeIcon className="w-4 h-4 mr-2" />
          Vista Previa
        </button>
      )}

      {/* Botón de Impresión */}
      <button
        onClick={onPrint}
        disabled={!canExport}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
          canExport
            ? 'bg-white text-gray-700 hover:bg-gray-50'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title={canExport ? 'Imprimir reporte' : 'Seleccione columnas y datos para imprimir'}
      >
        <PrinterIcon className="w-4 h-4 mr-2" />
        Imprimir
      </button>

      {/* Botón Excel */}
      <button
        onClick={onExportExcel}
        disabled={!canExport}
        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          canExport
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title={canExport ? 'Exportar a Excel' : 'Seleccione columnas y datos para exportar'}
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Excel
      </button>

      {/* Botón PDF */}
      <button
        onClick={onExportPDF}
        disabled={!canExport}
        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          canExport
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title={canExport ? 'Exportar a PDF' : 'Seleccione columnas y datos para exportar'}
      >
        <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
        PDF
      </button>

      {/* Indicador de estado */}
      {!canExport && (
        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          {!hasData ? (
            <span>📄 No hay datos para exportar</span>
          ) : enabledColumnsCount === 0 ? (
            <span>📋 Seleccione columnas para exportar</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

// MEJORAS SUGERIDAS:
// 1. Dropdown con opciones avanzadas de exportación
// 2. Programación de reportes automáticos
// 3. Plantillas de reporte guardadas
// 4. Envío por email directo

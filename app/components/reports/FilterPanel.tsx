/**
 * Componente de panel de filtros para reportes de inventario
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza toda la lógica de filtrado en un componente reutilizable
 */

'use client';

import React from 'react';
import { Categoria, ReportFilters, ESTADOS_DISPONIBLES, validateFilters } from '@/lib/report-utils';

interface FilterPanelProps {
  filters: ReportFilters;
  categorias: Categoria[];
  onUpdateFilter: (key: keyof ReportFilters, value: string | number | '') => void;
  onClearFilters: () => void;
  isVisible: boolean;
}

export default function FilterPanel({
  filters,
  categorias,
  onUpdateFilter,
  onClearFilters,
  isVisible,
}: FilterPanelProps) {
  if (!isVisible) return null;

  // Validar filtros y mostrar errores si existen
  const validation = validateFilters(filters);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Mostrar errores de validación */}
      {!validation.isValid && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errores en los filtros:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Categoría - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={filters.categoria}
            onChange={(e) => onUpdateFilter('categoria', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Seleccionar categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.estado}
            onChange={(e) => onUpdateFilter('estado', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Seleccionar estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_DISPONIBLES.map((estado) => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Proveedor - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input
            type="text"
            value={filters.proveedor}
            onChange={(e) => onUpdateFilter('proveedor', e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Cantidad Mínima - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Mínima</label>
          <input
            type="number"
            value={filters.cantidadMinima}
            onChange={(e) =>
              onUpdateFilter('cantidadMinima', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="0"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Cantidad Máxima - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Máxima</label>
          <input
            type="number"
            value={filters.cantidadMaxima}
            onChange={(e) =>
              onUpdateFilter('cantidadMaxima', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="999999"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Precio Mínimo - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mínimo</label>
          <input
            type="number"
            value={filters.precioMinimo}
            onChange={(e) =>
              onUpdateFilter('precioMinimo', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Precio Máximo - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
          <input
            type="number"
            value={filters.precioMaximo}
            onChange={(e) =>
              onUpdateFilter('precioMaximo', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="999999.99"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fecha Ingreso Desde - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Ingreso Desde
          </label>
          <input
            type="date"
            value={filters.fechaIngresoDesde}
            onChange={(e) => onUpdateFilter('fechaIngresoDesde', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Fecha de ingreso desde"
          />
        </div>

        {/* Fecha Ingreso Hasta - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Ingreso Hasta
          </label>
          <input
            type="date"
            value={filters.fechaIngresoHasta}
            onChange={(e) => onUpdateFilter('fechaIngresoHasta', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Fecha de ingreso hasta"
          />
        </div>

        {/* Fecha Vencimiento Desde - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Vencimiento Desde
          </label>
          <input
            type="date"
            value={filters.fechaVencimientoDesde}
            onChange={(e) => onUpdateFilter('fechaVencimientoDesde', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Fecha de vencimiento desde"
          />
        </div>

        {/* Fecha Vencimiento Hasta - PRESERVADO del original */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Vencimiento Hasta
          </label>
          <input
            type="date"
            value={filters.fechaVencimientoHasta}
            onChange={(e) => onUpdateFilter('fechaVencimientoHasta', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Fecha de vencimiento hasta"
          />
        </div>
      </div>
    </div>
  );
}

// OPTIMIZACIÓN BACKEND SUGERIDA:
// Este componente podría trabajar con un endpoint de filtros del servidor:
// - /api/inventario/filters para obtener opciones dinámicas
// - Debounced search para proveedores desde la base de datos
// - Validación server-side de rangos de fechas y valores

/**
 * @fileoverview Componente InventariosFilters
 * @description Filtros de búsqueda para inventarios físicos
 * @date 2025-10-07
 */

import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface InventariosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAll: boolean;
  onShowAllChange: (value: boolean) => void;
  totalCount: number;
}

export function InventariosFilters({
  searchTerm,
  onSearchChange,
  showAll,
  onShowAllChange,
  totalCount,
}: InventariosFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, descripción o usuario..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Filtro mostrar todos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="showAll"
              type="checkbox"
              checked={showAll}
              onChange={(e) => onShowAllChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showAll" className="ml-2 block text-sm text-gray-900">
              Mostrar cancelados
            </label>
          </div>
          <div className="text-sm text-gray-500">
            {totalCount} inventario{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

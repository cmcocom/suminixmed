/**
 * Componente EntradasFilters
 * Filtros y búsqueda para las entradas
 * Extraído del archivo principal para mejorar la modularidad
 */

import type { EntradasFiltersProps } from '../utils/entradas.types';

export const EntradasFilters: React.FC<EntradasFiltersProps> = ({
  searchTerm,
  showAll,
  onSearchChange,
  onShowAllToggle,
}) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar entradas</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por motivo, observaciones o productos..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onShowAllToggle}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showAll
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {showAll ? 'Ocultar todas' : 'Mostrar todas'}
          </button>
        </div>
      </div>
    </div>
  );
};

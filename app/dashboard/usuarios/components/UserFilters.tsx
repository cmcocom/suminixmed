/**
 * Componente UserFilters - Filtros y búsqueda de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx (líneas ~620-660)
 *
 * Propósito: Proporcionar controles de filtrado (búsqueda por texto y checkbox
 * "mostrar todos") de forma organizada y reutilizable.
 *
 * Props:
 * - search: Texto de búsqueda actual
 * - onSearchChange: Callback para cambios en la búsqueda
 * - showAll: Estado del checkbox "mostrar todos"
 * - onShowAllChange: Callback para cambios en "mostrar todos"
 *
 * PRESERVADO: Lógica exacta de filtrado y reseteo de paginación
 */

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showAll: boolean;
  onShowAllChange: (checked: boolean) => void;
}

export default function UserFilters({
  search,
  onSearchChange,
  showAll,
  onShowAllChange,
}: UserFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por nombre o email
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Escribe para buscar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              id="showAll"
              name="showAll"
              type="checkbox"
              checked={showAll}
              onChange={(e) => onShowAllChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mostrar todos los usuarios</span>
          </label>
        </div>
      </div>
    </div>
  );
}

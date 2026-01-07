/**
 * Componente ProveedorSelector
 * Selector de proveedor con búsqueda y auto-completado
 * Extraído del archivo principal para mejorar la modularidad
 */

import type { ProveedorSelectorProps } from '../utils/entradas.types';
import { filterProveedores } from '../utils/entradas.utils';
import { CSS_SELECTORS, TIMING_CONFIG } from '../utils/entradas.constants';

interface ProveedorSelectorExtendedProps extends ProveedorSelectorProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export const ProveedorSelector: React.FC<ProveedorSelectorExtendedProps> = ({
  value,
  onChange,
  proveedores,
  onSelectionChange,
  searchValue,
  onSearchChange,
}) => {
  // Encontrar el proveedor seleccionado para mostrar su nombre
  const proveedorSeleccionado = proveedores.find((p) => p.id === value);

  // Filtrar proveedores por búsqueda - Protección contra undefined
  const proveedoresFiltrados = filterProveedores(proveedores, searchValue || '');

  // Auto-navegar al campo referencia externa cuando se selecciona un proveedor
  const handleProveedorSelection = (proveedorId: string, proveedorNombre: string) => {
    onChange(proveedorId);
    onSearchChange(proveedorNombre);
    onSelectionChange?.();

    setTimeout(() => {
      const elemento = document.querySelector(CSS_SELECTORS.REFERENCIA_INPUT) as HTMLElement;
      if (elemento) {
        elemento.focus();
      }
    }, TIMING_CONFIG.AUTO_NAVIGATE_DELAY);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
      <div className="relative">
        <input
          type="text"
          name="proveedor"
          value={proveedorSeleccionado ? proveedorSeleccionado.nombre : searchValue}
          onChange={(e) => {
            onSearchChange(e.target.value);
            // Si el usuario está escribiendo y hay un proveedor seleccionado, limpiar la selección
            if (e.target.value && proveedorSeleccionado) {
              onChange('');
            }
            // Si el campo está vacío, limpiar la selección
            if (!e.target.value) {
              onChange('');
            }
          }}
          onFocus={() => {
            // Si hay un proveedor seleccionado y el usuario hace clic para cambiar
            if (proveedorSeleccionado) {
              onSearchChange('');
              onChange('');
            }
          }}
          placeholder="Buscar proveedor..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
        />
        {searchValue && !proveedorSeleccionado && searchValue.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
            {proveedoresFiltrados.slice(0, 5).map((proveedor) => (
              <div
                key={proveedor.id}
                onClick={() => handleProveedorSelection(proveedor.id, proveedor.nombre)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <div className="font-medium text-black">{proveedor.nombre}</div>
                {proveedor.email && <div className="text-xs text-black">{proveedor.email}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

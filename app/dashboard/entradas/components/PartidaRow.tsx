/**
 * Componente PartidaRow
 * Fila individual de partida con funcionalidad completa de edición y drag & drop
 * Extraído del archivo principal para mejorar la modularidad
 */

import { TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import type { PartidaRowProps, Inventario } from '../utils/entradas.types';
import { filterInventarios, formatPrice } from '../utils/entradas.utils';
import { PAGINATION_CONFIG, TIMING_CONFIG } from '../utils/entradas.constants';

export const PartidaRow: React.FC<PartidaRowProps> = ({
  partida,
  index,
  inventarios,
  isActive,
  onUpdate,
  onDelete,
  onActivate,
  onKeyDown,
  searchValue,
  onSearchChange,
  isEditing,
  canDelete,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  // Filtrar inventarios por búsqueda - Proteger contra valores undefined
  const inventariosFiltrados = filterInventarios(inventarios, searchValue || '');

  // Manejar selección de producto
  const handleProductoSelection = (inventario: Inventario) => {
    onUpdate(partida.id, 'inventarioId', inventario.id);
    // Limpiar búsqueda y salir del modo edición
    onSearchChange('');

    // Enfocar el campo cantidad después de un breve delay
    setTimeout(() => {
      const inputCantidad = document.querySelector(
        `input[data-partida-id="${partida.id}"][type="number"]`
      ) as HTMLInputElement;
      if (inputCantidad) {
        inputCantidad.focus();
        inputCantidad.select();
      }
    }, TIMING_CONFIG.FOCUS_DELAY);
  };

  return (
    <div
      className={`grid grid-cols-12 gap-2 p-2 border-t border-gray-200 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 opacity-60 hover:opacity-80'
      } ${isDragOver ? 'border-blue-400 bg-blue-100' : ''}`}
      onClick={() => onActivate(partida.id)}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Producto */}
      <div className="col-span-3">
        {partida.inventarioId > 0 && partida.nombre ? (
          <div className="p-2 text-sm text-black bg-gray-100 rounded border flex items-center justify-between">
            <span>{partida.nombre}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(partida.id, 'inventarioId', 0);
              }}
              className="ml-2 text-gray-400 hover:text-red-600 text-xs"
              title="Cambiar producto"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={isEditing ? searchValue : partida.nombre || searchValue}
              onChange={(e) => {
                onSearchChange(e.target.value);
                // Si el usuario está escribiendo y hay un producto seleccionado, limpiar la selección
                if (e.target.value && partida.inventarioId > 0) {
                  onUpdate(partida.id, 'inventarioId', 0);
                }
                // Si el campo está vacío, limpiar la selección
                if (!e.target.value) {
                  onUpdate(partida.id, 'inventarioId', 0);
                }
              }}
              onFocus={() => {
                onActivate(partida.id);
                // Si hay un producto seleccionado y el usuario hace clic para cambiar
                if (partida.inventarioId > 0) {
                  onSearchChange('');
                  onUpdate(partida.id, 'inventarioId', 0);
                }
              }}
              onKeyDown={(e) => onKeyDown(e, partida.id, 'inventarioId')}
              placeholder="Buscar producto..."
              className="w-full p-2 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!isActive}
              data-partida-id={partida.id}
              data-campo="inventarioId"
            />
            {searchValue && partida.inventarioId === 0 && searchValue.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
                {inventariosFiltrados
                  .slice(0, PAGINATION_CONFIG.MAX_DROPDOWN_ITEMS)
                  .map((inventario) => (
                    <div
                      key={inventario.id}
                      onClick={() => handleProductoSelection(inventario)}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      <div className="font-medium text-black">{inventario.nombre}</div>
                      <div className="text-xs text-black">
                        Stock: {inventario.cantidad} | Precio: {formatPrice(inventario.precio)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cantidad */}
      <div className="col-span-2">
        <input
          type="number"
          value={partida.cantidad}
          onChange={(e) => onUpdate(partida.id, 'cantidad', Number(e.target.value))}
          onFocus={() => onActivate(partida.id)}
          onKeyDown={(e) => onKeyDown(e, partida.id, 'cantidad')}
          min="1"
          className="w-full p-2 text-sm text-center text-black border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={!isActive}
          title="Cantidad del producto"
          placeholder="1"
          data-partida-id={partida.id}
          data-campo="cantidad"
        />
      </div>

      {/* Precio */}
      <div className="col-span-2">
        <input
          type="number"
          value={partida.precio}
          onChange={(e) => onUpdate(partida.id, 'precio', Number(e.target.value))}
          onFocus={() => onActivate(partida.id)}
          onKeyDown={(e) => onKeyDown(e, partida.id, 'precio')}
          min="0"
          step="0.01"
          className="w-full p-2 text-sm text-center text-black border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={!isActive}
          title="Presione Enter para ir al siguiente campo"
          data-partida-id={partida.id}
          data-campo="precio"
        />
      </div>

      {/* Subtotal */}
      <div className="col-span-2 flex items-center justify-center">
        <span className="text-sm font-medium text-black">
          {formatPrice(partida.cantidad * partida.precio)}
        </span>
      </div>

      {/* Acciones */}
      <div className="col-span-3 flex items-center justify-center space-x-1">
        <div
          className="p-2 text-gray-400 hover:text-blue-600 cursor-move"
          title="Arrastrar para reordenar"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Bars3Icon className="w-4 h-4" />
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(partida.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Eliminar"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

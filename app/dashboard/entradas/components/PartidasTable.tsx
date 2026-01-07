/**
 * Componente PartidasTable
 * Tabla completa de partidas con drag & drop y gestión de estado
 * Extraído del archivo principal para mejorar la modularidad
 */

import { PartidaRow } from './PartidaRow';
import type { PartidasTableProps } from '../utils/entradas.types';
import { calculateTotal, formatPrice } from '../utils/entradas.utils';

export const PartidasTable: React.FC<PartidasTableProps> = ({
  partidas,
  inventarios,
  partidaActiva,
  searchProductos,
  editingProductos,
  onUpdatePartida,
  onDeletePartida,
  onActivatePartida,
  onKeyDown,
  onSearchProductoChange,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  error,
}) => {
  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Partidas *</label>
      </div>

      {/* Tabla de partidas inline */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 grid grid-cols-12 gap-2 p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
          <div className="col-span-3">Producto</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-2 text-center">Precio Unit.</div>
          <div className="col-span-2 text-center">Subtotal</div>
          <div className="col-span-3 text-center">Acciones</div>
        </div>

        {partidas.map((partida, index) => (
          <PartidaRow
            key={partida.id}
            partida={partida}
            index={index}
            inventarios={inventarios}
            isActive={partidaActiva === partida.id}
            onUpdate={onUpdatePartida}
            onDelete={onDeletePartida}
            onActivate={onActivatePartida}
            onKeyDown={onKeyDown}
            searchValue={searchProductos[partida.id] || ''}
            onSearchChange={(value) => onSearchProductoChange(partida.id, value)}
            isEditing={editingProductos[partida.id] || false}
            canDelete={partidas.length > 1}
            isDragOver={dragOverIndex === index}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Total */}
        <div className="bg-gray-50 grid grid-cols-12 gap-2 p-2 border-t border-gray-200">
          <div className="col-span-5"></div>
          <div className="col-span-2 text-center text-sm font-medium text-black">Total:</div>
          <div className="col-span-2 text-center text-sm font-bold text-black">
            {formatPrice(calculateTotal(partidas))}
          </div>
          <div className="col-span-3"></div>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

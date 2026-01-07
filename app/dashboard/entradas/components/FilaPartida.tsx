'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { PartidaEntrada } from '../types';

interface FilaPartidaProps {
  partida: PartidaEntrada;
  index: number;
  numeroPartida: number;
  onUpdate: (index: number, cantidad: number) => void;
  onRemove: (index: number) => void;
  isHighlighted?: boolean;
  selectorRef?: React.RefObject<HTMLInputElement | null>;
  mostrarLotes?: boolean;
}

export default function FilaPartida({
  partida,
  index,
  numeroPartida,
  onUpdate,
  onRemove,
  isHighlighted = false,
  selectorRef,
  mostrarLotes = false,
}: FilaPartidaProps) {
  const handleCantidadChange = (valor: string) => {
    const cantidad = parseInt(valor) || 0;
    onUpdate(index, cantidad);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // SIEMPRE prevenir que Enter dispare el submit del formulario
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Aplicar cambios haciendo blur
      (e.target as HTMLInputElement).blur();

      // Regresar el foco al selector de producto
      if (selectorRef?.current) {
        setTimeout(() => {
          selectorRef.current?.focus();
        }, 100);
      }
      return;
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <tr
      className={`border-b transition-colors duration-300 ${
        isHighlighted ? 'bg-yellow-50 hover:bg-yellow-100 animate-pulse' : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-3 text-center">
        <div
          className={`inline-flex items-center justify-center w-8 h-8 font-semibold rounded-full ${
            isHighlighted ? 'bg-yellow-200 text-yellow-900' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {numeroPartida}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{partida.producto.clave || 'S/C'}</div>
        <div className="text-sm text-gray-600">{partida.producto.descripcion}</div>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={partida.cantidad}
          onChange={(e) => handleCantidadChange(e.target.value)}
          onKeyDown={handleKeyDown}
          min="1"
          aria-label="Cantidad"
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      {mostrarLotes && (
        <>
          <td className="px-4 py-3">
            <div className="text-sm">
              {partida.numero_lote ? (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  {partida.numero_lote}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">Sin lote</span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm">
              {partida.fecha_vencimiento ? (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                  {formatearFecha(partida.fecha_vencimiento)}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">Sin vencimiento</span>
              )}
            </div>
          </td>
        </>
      )}
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar producto"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

'use client';

import { useState } from 'react';
import { PartidaSalida } from '../types';
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FilaPartidaSalidaProps {
  partida: PartidaSalida;
  index: number;
  numeroPartida: number;
  onUpdate: (index: number, cantidad: number, precio: number) => void;
  onRemove: (index: number) => void;
  onEnterPressed?: () => void; // Nuevo callback para manejar Enter
  isHighlighted?: boolean;
  mostrarLotes?: boolean; // Nueva prop para mostrar columnas de lote
}

export default function FilaPartidaSalida({
  partida,
  index,
  numeroPartida,
  onUpdate,
  onRemove,
  onEnterPressed,
  isHighlighted = false,
  mostrarLotes = false,
}: FilaPartidaSalidaProps) {
  const [errorStock, setErrorStock] = useState<string | null>(null);

  const handleCantidadChange = (valor: string) => {
    const cantidad = parseInt(valor) || 0;

    // Validar que la cantidad no exceda el stock
    if (cantidad > partida.producto.cantidad) {
      setErrorStock(`Stock insuficiente. Disponible: ${partida.producto.cantidad}`);
      return;
    }

    setErrorStock(null);
    onUpdate(index, cantidad, partida.precio);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // SIEMPRE prevenir que Enter dispare el submit del formulario
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Aplicar cambios haciendo blur
      (e.target as HTMLInputElement).blur();

      // Llamar al callback si existe para regresar foco al selector
      if (onEnterPressed) {
        setTimeout(() => onEnterPressed(), 100);
      }
      return;
    }
  };

  const stockInsuficiente = partida.cantidad > partida.producto.cantidad;

  return (
    <>
      <tr
        className={`border-b transition-colors duration-300 ${
          isHighlighted
            ? 'bg-yellow-50 hover:bg-yellow-100 animate-pulse'
            : stockInsuficiente
              ? 'bg-red-50 hover:bg-red-100'
              : 'hover:bg-gray-50'
        }`}
      >
        <td className="px-4 py-3 text-center">
          <div
            className={`inline-flex items-center justify-center w-8 h-8 font-semibold rounded-full ${
              isHighlighted
                ? 'bg-yellow-200 text-yellow-900'
                : stockInsuficiente
                  ? 'bg-red-200 text-red-900'
                  : 'bg-blue-100 text-blue-800'
            }`}
          >
            {numeroPartida}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{partida.producto.clave || 'S/C'}</div>
          <div className="text-sm text-gray-600">{partida.producto.descripcion}</div>
          <div
            className={`text-xs mt-1 font-medium ${
              partida.producto.cantidad > 10
                ? 'text-green-600'
                : partida.producto.cantidad > 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            Stock disponible: {partida.producto.cantidad}
          </div>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={partida.cantidad}
            onChange={(e) => handleCantidadChange(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            max={partida.producto.cantidad}
            aria-label="Cantidad"
            className={`w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              stockInsuficiente
                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {stockInsuficiente && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Excede stock</span>
            </div>
          )}
        </td>
        {mostrarLotes && (
          <>
            <td className="px-4 py-3">
              <div className="text-sm">
                {partida.numero_lote || <span className="text-gray-400 italic">Sin lote</span>}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-sm">
                {partida.fecha_vencimiento_lote ? (
                  (() => {
                    const fv = partida.fecha_vencimiento_lote as any;
                    if (typeof fv === 'string') {
                      // Si viene en formato YYYY-MM-DD o ISO, normalizar a YYYY-MM-DD y mostrar
                      const fechaStr = fv.split('T')[0];
                      const parts = fechaStr.split('-').map(Number);
                      if (parts.length === 3) {
                        const [y, m, d] = parts;
                        return new Date(y, m - 1, d).toLocaleDateString('es-MX');
                      }
                      return new Date(fv).toLocaleDateString('es-MX');
                    }
                    // Si ya es Date
                    return new Date(fv).toLocaleDateString('es-MX');
                  })()
                ) : (
                  <span className="text-gray-400 italic">Sin vencimiento</span>
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
      {errorStock && (
        <tr>
          <td colSpan={mostrarLotes ? 6 : 4} className="px-4 py-2 bg-red-100">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{errorStock}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

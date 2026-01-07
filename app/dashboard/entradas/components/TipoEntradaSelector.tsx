/**
 * Componente TipoEntradaSelector
 * Selector de tipo de entrada con colores dinámicos y auto-navegación
 * Extraído del archivo principal para mejorar la modularidad
 */

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { TipoEntradaSelectorProps } from '../utils/entradas.types';
import { getColorClasses } from '../utils/entradas.utils';
import { CSS_SELECTORS, TIMING_CONFIG } from '../utils/entradas.constants';

export const TipoEntradaSelector: React.FC<TipoEntradaSelectorProps> = ({
  value,
  onChange,
  tiposEntrada,
  onSelectionChange,
  error,
}) => {
  // Configuración actual basada en el tipo seleccionado
  const configActual = tiposEntrada.find((t) => t.tipo === value);

  // Auto-navegar al campo proveedor cuando se selecciona un tipo
  const handleChange = (nuevoTipo: string) => {
    onChange(nuevoTipo);
    onSelectionChange?.();

    if (nuevoTipo) {
      setTimeout(() => {
        const elemento = document.querySelector(CSS_SELECTORS.PROVEEDOR_INPUT) as HTMLElement;
        if (elemento) {
          elemento.focus();
        }
      }, TIMING_CONFIG.AUTO_NAVIGATE_DELAY);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrada *</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-black font-medium bg-white hover:border-gray-400 ${
            value
              ? `${getColorClasses(configActual?.color || 'blue').ring} ${getColorClasses(configActual?.color || 'blue').border}`
              : 'focus:ring-blue-500'
          }`}
          title="Seleccionar tipo de entrada de inventario"
        >
          <option value="">Seleccionar tipo de entrada...</option>
          {tiposEntrada.map((tipo) => (
            <option key={tipo.tipo} value={tipo.tipo}>
              {tipo.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {configActual && (
        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>{configActual.label}:</strong> {configActual.descripcion}
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

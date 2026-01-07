/**
 * Componente EntradaModal
 * Modal completo del formulario de entrada con toda su funcionalidad
 * Extraído del archivo principal para mejorar la modularidad
 */

import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TipoEntradaSelector } from './TipoEntradaSelector';
import { ProveedorSelector } from './ProveedorSelector';
import { PartidasTable } from './PartidasTable';
import type { EntradaModalProps } from '../utils/entradas.types';
import { getColorClasses } from '../utils/entradas.utils';
import { CSS_SELECTORS } from '../utils/entradas.constants';

export const EntradaModal: React.FC<EntradaModalProps> = ({
  isOpen,
  onClose,
  formData,
  formErrors,
  tiposEntrada,
  inventarios,
  proveedores,
  onFormDataChange,
  onSubmit,
  submitLoading,
  searchProveedor,
  onSearchProveedorChange,
  partidaActiva,
  searchProductos,
  editingProductos,
  onPartidaActivate,
  onPartidaUpdate,
  onPartidaDelete,
  onSearchProductoChange,
  onAddPartida,
  onKeyDown,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  if (!isOpen) return null;

  // Configuración actual basada en el tipo seleccionado
  const configActual = tiposEntrada.find((t) => t.tipo === formData.tipo_entrada);

  // Auto-navegar a observaciones desde referencia externa
  const handleReferenciaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(() => {
        const elemento = document.querySelector(
          CSS_SELECTORS.OBSERVACIONES_TEXTAREA
        ) as HTMLElement;
        if (elemento) {
          elemento.focus();
        }
      }, 50);
    }
  };

  // Auto-navegar a primera partida desde observaciones
  const handleObservacionesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Enfocar el primer campo producto de la primera partida
      if (formData.partidas.length > 0) {
        const primeraPartida = formData.partidas[0];
        setTimeout(() => {
          const selector = `input[data-partida-id="${primeraPartida.id}"][data-campo="inventarioId"]`;
          const elemento = document.querySelector(selector) as HTMLElement;
          if (elemento) {
            elemento.focus();
          }
        }, 50);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-5">
        {/* Header del Modal */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-medium text-gray-900">📥 Nueva Entrada de Inventario</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Selector de Tipo de Entrada */}
          <TipoEntradaSelector
            value={formData.tipo_entrada}
            onChange={(tipo) => {
              onFormDataChange({
                ...formData,
                tipo_entrada: tipo,
                proveedor_id: '',
                referencia_externa: '',
                observaciones: '',
                partidas:
                  formData.partidas.length > 0
                    ? formData.partidas
                    : [
                        {
                          id: `partida_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          inventarioId: 0,
                          nombre: '',
                          cantidad: 1,
                          precio: 0,
                          orden: 0,
                          bloqueada: false,
                        },
                      ],
              });
            }}
            tiposEntrada={tiposEntrada}
            error={formErrors.tipo_entrada}
          />

          {/* Proveedor y Referencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProveedorSelector
              value={formData.proveedor_id}
              onChange={(value) => onFormDataChange({ ...formData, proveedor_id: value })}
              proveedores={proveedores}
              searchValue={searchProveedor}
              onSearchChange={onSearchProveedorChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia Externa
              </label>
              <input
                type="text"
                name="referencia_externa"
                value={formData.referencia_externa}
                onChange={(e) =>
                  onFormDataChange({ ...formData, referencia_externa: e.target.value })
                }
                onKeyDown={handleReferenciaKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Factura, orden, etc."
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={(e) => onFormDataChange({ ...formData, observaciones: e.target.value })}
              onKeyDown={handleObservacionesKeyDown}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Partidas */}
          <PartidasTable
            partidas={formData.partidas}
            inventarios={inventarios}
            partidaActiva={partidaActiva}
            searchProductos={searchProductos}
            editingProductos={editingProductos}
            onUpdatePartida={onPartidaUpdate}
            onDeletePartida={onPartidaDelete}
            onActivatePartida={onPartidaActivate}
            onKeyDown={onKeyDown}
            onSearchProductoChange={onSearchProductoChange}
            onAddPartida={onAddPartida}
            draggedIndex={draggedIndex}
            dragOverIndex={dragOverIndex}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            error={formErrors.partidas}
          />

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitLoading || !formData.tipo_entrada}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                configActual
                  ? `${getColorClasses(configActual.color).bg} ${getColorClasses(configActual.color).hover} ${getColorClasses(configActual.color).ring}`
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Guardar {configActual?.label || 'Entrada'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

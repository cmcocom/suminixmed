/**
 * @fileoverview Componente InventarioModal
 * @description Modal para crear nuevo inventario físico
 * @date 2025-10-07
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { FormData, FormErrors, Almacen } from '../utils/inventarios.types';

interface InventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  formErrors: FormErrors;
  almacenes: Almacen[];
  onFieldChange: (field: keyof FormData, value: string) => void;
  onSubmit: () => void;
  submitLoading: boolean;
}

export function InventarioModal({
  isOpen,
  onClose,
  formData,
  formErrors,
  almacenes,
  onFieldChange,
  onSubmit,
  submitLoading,
}: InventarioModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="text-2xl mr-2">📋</span>
                Nuevo Inventario Físico
              </h3>
              <button
                onClick={onClose}
                title="Cerrar"
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Inventario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => onFieldChange('nombre', e.target.value)}
                placeholder="Ej: Inventario Mensual Octubre 2025"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => onFieldChange('descripcion', e.target.value)}
                placeholder="Descripción opcional del inventario..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.descripcion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{formErrors.descripcion}</p>
              )}
            </div>

            {/* Almacén */}
            <div>
              <label htmlFor="almacen_id" className="block text-sm font-medium text-gray-700 mb-1">
                Almacén
              </label>
              <select
                id="almacen_id"
                value={formData.almacen_id}
                onChange={(e) => onFieldChange('almacen_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los almacenes</option>
                {almacenes
                  .filter((a) => a.activo)
                  .map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.nombre}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Opcional: Selecciona un almacén específico o deja en blanco para todos
              </p>
            </div>

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                💡 Se crearán registros para todos los productos activos del sistema
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </span>
              ) : (
                'Crear Inventario'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

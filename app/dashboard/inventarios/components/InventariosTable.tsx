/**
 * @fileoverview Componente InventariosTable
 * @description Tabla principal de inventarios físicos
 * @date 2025-10-07
 */

import React from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { InventarioFisico } from '../utils/inventarios.types';
import { formatDate, getEstadoConfig } from '../utils/inventarios.utils';

interface InventariosTableProps {
  inventarios: InventarioFisico[];
  onCapturar: (inventario: InventarioFisico) => void;
  onDelete: (id: string) => void;
  onFinalizar: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InventariosTable({
  inventarios,
  onCapturar,
  onDelete,
  onFinalizar,
  currentPage,
  totalPages,
  onPageChange,
}: InventariosTableProps) {
  if (inventarios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inventarios físicos</h3>
        <p className="text-gray-500">Comienza creando un nuevo inventario físico</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Almacén
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventarios.map((inventario) => {
                const estadoConfig = getEstadoConfig(inventario.estado);
                const canEdit = inventario.estado === 'EN_PROCESO';
                const canFinish = inventario.estado === 'EN_PROCESO';
                const canDelete = inventario.estado === 'EN_PROCESO';

                return (
                  <tr key={inventario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{inventario.nombre}</div>
                        {inventario.descripcion && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {inventario.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.color}`}
                      >
                        <span className="mr-1">{estadoConfig.icon}</span>
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{inventario.total_productos}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inventario.almacenes?.nombre || 'Todos'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(inventario.fecha_inicio)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inventario.User?.name || inventario.User?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {canEdit && (
                          <button
                            onClick={() => onCapturar(inventario)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Capturar cantidades"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                        {canFinish && (
                          <button
                            onClick={() => onFinalizar(inventario.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Finalizar inventario y aplicar ajustes"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => onDelete(inventario.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => onPageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

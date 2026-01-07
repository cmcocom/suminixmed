'use client';

import { useAuthRbac } from '@/hooks/useAuthRbac';
import { api } from '@/lib/fetcher';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSalidasList } from './hooks/useSalidasList';

// Hook personalizado para debounce en búsquedas
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SalidasPage() {
  const router = useRouter();
  const { salidas, loading, pagination, fetchSalidas } = useSalidasList();
  const { hasAnyRole } = useAuthRbac();

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy] = useState('folio'); // ✅ Ordenar por folio por defecto
  const [sortOrder] = useState<'asc' | 'desc'>('desc'); // DESC para mostrar folios recientes primero (mayor a menor)

  // Estados para eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salidaToDelete, setSalidaToDelete] = useState<any>(null);

  // Debounce del término de búsqueda (300ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Verificar si el usuario puede eliminar salidas (solo ADMINISTRADOR o UNIDADC)
  const puedeEliminarSalidas = hasAnyRole(['ADMINISTRADOR', 'UNIDADC']);
  // Verificar si el usuario puede EDITAR salidas (solo UNIDADC)
  const puedeEditarSalidas = hasAnyRole(['UNIDADC']);

  // Cargar datos desde el servidor con los filtros y paginación actuales
  const loadData = useCallback(() => {
    fetchSalidas({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm,
      sortBy,
      sortOrder,
    });
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder, fetchSalidas]);

  // Efecto para cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Resetear a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    // Siempre llevar a la primera página al cambiar el término de búsqueda
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Función para abrir modal de confirmación
  const handleDeleteClick = (salida: any) => {
    setSalidaToDelete(salida);
    setShowDeleteModal(true);
  };

  // Función para eliminar salida
  const handleDeleteConfirm = async () => {
    if (!salidaToDelete) return;

    setDeletingId(salidaToDelete.id);
    try {
      const response = await api.del(`/api/salidas/${salidaToDelete.id}`);

      const data = await response.json();

      if (!response.ok) {
        // Si hay productos que quedarían en negativo, mostrar mensaje específico
        if (data.detalles && Array.isArray(data.detalles)) {
          const detallesFormateados = data.detalles.join('\n');
          throw new Error(`${data.error}\n\nDetalles:\n${detallesFormateados}`);
        }
        throw new Error(data.error || 'Error al eliminar la salida');
      }

      // Recargar datos actuales
      loadData();

      // Cerrar modal
      setShowDeleteModal(false);
      setSalidaToDelete(null);

      // Mostrar mensaje de éxito
      alert('Salida eliminada exitosamente. El inventario ha sido revertido.');
    } catch (error: any) {
      console.error('Error al eliminar salida:', error);
      alert(error.message || 'Error al eliminar la salida. Por favor, intente nuevamente.');
    } finally {
      setDeletingId(null);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Mostrar spinner de carga solo en la primera carga (sin datos) para evitar perder el foco
  if (loading && salidas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Salidas de Inventario</h1>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, tipo, clave o nombre de cliente, observaciones..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer"
                aria-label="Seleccionar cantidad de elementos por página"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">por página</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/salidas/nueva')}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Salida
          </button>
        </div>
      </div>

      {salidas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            {searchTerm
              ? 'No se encontraron salidas con ese criterio'
              : 'No hay salidas registradas'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push('/dashboard/salidas/nueva')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear primera salida
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">
                      Folio
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-28">
                      Fecha
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-32">
                      Tipo
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-40">
                      Cliente
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-48">
                      Observaciones
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">
                      Estado
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salidas.map((salida: any) => (
                    <tr key={salida.id} className="hover:bg-gray-50 align-top">
                      <td className="px-2 py-3 w-20">
                        <span className="text-xs font-bold text-orange-900 block truncate">
                          {salida.serie ? `${salida.serie}-${salida.folio}` : salida.folio || 'S/N'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-900 w-28">
                        <div className="text-xs">
                          {format(new Date(salida.fechaCreacion), 'dd/MM/yyyy', { locale: es })}
                          <br />
                          <span className="text-gray-500">
                            {format(new Date(salida.fechaCreacion), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 w-32">
                        <span
                          className="block truncate"
                          title={salida.tipo_salida_rel?.nombre || salida.motivo || 'Sin tipo'}
                        >
                          {salida.tipo_salida_rel?.nombre || salida.motivo || 'Sin tipo'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs w-40">
                        {salida.cliente ? (
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              {salida.cliente.clave && (
                                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono font-semibold shrink-0">
                                  {salida.cliente.clave}
                                </span>
                              )}
                              <span
                                className="font-semibold text-gray-900 truncate flex-1 text-xs"
                                title={salida.cliente.nombre}
                              >
                                {salida.cliente.nombre}
                              </span>
                            </div>
                            {salida.cliente.empresa && (
                              <span
                                className="text-xs text-gray-600 truncate"
                                title={salida.cliente.empresa}
                              >
                                {salida.cliente.empresa}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Sin cliente</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-600 w-48">
                        <div className="w-full">
                          {salida.observaciones ? (
                            <div
                              className="observaciones-multiline text-xs"
                              title={salida.observaciones}
                            >
                              {salida.observaciones}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs w-20">
                        <span
                          className={`px-1.5 py-1 rounded text-xs font-medium block text-center ${
                            salida.estado === 'COMPLETADA'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {salida.estado === 'COMPLETADA' ? 'OK' : 'PEND'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs w-20">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/salidas/${salida.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <span className="text-gray-300">|</span>
                          {puedeEditarSalidas && (
                            <button
                              onClick={() => router.push(`/dashboard/salidas/${salida.id}/editar`)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium whitespace-nowrap"
                              title="Editar salida"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {puedeEliminarSalidas && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleDeleteClick(salida)}
                                disabled={deletingId === salida.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Eliminar salida"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md mt-4 px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Información de resultados */}
                <div className="text-sm text-gray-600">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de <span className="font-medium">{pagination.total}</span> resultados
                </div>

                {/* Controles de paginación */}
                <div className="flex items-center gap-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Números de página */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) =>
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum as number)}
                          className={`min-w-[40px] px-3 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white font-medium'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                  </div>

                  {/* Botón Siguiente */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                    }
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && salidaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Salida</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                ¿Está seguro que desea eliminar la siguiente salida?
              </p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">
                  Folio:{' '}
                  {salidaToDelete.serie
                    ? `${salidaToDelete.serie}-${salidaToDelete.folio}`
                    : salidaToDelete.folio}
                </p>
                <p className="text-gray-600">
                  Tipo: {salidaToDelete.tipo_salida_rel?.nombre || 'Sin tipo'}
                </p>
                <p className="text-gray-600">
                  Cliente: {salidaToDelete.cliente?.nombre || 'Sin cliente'}
                </p>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Importante:</strong> Esta acción eliminará la salida y devolverá el
                  inventario de todos los productos a su estado anterior.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSalidaToDelete(null);
                }}
                disabled={deletingId !== null}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingId ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Eliminar Salida
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import apiFetch from '@/lib/fetcher';

interface Producto {
  id: string;
  clave: string | null;
  descripcion: string;
  cantidad: number;
  updatedAt: string | null;
  punto_reorden: number;
  cantidad_minima: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ProductosStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'agotados' | 'por-agotarse' | 'sobre-stock';
  title: string;
}

export function ProductosStockModal({ isOpen, onClose, tipo, title }: ProductosStockModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Cargar productos cuando se abre el modal o cambia la página
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const doFetch = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/api/indicadores/productos-stock?tipo=${tipo}&page=${pagination.page}&limit=${pagination.limit}`,
          { method: 'GET' },
          45000
        );

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          setProductos(data.data || []);
          // actualizar información de paginación desde el servidor
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        }
      } catch (error) {
        // Mantener el log para debug; el logger centralizado puede reemplazarlo más adelante
        console.error('Error al cargar productos:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void doFetch();

    return () => {
      mounted = false;
    };
  }, [isOpen, tipo, pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleClose = () => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset a página 1
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total: {pagination.total} producto{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors"
              title="Cerrar"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">No hay productos</p>
              <p className="text-sm text-gray-500 mt-1">
                {tipo === 'agotados'
                  ? 'No hay productos agotados en este momento'
                  : 'No hay productos por agotarse en este momento'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {productos.map((producto, index) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-500">
                            #{(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {producto.descripcion}
                          </h3>
                        </div>
                        {producto.clave && (
                          <p className="text-sm text-gray-600 mt-1">
                            Clave: <span className="font-medium">{producto.clave}</span>
                          </p>
                        )}
                        {(producto.punto_reorden > 0 || producto.cantidad_minima > 0) && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            Umbral: {producto.punto_reorden || producto.cantidad_minima}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            producto.cantidad === 0
                              ? 'bg-red-100 text-red-800'
                              : producto.cantidad <= 5
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {producto.cantidad === 0
                            ? '⛔ Agotado'
                            : `⚠️ ${producto.cantidad} unidades`}
                        </span>
                        {producto.updatedAt && (
                          <span className="text-xs text-gray-400">
                            Actualizado: {new Date(producto.updatedAt).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con paginación */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}{' '}
                - {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

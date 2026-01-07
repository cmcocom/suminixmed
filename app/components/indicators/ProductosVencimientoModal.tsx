'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import apiFetch from '@/lib/fetcher';

interface Producto {
  id: string;
  clave: string | null;
  descripcion: string;
  categoria: string;
  numero_lote: string | null;
  fecha_vencimiento: Date | null;
  cantidad_disponible: number;
  folio_entrada: string;
  fecha_entrada: Date | null;
  dias_para_vencer: number | null;
}

interface ProductosVencimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'vencidos' | 'proximos-vencer';
}

export default function ProductosVencimientoModal({
  isOpen,
  onClose,
  tipo,
}: ProductosVencimientoModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const doFetch = async () => {
      try {
        setLoading(true);
        const url = `/api/indicadores/productos-vencimiento?tipo=${tipo}&page=${currentPage}&limit=${itemsPerPage}`;
        const response = await apiFetch(url, { method: 'GET' }, 45000);

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          setProductos(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void doFetch();

    return () => {
      mounted = false;
    };
  }, [isOpen, currentPage, tipo, itemsPerPage]);

  const handleClose = () => {
    setCurrentPage(1);
    onClose();
  };

  if (!isOpen) return null;

  const titulo = tipo === 'vencidos' ? 'Productos Vencidos' : 'Productos Próximos a Vencer';
  const IconoTipo = tipo === 'vencidos' ? ExclamationTriangleIcon : ClockIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            tipo === 'vencidos' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <IconoTipo
              className={`h-8 w-8 ${tipo === 'vencidos' ? 'text-red-600' : 'text-orange-600'}`}
            />
            <div>
              <h2
                className={`text-2xl font-bold ${tipo === 'vencidos' ? 'text-red-900' : 'text-orange-900'}`}
              >
                {titulo}
              </h2>
              <p className={`text-sm ${tipo === 'vencidos' ? 'text-red-600' : 'text-orange-600'}`}>
                {tipo === 'vencidos'
                  ? 'Productos cuya fecha de vencimiento ya pasó'
                  : 'Productos que vencen en los próximos 30 días'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <IconoTipo className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                No hay productos {tipo === 'vencidos' ? 'vencidos' : 'próximos a vencer'}
              </p>
              <p className="text-sm mt-2">
                {tipo === 'vencidos'
                  ? 'Todos los lotes están dentro de su fecha de caducidad'
                  : 'No hay lotes que venzan en los próximos 30 días'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vencimiento
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Días
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productos.map((producto) => (
                    <tr key={`${producto.id}-${producto.numero_lote}`} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {producto.descripcion}
                          </span>
                          {producto.clave && (
                            <span className="text-xs text-gray-500">{producto.clave}</span>
                          )}
                          <span className="text-xs text-gray-400 mt-1">{producto.categoria}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            producto.numero_lote
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {producto.numero_lote || 'Sin lote'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {producto.fecha_vencimiento
                          ? format(new Date(producto.fecha_vencimiento), 'dd/MM/yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {producto.dias_para_vencer !== null && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              producto.dias_para_vencer < 0
                                ? 'bg-red-100 text-red-800'
                                : producto.dias_para_vencer <= 7
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {producto.dias_para_vencer < 0
                              ? `Vencido hace ${Math.abs(producto.dias_para_vencer)} días`
                              : `${producto.dias_para_vencer} días`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {producto.cantidad_disponible}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-900 font-medium">
                            {producto.folio_entrada}
                          </span>
                          {producto.fecha_entrada && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(producto.fecha_entrada), 'dd/MM/yyyy', {
                                locale: es,
                              })}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con paginación */}
        {!loading && productos.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

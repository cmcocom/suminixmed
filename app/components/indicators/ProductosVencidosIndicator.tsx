'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ProductosVencimientoModal from './ProductosVencimientoModal';
import apiFetch from '@/lib/fetcher';

export default function ProductosVencidosIndicator() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [manejaLotes, setManejaLotes] = useState<boolean>(false);

  useEffect(() => {
    fetchCount();
    // Refrescar cada 5 minutos
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const response = await apiFetch(
        '/api/indicadores/productos-vencimiento',
        { method: 'POST' },
        45000
      );

      if (response.ok) {
        const data = await response.json();
        setCount(data.vencidos || 0);
        setManejaLotes(data.manejaLotes || false);
      }
    } catch (error) {
      console.error('Error al obtener contador de productos vencidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // No renderizar si no se manejan lotes
  if (!loading && !manejaLotes) {
    return null;
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Productos Vencidos</p>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-red-600">{count}</p>
              )}
              <span className="text-sm text-gray-500">lotes</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Fecha de vencimiento expirada</p>
          </div>
          <div className="ml-4">
            <div className="bg-red-100 rounded-full p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {count > 0 && (
          <div className="mt-4 pt-4 border-t border-red-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                ⚠️ Acción inmediata requerida
              </span>
              <span className="text-xs text-gray-500">Click para ver detalles</span>
            </div>
          </div>
        )}
      </div>

      <ProductosVencimientoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tipo="vencidos"
      />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import ProductosVencimientoModal from './ProductosVencimientoModal';
import apiFetch from '@/lib/fetcher';

export default function ProductosProximosVencerIndicator() {
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
        setCount(data.proximosVencer || 0);
        setManejaLotes(data.manejaLotes || false);
      }
    } catch (error) {
      console.error('Error al obtener contador de productos próximos a vencer:', error);
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
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Productos Próximos a Vencer</p>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-orange-600">{count}</p>
              )}
              <span className="text-sm text-gray-500">lotes</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Vencen en los próximos 30 días</p>
          </div>
          <div className="ml-4">
            <div className="bg-orange-100 rounded-full p-3">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {count > 0 && (
          <div className="mt-4 pt-4 border-t border-orange-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-full">
                Requiere atención
              </span>
              <span className="text-xs text-gray-500">Click para ver detalles</span>
            </div>
          </div>
        )}
      </div>

      <ProductosVencimientoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tipo="proximos-vencer"
      />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ProductosStockModal } from './ProductosStockModal';
import apiFetch from '@/lib/fetcher';

interface ProductosPorAgotarseIndicatorProps {
  className?: string;
}

export function ProductosPorAgotarseIndicator({
  className = '',
}: ProductosPorAgotarseIndicatorProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCount();
  }, []);

  const loadCount = async () => {
    try {
      setLoading(true);
      // Puede ser una consulta pesada; ampliar timeout
      const response = await apiFetch(
        '/api/indicadores/productos-stock',
        { method: 'POST' },
        45000
      );

      if (response.ok) {
        const data = await response.json();
        setCount(data.data.porAgotarse || 0);
      }
    } catch (error) {
      console.error('Error al cargar conteo de productos por agotarse:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-md border-2 border-yellow-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-yellow-50 rounded-xl">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Productos</p>
            <p className="text-2xl font-bold text-yellow-600">
              {loading ? <span className="inline-block animate-pulse">...</span> : count}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Por Agotarse</h3>
          <div className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-full">
            ⚠️ Punto de Reorden
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {loading ? 'Cargando...' : count === 0 ? '¡Stock saludable!' : 'Momento de reordenar'}
        </p>
      </div>

      <ProductosStockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tipo="por-agotarse"
        title="Productos por Agotarse"
      />
    </>
  );
}

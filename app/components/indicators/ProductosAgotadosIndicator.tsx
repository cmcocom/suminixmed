'use client';

import { useState, useEffect } from 'react';
import { ProductosStockModal } from './ProductosStockModal';
import apiFetch from '@/lib/fetcher';

interface ProductosAgotadosIndicatorProps {
  className?: string;
}

export function ProductosAgotadosIndicator({ className = '' }: ProductosAgotadosIndicatorProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCount();
  }, []);

  const loadCount = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        '/api/indicadores/productos-stock',
        { method: 'POST' },
        45000
      );

      if (response.ok) {
        const data = await response.json();
        setCount(data.data.agotados || 0);
      }
    } catch (error) {
      console.error('Error al cargar conteo de productos agotados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-md border-2 border-red-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Productos</p>
            <p className="text-2xl font-bold text-red-600">
              {loading ? <span className="inline-block animate-pulse">...</span> : count}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Productos Agotados</h3>
          <div className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
            ⛔ Sin Stock
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {loading ? 'Cargando...' : count === 0 ? '¡Todo bien!' : 'Click para ver detalles'}
        </p>
      </div>

      <ProductosStockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tipo="agotados"
        title="Productos Agotados"
      />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ProductosStockModal } from './ProductosStockModal';
import apiFetch from '@/lib/fetcher';

interface ProductosSobreStockIndicatorProps {
  className?: string;
}

export function ProductosSobreStockIndicator({
  className = '',
}: ProductosSobreStockIndicatorProps) {
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
        setCount(data.data.sobreStock || 0);
      }
    } catch (error) {
      console.error('Error al cargar conteo de productos con exceso de stock:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-md border-2 border-blue-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Productos</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? <span className="inline-block animate-pulse">...</span> : count}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Exceso de Stock</h3>
          <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
            📦 Sobre Máximo
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {loading ? 'Cargando...' : count === 0 ? '¡Stock controlado!' : 'Sobre cantidad máxima'}
        </p>
      </div>

      <ProductosStockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tipo="sobre-stock"
        title="Productos con Exceso de Stock"
      />
    </>
  );
}

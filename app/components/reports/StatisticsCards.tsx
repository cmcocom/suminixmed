/**
 * Componente de tarjetas estadísticas para reportes de inventario
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Muestra métricas clave del inventario de forma visual
 */

'use client';

import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Inventario, calculateInventoryStats, formatPriceMX } from '@/lib/report-utils';

interface StatisticsCardsProps {
  data: Inventario[];
  className?: string;
}

export default function StatisticsCards({ data, className = '' }: StatisticsCardsProps) {
  const stats = calculateInventoryStats(data);

  const cards = [
    {
      title: 'Total Productos',
      value: stats.totalItems.toLocaleString(),
      icon: '📦',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Productos en inventario',
    },
    {
      title: 'Valor Total',
      value: formatPriceMX(stats.totalValue),
      icon: '💰',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Valor del inventario',
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockCount.toLocaleString(),
      icon: '⚠️',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      description: 'Productos con stock ≤ 10',
      alert: stats.lowStockCount > 0,
    },
    {
      title: 'Vencidos',
      value: stats.expiredCount.toLocaleString(),
      icon: '⏰',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      description: 'Productos vencidos',
      alert: stats.expiredCount > 0,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
            card.alert ? 'ring-2 ring-yellow-200 ring-opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor} mb-1`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
            <div
              className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center text-2xl`}
            >
              {card.icon}
            </div>
          </div>

          {/* Indicador de alerta */}
          {card.alert && (
            <div className="mt-3 flex items-center text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-yellow-700 font-medium">Requiere atención</span>
            </div>
          )}
        </div>
      ))}

      {/* Tarjeta adicional con resumen de estados */}
      <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
          Resumen por Estados
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.availableCount}</div>
            <div className="text-xs text-gray-600">Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.outOfStockCount}</div>
            <div className="text-xs text-gray-600">Agotados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.lowStockCount}</div>
            <div className="text-xs text-gray-600">Stock Bajo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.expiredCount}</div>
            <div className="text-xs text-gray-600">Vencidos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.round((stats.availableCount / (stats.totalItems || 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Disponibilidad</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// MEJORAS SUGERIDAS:
// 1. Gráficos pequeños tipo sparkline para tendencias
// 2. Comparación con período anterior
// 3. Alertas configurables por umbral
// 4. Exportación de métricas a dashboard principal

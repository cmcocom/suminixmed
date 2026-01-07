'use client';

import React from 'react';

interface PaginationComponentProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PaginationComponent: React.FC<PaginationComponentProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  if (totalPages <= 1) return null;

  return (
    <div className={`mt-4 flex justify-between items-center ${className}`}>
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
        <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> de{' '}
        <span className="font-medium">{totalItems}</span> resultados
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded-md ${
              currentPage === number
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
            aria-label={`Página ${number}`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

'use client';

import React from 'react';

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  filterLabel?: string;
  searchPlaceholder?: string;
  showAll?: boolean;
  onShowAllChange?: (value: boolean) => void;
  className?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchValue,
  onSearchChange,
  filterValue = '',
  onFilterChange,
  filterOptions = [],
  filterLabel = 'Filtrar',
  searchPlaceholder = 'Buscar...',
  showAll = false,
  onShowAllChange,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 ${className}`}>
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label={searchPlaceholder}
        name="search"
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
      />

      {filterOptions.length > 0 && onFilterChange && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
          aria-label={filterLabel}
        >
          <option value="">{filterLabel}</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {onShowAllChange && (
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => onShowAllChange(e.target.checked)}
            aria-label="Mostrar todos"
            name="showAll"
            className="mr-2"
          />
          Mostrar todos
        </label>
      )}
    </div>
  );
};

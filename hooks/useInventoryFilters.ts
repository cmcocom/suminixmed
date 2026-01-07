/**
 * Hook personalizado para manejo de filtros de inventario
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza la lógica de filtrado para reutilización
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Inventario, Categoria, ReportFilters, normalizeText } from '@/lib/report-utils';
import { crearFechaLocal } from '@/lib/timezone-utils';

interface UseInventoryFiltersOptions {
  inventarios: Inventario[];
  categorias: Categoria[];
  initialFilters?: Partial<ReportFilters>;
}

interface UseInventoryFiltersReturn {
  filters: ReportFilters;
  filteredData: Inventario[];
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  clearFilters: () => void;
  updateFilter: (key: keyof ReportFilters, value: string | number | '') => void;
  filtersCount: number;
  hasActiveFilters: boolean;
}

const defaultFilters: ReportFilters = {
  categoria: '',
  estado: '',
  fechaIngresoDesde: '',
  fechaIngresoHasta: '',
  fechaVencimientoDesde: '',
  fechaVencimientoHasta: '',
  proveedor: '',
  cantidadMinima: '',
  cantidadMaxima: '',
  precioMinimo: '',
  precioMaximo: '',
};

export function useInventoryFilters({
  inventarios,
  categorias,
  initialFilters = {},
}: UseInventoryFiltersOptions): UseInventoryFiltersReturn {
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const [filteredData, setFilteredData] = useState<Inventario[]>(inventarios);

  // Función para aplicar filtros - EXTRAÍDA y optimizada de página original
  const applyFilters = useCallback(() => {
    let filtered = [...inventarios];

    // Filtro por categoría (mejorado con normalización) - PRESERVADO de original
    if (filters.categoria) {
      filtered = filtered.filter((item) => {
        const selectedCategory = categorias.find((c) => c.id === filters.categoria);
        if (!selectedCategory) return false;

        const categoryName = normalizeText(selectedCategory.nombre);
        const itemCategoryName = normalizeText(item.categoria);
        const itemCategoryRelationName = normalizeText(item.categoriaRelacion?.nombre || '');

        return (
          categoryName === itemCategoryName ||
          categoryName === itemCategoryRelationName ||
          item.categoriaRelacion?.id === filters.categoria
        );
      });
    }

    // Filtro por estado - PRESERVADO
    if (filters.estado) {
      filtered = filtered.filter((item) => item.estado === filters.estado);
    }

    // Filtro por proveedor (mejorado con normalización) - PRESERVADO
    if (filters.proveedor) {
      filtered = filtered.filter((item) => {
        const proveedorNormalized = normalizeText(filters.proveedor);
        const itemProveedorNormalized = normalizeText(item.proveedor || '');
        return itemProveedorNormalized.includes(proveedorNormalized);
      });
    }

    // Filtros por fecha de ingreso (usando función de zona horaria unificada)
    if (filters.fechaIngresoDesde) {
      const fechaDesde = crearFechaLocal(filters.fechaIngresoDesde, true);
      filtered = filtered.filter((item) => new Date(item.fechaIngreso) >= fechaDesde);
    }
    if (filters.fechaIngresoHasta) {
      const fechaHasta = crearFechaLocal(filters.fechaIngresoHasta, false);
      filtered = filtered.filter((item) => new Date(item.fechaIngreso) <= fechaHasta);
    }

    // Filtros por fecha de vencimiento (usando función de zona horaria unificada)
    if (filters.fechaVencimientoDesde) {
      const fechaDesde = crearFechaLocal(filters.fechaVencimientoDesde, true);
      filtered = filtered.filter(
        (item) => item.fechaVencimiento && new Date(item.fechaVencimiento) >= fechaDesde
      );
    }
    if (filters.fechaVencimientoHasta) {
      const fechaHasta = crearFechaLocal(filters.fechaVencimientoHasta, false);
      filtered = filtered.filter(
        (item) => item.fechaVencimiento && new Date(item.fechaVencimiento) <= fechaHasta
      );
    }

    // Filtros por cantidad - PRESERVADOS
    if (filters.cantidadMinima !== '') {
      filtered = filtered.filter((item) => item.cantidad >= Number(filters.cantidadMinima));
    }
    if (filters.cantidadMaxima !== '') {
      filtered = filtered.filter((item) => item.cantidad <= Number(filters.cantidadMaxima));
    }

    // Filtros por precio - PRESERVADOS
    if (filters.precioMinimo !== '') {
      filtered = filtered.filter((item) => item.precio >= Number(filters.precioMinimo));
    }
    if (filters.precioMaximo !== '') {
      filtered = filtered.filter((item) => item.precio <= Number(filters.precioMaximo));
    }

    setFilteredData(filtered);
  }, [inventarios, filters, categorias]);

  // Aplicar filtros cuando cambien los datos o filtros
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Función para limpiar filtros - EXTRAÍDA de original
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Función para actualizar un filtro específico
  const updateFilter = useCallback((key: keyof ReportFilters, value: string | number | '') => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Contar filtros activos
  const filtersCount = Object.values(filters).filter((value) => value !== '' && value !== 0).length;
  const hasActiveFilters = filtersCount > 0;

  return {
    filters,
    filteredData,
    setFilters,
    clearFilters,
    updateFilter,
    filtersCount,
    hasActiveFilters,
  };
}

export default useInventoryFilters;

// OPTIMIZACIÓN SUGERIDA PARA BACKEND:
// Este hook sería ideal convertirlo para trabajar con:
// 1. Server-side filtering via API endpoints
// 2. Debounced search para evitar múltiples llamadas
// 3. Paginación para inventarios grandes
// 4. Caché de resultados filtrados con React Query o SWR

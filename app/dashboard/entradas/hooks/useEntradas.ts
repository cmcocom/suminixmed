'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/fetcher';

export interface EntradaInventario {
  id: string;
  motivo: string;
  observaciones: string | null;
  total: number;
  estado: string;
  fecha_creacion: string;
  userId: number;
  serie: string;
  folio: number | null;
  tipo_entrada_rel: {
    nombre: string;
    descripcion: string | null;
  } | null;
  proveedor: {
    id: string;
    nombre: string;
    razon_social: string | null;
    rfc: string | null;
  } | null;
  partidas: {
    inventarioId: number;
    cantidad: number;
    precio: number;
    inventario: {
      nombre: string;
    };
  }[];
}

// Metadata de paginación
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function useEntradasList() {
  const [entradas, setEntradas] = useState<EntradaInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchEntradas = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      try {
        setLoading(true);
        setError(null);

        // Construir URL con parámetros
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.search) searchParams.set('search', params.search);
        if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

        const url = `/api/entradas?${searchParams.toString()}`;
        const response = await api.get(url);

        if (!response.ok) {
          throw new Error('Error al obtener las entradas');
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setEntradas(result.data);

          // Actualizar metadata de paginación
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        logger.error('Error cargando entradas:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createEntrada = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/entradas', formData);

      const result = await response.json();

      if (!response.ok) {
        // Extraer el mensaje de error del backend
        const errorMsg = result.error || result.details || 'Error al crear la entrada';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la entrada';
      setError(errorMessage);
      // No limpiar el error aquí, dejarlo visible para el usuario
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entradas,
    loading,
    error,
    pagination,
    fetchEntradas,
    createEntrada,
  };
}

// Alias para compatibilidad con código existente
export const useEntradas = useEntradasList;

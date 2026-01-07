'use client';

import { api } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';

export interface SalidaInventario {
  id: string;
  motivo: string;
  observaciones: string | null;
  total: number;
  estado: string;
  fechaCreacion: string;
  userId: number;
  serie: string;
  folio: number | null;
  tipo_salida_rel: {
    nombre: string;
    descripcion: string | null;
  } | null;
  cliente: {
    id: string;
    nombre: string;
    empresa: string | null;
    rfc: string | null;
    clave: string | null;
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

export function useSalidasList() {
  const [salidas, setSalidas] = useState<SalidaInventario[]>([]);
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

  const fetchSalidas = useCallback(
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

        const url = `/api/salidas?${searchParams.toString()}`;
        const response = await api.get(url);

        if (!response.ok) {
          throw new Error('Error al obtener las salidas');
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setSalidas(result.data);

          // Actualizar metadata de paginación
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        logger.error('Error cargando salidas:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createSalida = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/salidas', formData);

      const result = await response.json();

      if (!response.ok) {
        // Extraer el mensaje de error del backend
        const errorMsg = result.error || result.details || 'Error al crear la salida';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la salida';
      setError(errorMessage);
      // No limpiar el error aquí, dejarlo visible para el usuario
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    salidas,
    loading,
    error,
    pagination,
    fetchSalidas,
    createSalida,
  };
}

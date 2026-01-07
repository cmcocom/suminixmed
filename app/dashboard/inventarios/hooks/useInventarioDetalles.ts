/**
 * @fileoverview Hook useInventarioDetalles
 * @description Hook para gestión de detalles de inventario físico
 * @date 2025-10-07
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/fetcher';
import type { InventarioFisicoDetalle } from '../utils/inventarios.types';
import { MESSAGES } from '../utils/inventarios.constants';
import { calcularDiferencia } from '../utils/inventarios.utils';

export function useInventarioDetalles(inventarioId: string | null) {
  const [detalles, setDetalles] = useState<InventarioFisicoDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDetalles = useCallback(async () => {
    if (!inventarioId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/inventarios-fisicos/${inventarioId}/detalles`);
      if (!response.ok) throw new Error('Error al cargar detalles');

      const data = await response.json();
      setDetalles(data.data || []);
    } catch (error) {
      toast.error(MESSAGES.ERROR.LOAD);
    } finally {
      setLoading(false);
    }
  }, [inventarioId]);

  useEffect(() => {
    fetchDetalles();
  }, [fetchDetalles]);

  const updateCantidadContada = useCallback(
    async (detalleId: string, cantidadContada: number | null, observaciones?: string) => {
      try {
        const detalle = detalles.find((d) => d.id === detalleId);
        if (!detalle) return;

        const diferencia = calcularDiferencia(cantidadContada, detalle.cantidad_sistema);

        const response = await api.put(
          `/api/inventarios-fisicos/${inventarioId}/detalles/${detalleId}`,
          {
            cantidad_contada: cantidadContada,
            diferencia,
            observaciones: observaciones || null,
          }
        );

        if (!response.ok) throw new Error('Error al actualizar detalle');

        // Actualizar estado local
        setDetalles((prev) =>
          prev.map((d) =>
            d.id === detalleId
              ? {
                  ...d,
                  cantidad_contada: cantidadContada,
                  diferencia,
                  observaciones: observaciones || null,
                }
              : d
          )
        );

        return true;
      } catch (error) {
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    [detalles, inventarioId]
  );

  const filteredDetalles = detalles.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.producto?.nombre.toLowerCase().includes(term) ||
      d.producto?.codigo_barras?.toLowerCase().includes(term) ||
      d.producto?.categoria?.toLowerCase().includes(term)
    );
  });

  return {
    detalles,
    filteredDetalles,
    loading,
    searchTerm,
    setSearchTerm,
    fetchDetalles,
    updateCantidadContada,
  };
}

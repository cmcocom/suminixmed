'use client';

import { useState } from 'react';
import { api } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';
import { CreateSalidaInput } from '../types';

export function useSalidas() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSalida = async (data: CreateSalidaInput) => {
    try {
      setLoading(true);
      setError(null);

      // Construir el payload con los datos correctos
      const payload = {
        tipo_salida_id: data.tipo_salida_id,
        cliente_id: data.cliente_id,
        observaciones: data.observaciones || '',
        referencia_externa: data.referencia_externa,
        fecha_captura: data.fecha_captura, // Incluir fecha de captura
        folio: data.folio, // Incluir folio personalizado
        partidas: data.partidas.map((p) => ({
          inventarioId: p.producto_id, // String ID (ej: "PROD-00385")
          cantidad: p.cantidad,
          precio: p.precio,
          // Pasar info de lote si existe
          ...(p.lote_entrada_id && { lote_entrada_id: p.lote_entrada_id }),
          ...(p.numero_lote && { numero_lote: p.numero_lote }),
          ...(p.fecha_vencimiento_lote && { fecha_vencimiento_lote: p.fecha_vencimiento_lote }),
        })),
      };

      const response = await api.post('/api/salidas', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // Extraer el mensaje de error del backend
        const errorMsg = result.error || result.details || 'Error al crear la salida';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Solo redirigir si no hubo error
      router.push('/dashboard/salidas');
      router.refresh(); // Forzar refresh de la página
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la salida';
      setError(errorMessage);
      // No limpiar el error aquí, dejarlo visible para el usuario
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSalida,
    loading,
    error,
  };
}

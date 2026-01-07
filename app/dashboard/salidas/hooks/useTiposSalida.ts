'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { TipoSalida } from '../types';
import { logger } from '@/lib/logger';

export function useTiposSalida() {
  const [tipos, setTipos] = useState<TipoSalida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/tipos-salida');

        if (!response.ok) {
          throw new Error('Error al cargar tipos de salida');
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setTipos(result.data);
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        logger.error('Error cargando tipos de salida:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  }, []);

  return { tipos, loading, error };
}

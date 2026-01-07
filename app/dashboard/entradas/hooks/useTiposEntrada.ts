'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { TipoEntrada } from '../types';

export function useTiposEntrada() {
  const [tipos, setTipos] = useState<TipoEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTipos() {
      try {
        setLoading(true);
        const response = await api.get('/api/tipos-entrada');

        if (!response.ok) {
          throw new Error('Error al cargar tipos de entrada');
        }

        const data = await response.json();

        if (data.success) {
          setTipos(data.data);
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar tipos');
      } finally {
        setLoading(false);
      }
    }

    fetchTipos();
  }, []);

  return { tipos, loading, error };
}

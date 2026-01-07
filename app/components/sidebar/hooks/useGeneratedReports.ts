import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UseGeneratedReportsReturn, GeneratedReport } from '../types';
import { api } from '@/lib/fetcher';

/**
 * Hook personalizado para gestionar reportes generados dinámicamente
 *
 * Maneja:
 * - Carga inicial de reportes desde la API
 * - Estado de carga y errores
 * - Función de recarga manual
 * - Logging para debugging
 *
 * @returns Objeto con reportes y funciones de gestión
 */
export function useGeneratedReports(): UseGeneratedReportsReturn {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  /**
   * Carga los reportes generados desde la API
   */
  const loadGeneratedReports = useCallback(async () => {
    if (!session?.user) {
      setGeneratedReports([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/menu/reports');

      if (response.ok) {
        const reports = await response.json();
        setGeneratedReports(reports);
      } else {
        const errorMessage = `Error al cargar reportes: ${response.status} ${response.statusText}`;
        setError(errorMessage);
        setGeneratedReports([]);
      }
    } catch (error) {
      const errorMessage = 'Error al cargar reportes generados';
      setError(errorMessage);
      setGeneratedReports([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  /**
   * Función pública para recargar reportes manualmente
   */
  const refetch = useCallback(async () => {
    await loadGeneratedReports();
  }, [loadGeneratedReports]);

  // Efecto para cargar reportes cuando cambia la sesión
  useEffect(() => {
    loadGeneratedReports();
  }, [loadGeneratedReports]);

  return {
    generatedReports,
    loading,
    error,
    refetch,
  };
}

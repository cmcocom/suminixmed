/**
 * Hook para manejar la carga de datos de entradas, inventarios, proveedores y tipos
 * Centraliza toda la lógica de fetch y proporciona métodos de refetch
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import type {
  EntradaInventario,
  Inventario,
  Proveedor,
  TipoEntrada,
  UseEntradasDataReturn,
} from '../utils/entradas.types';
import { extractApiData, logApiCall } from '../utils/entradas.utils';

export const useEntradasData = (): UseEntradasDataReturn => {
  const { data: session } = useSession();
  const [entradas, setEntradas] = useState<EntradaInventario[]>([]);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [tiposEntrada, setTiposEntrada] = useState<TipoEntrada[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar inventarios
  const fetchInventarios = useCallback(async () => {
    try {
      logApiCall('/api/inventario', 'start');
      const response = await api.get('/api/inventario');
      if (response.ok) {
        const data = await response.json();
        logApiCall('/api/inventario', 'success', `${extractApiData(data).length} items`);

        const inventariosData = extractApiData(data) as Inventario[];
        setInventarios(inventariosData);
      } else {
        logApiCall('/api/inventario', 'error', `Status: ${response.status}`);
        setInventarios([]);
      }
    } catch (error) {
      logApiCall('/api/inventario', 'error', error);
      setInventarios([]);
    }
  }, []);

  // Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    try {
      logApiCall('/api/proveedores', 'start');
      const response = await api.get('/api/proveedores');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          logApiCall('/api/proveedores', 'success', `${result.data.length} items`);
          setProveedores(result.data);
        } else {
          logApiCall('/api/proveedores', 'error', result.error);
          setProveedores([]);
        }
      } else {
        logApiCall('/api/proveedores', 'error', `Status: ${response.status}`);
        setProveedores([]);
      }
    } catch (error) {
      logApiCall('/api/proveedores', 'error', error);
      setProveedores([]);
    }
  }, []);

  // Cargar tipos de entrada
  const fetchTiposEntrada = useCallback(async () => {
    try {
      logApiCall('/api/entradas/tipos', 'start');
      const response = await api.get('/api/entradas/tipos');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          logApiCall('/api/entradas/tipos', 'success', `${result.data.length} items`);
          setTiposEntrada(result.data);
        } else {
          logApiCall('/api/entradas/tipos', 'error', result.error);
          setTiposEntrada([]);
        }
      } else {
        logApiCall('/api/entradas/tipos', 'error', `Status: ${response.status}`);
        setTiposEntrada([]);
      }
    } catch (error) {
      logApiCall('/api/entradas/tipos', 'error', error);
      setTiposEntrada([]);
    }
  }, []);

  // Cargar entradas
  const fetchEntradas = useCallback(async () => {
    try {
      logApiCall('/api/entradas', 'start');
      const response = await api.get(`/api/entradas?limit=100`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          logApiCall('/api/entradas', 'success', `${result.data.length} items`);
          setEntradas(result.data);
        } else {
          logApiCall('/api/entradas', 'error', result.error);
          setEntradas([]);
        }
      } else {
        logApiCall('/api/entradas', 'error', `Status: ${response.status}`);
        setEntradas([]);
      }
    } catch (error) {
      logApiCall('/api/entradas', 'error', error);
      setEntradas([]);
    }
  }, []);

  // Función para recargar todos los datos
  const refetch = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchInventarios(),
        fetchProveedores(),
        fetchTiposEntrada(),
        fetchEntradas(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [session, fetchInventarios, fetchProveedores, fetchTiposEntrada, fetchEntradas]);

  // Cargar datos iniciales
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    entradas,
    inventarios,
    proveedores,
    tiposEntrada,
    loading,
    refetch,
  };
};

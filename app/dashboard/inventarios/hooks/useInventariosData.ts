/**
 * @fileoverview Hook useInventariosData
 * @description Hook personalizado para gestión de datos de inventarios físicos
 * @date 2025-10-07
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { api } from '@/lib/fetcher';
import type { InventarioFisico, Almacen, Producto } from '../utils/inventarios.types';
import { MESSAGES } from '../utils/inventarios.constants';

export function useInventariosData() {
  const [inventarios, setInventarios] = useState<InventarioFisico[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventarios = useCallback(async () => {
    try {
      const response = await api.get('/api/inventarios-fisicos');

      // Leer la respuesta una sola vez
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar inventarios');
      }

      setInventarios(data.data || []);
    } catch (error) {
      logger.error('Error cargando inventarios físicos:', error);
      toast.error(error instanceof Error ? error.message : MESSAGES.ERROR.LOAD);
    }
  }, []);

  const fetchAlmacenes = useCallback(async () => {
    try {
      const response = await api.get('/api/almacenes');

      // Leer la respuesta una sola vez
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar almacenes');
      }

      // La API de almacenes devuelve { almacenes }, no { data }
      setAlmacenes(data.almacenes || []);
    } catch (error) {
      logger.error('Error cargando almacenes:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar almacenes');
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      // Solicitar todos los productos con límite aumentado
      const response = await api.get('/api/inventario?limit=5000');

      // Leer la respuesta una sola vez
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar productos');
      }

      // La API de inventario devuelve { inventarios, pagination }, no { data }
      setProductos(data.inventarios || []);
    } catch (error) {
      logger.error('Error cargando productos:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al cargar productos del inventario'
      );
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Ejecutar las llamadas en paralelo pero manejar errores independientemente
      await Promise.allSettled([fetchInventarios(), fetchAlmacenes(), fetchProductos()]);
    } finally {
      setLoading(false);
    }
  }, [fetchInventarios, fetchAlmacenes, fetchProductos]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  return {
    inventarios,
    almacenes,
    productos,
    loading,
    refetch,
  };
}

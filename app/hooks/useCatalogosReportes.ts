'use client';
import { useState } from 'react';

export interface ProductoCatalogo {
  id: string;
  clave: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio: number;
  activo: boolean;
}

export interface ClienteCatalogo {
  cliente_id: string;
  nombre: string;
  clave: string;
  rfc: string;
}

export interface CategoriaCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}

// Hook para cargar catálogos de reportes
export const useCatalogosReportes = () => {
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [clientes, setClientes] = useState<ClienteCatalogo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función genérica para hacer fetch
  const fetchCatalogo = async <T>(tipo: string, limit?: number): Promise<T[]> => {
    const url = `/api/reportes/catalogos?tipo=${tipo}${limit ? `&limit=${limit}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al cargar ${tipo}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  };

  // Cargar productos
  const cargarProductos = async (limit?: number) => {
    try {
      setError(null);
      const data = await fetchCatalogo<ProductoCatalogo>('productos', limit);
      setProductos(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar productos: ${errorMessage}`);
      console.error('[REPORTES] Error cargando productos:', error);
      return [];
    }
  };

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      setError(null);
      const data = await fetchCatalogo<ClienteCatalogo>('clientes');
      setClientes(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar clientes: ${errorMessage}`);
      console.error('[REPORTES] Error cargando clientes:', error);
      return [];
    }
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      setError(null);
      const data = await fetchCatalogo<CategoriaCatalogo>('categorias');
      setCategorias(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar categorías: ${errorMessage}`);
      console.error('[REPORTES] Error cargando categorías:', error);
      return [];
    }
  };

  // Cargar todos los catálogos
  const cargarTodosCatalogos = async (limitProductos?: number) => {
    setLoading(true);
    try {
      await Promise.all([cargarProductos(limitProductos), cargarClientes(), cargarCategorias()]);
    } catch (error) {
      console.error('[REPORTES] Error cargando catálogos:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados
    productos,
    clientes,
    categorias,
    loading,
    error,

    // Funciones
    cargarProductos,
    cargarClientes,
    cargarCategorias,
    cargarTodosCatalogos,

    // Limpiar estados
    clearError: () => setError(null),
  };
};

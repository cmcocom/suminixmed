import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import apiFetch from '@/lib/fetcher';

interface Inventario {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precio: number;
  categoria?: string;
  proveedor?: string;
  estado?: string;
}

interface UseProductSearchProps {
  /** Si debe buscar solo productos con stock */
  onlyInStock?: boolean;
  /** Filtro por categoría */
  category?: string;
}

interface ProductSearchResult {
  products: Inventario[];
  loading: boolean;
  error: string | null;
  searchProducts: (term: string) => Promise<Inventario[]>;
  refreshProducts: () => Promise<void>;
}

export const useProductSearch = ({
  onlyInStock = false,
  category,
}: UseProductSearchProps = {}): ProductSearchResult => {
  const [products, setProducts] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para buscar productos en el servidor
  const searchProducts = useCallback(
    async (term: string): Promise<Inventario[]> => {
      if (!term || term.length < 2) {
        return products; // Devolver productos cacheados para búsquedas cortas
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search: term,
          limit: '20', // Límite para búsquedas
          ...(onlyInStock && { inStock: 'true' }),
          ...(category && category !== 'all' && { category }),
        });

        const response = await apiFetch(`/api/inventario?${params}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const searchResults = data.inventarios || [];

        // Actualizar cache local con los resultados
        setProducts((prev) => {
          const newProducts = [...prev];
          searchResults.forEach((newProduct: Inventario) => {
            const existingIndex = newProducts.findIndex((p) => p.id === newProduct.id);
            if (existingIndex >= 0) {
              newProducts[existingIndex] = newProduct;
            } else {
              newProducts.push(newProduct);
            }
          });
          return newProducts;
        });

        return searchResults;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error al buscar productos: ${errorMessage}`);
        logger.error('Error en búsqueda de productos:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [products, onlyInStock, category]
  );

  // Función para refrescar todos los productos
  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '100', // Límite mayor para carga inicial
        ...(onlyInStock && { inStock: 'true' }),
        ...(category && category !== 'all' && { category }),
      });

      const response = await apiFetch(`/api/inventario?${params}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.inventarios || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar productos: ${errorMessage}`);
      logger.error('Error al refrescar productos:', err);
    } finally {
      setLoading(false);
    }
  }, [onlyInStock, category]);

  return {
    products,
    loading,
    error,
    searchProducts,
    refreshProducts,
  };
};

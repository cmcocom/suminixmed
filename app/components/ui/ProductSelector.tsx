'use client';

import { MagnifyingGlassIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface Inventario {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precio: number;
  categoria?: string;
  proveedor?: string;
  estado?: string;
  clave?: string;
  clave2?: string;
}

interface ProductSelectorProps {
  /** Valor seleccionado (ID del producto) */
  value?: number;
  /** Callback cuando se selecciona un producto */
  onSelect: (product: Inventario | null) => void;
  /** Productos disponibles */
  products: Inventario[];
  /** Placeholder para el input de búsqueda */
  placeholder?: string;
  /** Si el componente está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Si debe mostrar el precio en los resultados */
  showPrice?: boolean;
  /** Si debe mostrar el stock en los resultados */
  showStock?: boolean;
  /** Si debe mostrar la categoría en los resultados */
  showCategory?: boolean;
  /** Máximo número de productos a mostrar en el dropdown */
  maxResults?: number;
  /** Filtrar solo productos con stock disponible */
  onlyInStock?: boolean;
  /** Callback para búsqueda del lado del servidor (opcional) */
  onServerSearch?: (term: string) => Promise<Inventario[]>;
  /** Estado de loading */
  loading?: boolean;
  /** Error message */
  error?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onSelect,
  products,
  placeholder = 'Buscar por clave, descripción o nombre...',
  disabled = false,
  className = '',
  showPrice = true,
  showStock = true,
  showCategory = true,
  maxResults = 10,
  onlyInStock = false,
  onServerSearch,
  loading = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventario | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Inventario[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar producto seleccionado
  useEffect(() => {
    if (value) {
      const product = products.find((p) => p.id === value);
      setSelectedProduct(product || null);
      if (product) {
        setSearchTerm(product.nombre);
      }
    } else {
      setSelectedProduct(null);
      setSearchTerm('');
    }
  }, [value, products]);

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    // Filtro por stock si está habilitado
    if (onlyInStock) {
      filtered = filtered.filter((p) => p.cantidad > 0);
    }

    // Filtro por término de búsqueda - Incluye clave, clave2 y descripción
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.nombre.toLowerCase().includes(term) ||
          (product.descripcion && product.descripcion.toLowerCase().includes(term)) ||
          (product.clave && product.clave.toLowerCase().includes(term)) ||
          (product.clave2 && product.clave2.toLowerCase().includes(term)) ||
          (product.categoria && product.categoria.toLowerCase().includes(term)) ||
          (product.proveedor && product.proveedor.toLowerCase().includes(term))
      );
    }

    // Limitar resultados
    filtered = filtered.slice(0, maxResults);

    setFilteredProducts(filtered);
  }, [searchTerm, products, onlyInStock, maxResults]);

  // Búsqueda del lado del servidor
  useEffect(() => {
    if (onServerSearch && searchTerm.trim() && searchTerm.length > 2) {
      const searchTimer = setTimeout(async () => {
        try {
          const serverResults = await onServerSearch(searchTerm);
          setFilteredProducts(serverResults.slice(0, maxResults));
        } catch (error) {}
      }, 300);

      return () => clearTimeout(searchTimer);
    }
    return;
  }, [searchTerm, onServerSearch, maxResults]);

  // Manejar clicks fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Si hay un producto seleccionado, restaurar su nombre
        if (selectedProduct) {
          setSearchTerm(selectedProduct.nombre);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProduct]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);

    // Si el usuario está escribiendo y hay un producto seleccionado, limpiarlo
    if (newValue !== selectedProduct?.nombre && selectedProduct) {
      setSelectedProduct(null);
      onSelect(null);
    }
  };

  const handleProductSelect = (product: Inventario) => {
    setSelectedProduct(product);
    setSearchTerm(product.nombre);
    setIsOpen(false);
    onSelect(product);

    // Enfocar el siguiente input si existe
    if (inputRef.current) {
      const form = inputRef.current.closest('form');
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        const currentIndex = inputs.indexOf(inputRef.current);
        const nextInput = inputs[currentIndex + 1] as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleClear = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setIsOpen(false);
    onSelect(null);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      if (selectedProduct) {
        setSearchTerm(selectedProduct.nombre);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredProducts.length === 1) {
        handleProductSelect(filteredProducts[0]);
      }
    }
  };

  // Obtener estado del stock para un producto
  const getStockStatus = (product: Inventario) => {
    if (product.cantidad <= 0) return { color: 'text-red-600', label: 'Sin stock' };
    if (product.cantidad <= 5) return { color: 'text-yellow-600', label: 'Stock bajo' };
    return { color: 'text-green-600', label: 'Disponible' };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'
          } ${error ? 'border-red-500' : ''}`}
        />

        {/* Botón limpiar */}
        {selectedProduct && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            title="Limpiar selección"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {/* Indicador de loading */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown con resultados */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Buscando productos...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  title={`Seleccionar ${product.nombre}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.nombre}</p>
                      {product.descripcion && (
                        <p className="text-xs text-gray-500 truncate mt-1">{product.descripcion}</p>
                      )}
                      {/* Mostrar claves si existen */}
                      {(product.clave || product.clave2) && (
                        <div className="flex items-center gap-2 mt-1">
                          {product.clave && (
                            <span className="text-xs text-blue-600 font-mono">{product.clave}</span>
                          )}
                          {product.clave2 && (
                            <span className="text-xs text-blue-500 font-mono">
                              {product.clave2}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {showCategory && product.categoria && (
                          <div className="flex items-center text-xs text-gray-500">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {product.categoria}
                          </div>
                        )}
                        {showStock && (
                          <span className={`text-xs font-medium ${stockStatus.color}`}>
                            Stock: {product.cantidad}
                          </span>
                        )}
                        {showPrice && (
                          <span className="text-xs font-medium text-gray-900">
                            ${product.precio.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : searchTerm.trim() ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <p className="text-sm">No se encontraron productos</p>
              <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              <p className="text-sm">Escribe para buscar productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSelector;

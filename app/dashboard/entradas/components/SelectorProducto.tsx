'use client';

import { api } from '@/lib/fetcher';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Producto } from '../types';

interface SelectorProductoProps {
  onSelect: (producto: Producto) => void;
  productosExcluidos?: string[];
  validarStock?: boolean; // Nueva prop para validar stock en salidas
  productoSeleccionado?: Producto | null; // Nuevo: Para mostrar el producto seleccionado
  mostrarProductoSeleccionado?: boolean; // Nueva prop: controlar si se muestra el cuadro del producto seleccionado
}

const SelectorProducto = forwardRef<HTMLInputElement, SelectorProductoProps>(
  (
    {
      onSelect,
      productosExcluidos = [],
      validarStock = false,
      productoSeleccionado = null,
      mostrarProductoSeleccionado = true,
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosDuplicados, setProductosDuplicados] = useState<Producto[]>([]);
    const [productosSinStock, setProductosSinStock] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
    const [buscarPorDescripcion, setBuscarPorDescripcion] = useState(false); // Nuevo: Modo de búsqueda
    const [selectedIndex, setSelectedIndex] = useState(0); // Índice del producto seleccionado con teclado
    const inputRef = useRef<HTMLInputElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]); // Refs para los elementos de la lista

    // Exponer la ref del input al componente padre
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Usar directamente el array de excluidos (la prop viene del padre)
    // Si el padre pasa una nueva referencia, el efecto de búsqueda se re-disparará — esto es aceptable.
    const productosExcluidosMemo = productosExcluidos;

    // Estado para controlar si ya se realizó la búsqueda
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);

    // Efecto para hacer scroll automático al elemento seleccionado
    useEffect(() => {
      if (selectedIndex >= 0 && itemsRef.current[selectedIndex]) {
        itemsRef.current[selectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, [selectedIndex]);

    // Función para realizar la búsqueda manual
    const realizarBusqueda = async () => {
      if (searchTerm.length < 2) {
        setErrorBusqueda('Ingresa al menos 2 caracteres para buscar');
        setShowDropdown(true);
        return;
      }

      try {
        setLoading(true);
        setErrorBusqueda(null);

        // Construir URL con modo de búsqueda
        const mode = buscarPorDescripcion ? 'descripcion' : 'clave';
        const response = await api.get(
          `/api/inventario/buscar?q=${encodeURIComponent(searchTerm)}&mode=${mode}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setErrorBusqueda('No se encontraron productos');
          } else {
            setErrorBusqueda('Error al buscar productos. Intenta nuevamente.');
          }
          setProductos([]);
          setProductosDuplicados([]);
          setProductosSinStock([]);
          setShowDropdown(true);
          setBusquedaRealizada(true);
          return;
        }

        const data = await response.json();

        if (!data.productos || data.productos.length === 0) {
          setErrorBusqueda('No se encontraron productos con ese criterio');
          setProductos([]);
          setProductosDuplicados([]);
          setProductosSinStock([]);
          setShowDropdown(true);
          setBusquedaRealizada(true);
          return;
        }

        // Separar productos disponibles, duplicados y sin stock
        const disponibles: Producto[] = [];
        const duplicados: Producto[] = [];
        const sinStock: Producto[] = [];

        data.productos.forEach((p: Producto) => {
          // Si ya está excluido (duplicado)
          if (productosExcluidosMemo.includes(p.id)) {
            duplicados.push(p);
          }
          // Si es para salidas y necesita validar stock
          else if (validarStock && p.cantidad <= 0) {
            sinStock.push(p);
          }
          // Producto disponible
          else {
            disponibles.push(p);
          }
        });

        setProductos(disponibles);
        setProductosDuplicados(duplicados);
        setProductosSinStock(sinStock);

        // IMPORTANTE: Limpiar el error si se encontraron productos
        if (disponibles.length > 0 || duplicados.length > 0 || sinStock.length > 0) {
          setErrorBusqueda(null);
        }

        setShowDropdown(true);
        setBusquedaRealizada(true);
        setSelectedIndex(0); // Resetear índice al primer producto
      } catch (error) {
        console.error('Error buscando productos:', error);
        setErrorBusqueda('Error de conexión. Verifica tu red e intenta nuevamente.');
        setProductos([]);
        setProductosDuplicados([]);
        setProductosSinStock([]);
        setShowDropdown(true);
        setBusquedaRealizada(true);
      } finally {
        setLoading(false);
      }
    };

    const handleSelect = (producto: Producto) => {
      onSelect(producto);
      setSearchTerm('');
      setProductos([]);
      setProductosDuplicados([]);
      setProductosSinStock([]);
      setShowDropdown(false);
      setBusquedaRealizada(false);
      setSelectedIndex(0); // Resetear índice
      // No mantener el foco aquí, lo maneja el componente padre
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      // Resetear estados al cambiar el texto
      if (busquedaRealizada) {
        setBusquedaRealizada(false);
        setShowDropdown(false);
        setProductos([]);
        setProductosDuplicados([]);
        setProductosSinStock([]);
        setErrorBusqueda(null);
        setSelectedIndex(0); // Resetear índice de selección
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // SIEMPRE prevenir Enter para evitar submit accidental del formulario
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Previene propagación al form

        // PRIMER ENTER: Si no se ha realizado búsqueda, buscar
        if (!busquedaRealizada) {
          realizarBusqueda();
          return;
        }

        // SEGUNDO ENTER: Si ya se buscó y hay productos disponibles, seleccionar el producto resaltado
        if (busquedaRealizada && productos.length > 0) {
          handleSelect(productos[selectedIndex]);
        }
        return;
      }

      // Navegación con flechas ↑↓
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (busquedaRealizada && productos.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % productos.length);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (busquedaRealizada && productos.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + productos.length) % productos.length);
        }
        return;
      }

      // Escape cierra el dropdown y resetea
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setBusquedaRealizada(false);
        setSelectedIndex(0);
      }
    };

    return (
      <div className="space-y-2">
        {/* Checkbox para alternar modo de búsqueda */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="buscarPorDescripcion"
            checked={buscarPorDescripcion}
            onChange={(e) => {
              setBuscarPorDescripcion(e.target.checked);
              // Auto-focus en el input después de cambiar modo
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="buscarPorDescripcion"
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            Buscar por descripción
          </label>
          <span className="text-xs text-gray-500">
            {buscarPorDescripcion ? '(Búsqueda flexible)' : '(Búsqueda exacta por clave)'}
          </span>
        </div>

        {/* Contenedor condicional: Si se muestra el producto seleccionado, usar layout de dos columnas */}
        {mostrarProductoSeleccionado ? (
          <div className="flex gap-3 items-start">
            {/* Selector de producto - 45% del ancho */}
            <div className="relative flex-1" style={{ maxWidth: '45%' }}>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  buscarPorDescripcion
                    ? 'Buscar por descripción del producto...'
                    : 'Buscar por clave exacta del producto...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {loading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* Indicador visual: Presiona Enter */}
              {!loading && searchTerm.length >= 2 && !busquedaRealizada && (
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                    Enter
                  </kbd>
                  <span className="text-xs text-gray-500">para buscar</span>
                </div>
              )}

              {/* Indicador visual: Seleccionar producto */}
              {!loading && busquedaRealizada && productos.length > 0 && (
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded">
                    ↑↓
                  </kbd>
                  <kbd className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded animate-pulse">
                    Enter
                  </kbd>
                  <span className="text-xs text-green-600 font-medium">seleccionar</span>
                </div>
              )}

              {showDropdown &&
                (productos.length > 0 ||
                  productosDuplicados.length > 0 ||
                  productosSinStock.length > 0 ||
                  (errorBusqueda &&
                    productos.length === 0 &&
                    productosDuplicados.length === 0 &&
                    productosSinStock.length === 0)) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {/* Error de búsqueda - SOLO si NO hay productos */}
                    {errorBusqueda &&
                      productos.length === 0 &&
                      productosDuplicados.length === 0 &&
                      productosSinStock.length === 0 && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-t-lg">
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-900">{errorBusqueda}</p>
                              <p className="text-xs text-red-700 mt-1">
                                Verifica que el producto exista en el sistema o intenta con otro
                                término de búsqueda.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Productos disponibles */}
                    {productos.map((producto, index) => (
                      <button
                        key={producto.id}
                        ref={(el) => {
                          itemsRef.current[index] = el;
                        }}
                        onClick={() => handleSelect(producto)}
                        className={`w-full px-4 py-2.5 text-left focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-100 border-l-4 border-l-blue-500'
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {index === selectedIndex && (
                            <span className="text-blue-600 font-bold">▶</span>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{producto.descripcion}</div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-gray-500">
                                {producto.clave || 'Sin clave'}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  producto.cantidad > 10
                                    ? 'bg-green-100 text-green-700'
                                    : producto.cantidad > 0
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                Stock: {producto.cantidad}
                              </span>
                              {/* Mostrar precio solo en búsqueda por clave exacta */}
                              {!buscarPorDescripcion && (
                                <span className="text-xs text-gray-400">
                                  ${producto.precio.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Productos sin stock - Advertencia */}
                    {productosSinStock.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border-t-2 border-red-300">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900 mb-1">
                              ⚠️{' '}
                              {productosSinStock.length === 1
                                ? 'Producto sin existencia'
                                : `${productosSinStock.length} productos sin existencia`}
                            </p>
                            <div className="space-y-1.5">
                              {productosSinStock.map((producto) => (
                                <div
                                  key={producto.id}
                                  className="text-xs text-red-800 bg-white/50 rounded px-2 py-1.5 border border-red-200"
                                >
                                  <div className="font-medium">{producto.descripcion}</div>
                                  <div className="text-red-600 mt-0.5 flex items-center gap-2">
                                    <span>{producto.clave || 'Sin clave'}</span>
                                    <span className="px-1.5 py-0.5 bg-red-100 rounded text-red-700 font-semibold">
                                      Stock: {producto.cantidad}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-red-700 mt-2 font-medium">
                              ⛔ No se puede agregar productos sin existencia a una salida
                            </p>
                            <p className="text-xs text-red-600 mt-1 italic">
                              💡 Realiza una entrada de inventario primero
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Productos duplicados - Mensaje de alerta elegante */}
                    {productosDuplicados.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-300">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-1">
                              {productosDuplicados.length === 1
                                ? 'Producto ya agregado'
                                : `${productosDuplicados.length} productos ya agregados`}
                            </p>
                            <div className="space-y-1.5">
                              {productosDuplicados.map((producto) => (
                                <div
                                  key={producto.id}
                                  className="text-xs text-amber-800 bg-white/50 rounded px-2 py-1.5 border border-amber-200"
                                >
                                  <div className="font-medium">{producto.descripcion}</div>
                                  <div className="text-amber-600 mt-0.5">
                                    {producto.clave || 'Sin clave'} • Ya está en la lista de
                                    partidas
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-amber-700 mt-2 italic">
                              💡 Edita la cantidad directamente en la tabla
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Producto seleccionado - 55% del ancho - SOLO si mostrarProductoSeleccionado es true */}
            {mostrarProductoSeleccionado && (
              <div className="flex-1" style={{ maxWidth: '55%' }}>
                {productoSeleccionado ? (
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg h-full">
                    <p className="text-xs font-semibold text-blue-900 mb-1">
                      ✓ Producto Seleccionado
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900 line-clamp-2"
                      title={productoSeleccionado.descripcion}
                    >
                      {productoSeleccionado.descripcion}
                    </p>
                    <div className="mt-2 space-y-1">
                      {productoSeleccionado.clave && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Clave:</span> {productoSeleccionado.clave}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Stock:</span>{' '}
                        <span
                          className={`font-bold ${
                            productoSeleccionado.cantidad > 10
                              ? 'text-green-600'
                              : productoSeleccionado.cantidad > 0
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {productoSeleccionado.cantidad}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                      Ningún producto seleccionado
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Layout simple: Solo el selector sin el producto seleccionado */
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                buscarPorDescripcion
                  ? 'Buscar por descripción del producto...'
                  : 'Buscar por clave exacta del producto...'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {loading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}

            {/* Indicador visual: Presiona Enter */}
            {!loading && searchTerm.length >= 2 && !busquedaRealizada && (
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                  Enter
                </kbd>
                <span className="text-xs text-gray-500">para buscar</span>
              </div>
            )}

            {/* Indicador visual: Seleccionar producto */}
            {!loading && busquedaRealizada && productos.length > 0 && (
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded">
                  ↑↓
                </kbd>
                <kbd className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded animate-pulse">
                  Enter
                </kbd>
                <span className="text-xs text-green-600 font-medium">seleccionar</span>
              </div>
            )}

            {showDropdown &&
              (productos.length > 0 ||
                productosDuplicados.length > 0 ||
                productosSinStock.length > 0 ||
                (errorBusqueda &&
                  productos.length === 0 &&
                  productosDuplicados.length === 0 &&
                  productosSinStock.length === 0)) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {/* Error de búsqueda - SOLO si NO hay productos */}
                  {errorBusqueda &&
                    productos.length === 0 &&
                    productosDuplicados.length === 0 &&
                    productosSinStock.length === 0 && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-t-lg">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900">{errorBusqueda}</p>
                            <p className="text-xs text-red-700 mt-1">
                              Verifica que el producto exista en el sistema o intenta con otro
                              término de búsqueda.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Productos disponibles */}
                  {productos.map((producto, index) => (
                    <button
                      key={producto.id}
                      ref={(el) => {
                        itemsRef.current[index] = el;
                      }}
                      onClick={() => handleSelect(producto)}
                      className={`w-full px-4 py-2.5 text-left focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-100 border-l-4 border-l-blue-500'
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {index === selectedIndex && (
                          <span className="text-blue-600 font-bold">▶</span>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{producto.descripcion}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-500">
                              {producto.clave || 'Sin clave'}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                producto.cantidad > 10
                                  ? 'bg-green-100 text-green-700'
                                  : producto.cantidad > 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              Stock: {producto.cantidad}
                            </span>
                            {/* Mostrar precio solo en búsqueda por clave exacta */}
                            {!buscarPorDescripcion && (
                              <span className="text-xs text-gray-400">
                                ${producto.precio.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Productos sin stock - Advertencia */}
                  {productosSinStock.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border-t-2 border-red-300">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 mb-1">
                            ⚠️{' '}
                            {productosSinStock.length === 1
                              ? 'Producto sin existencia'
                              : `${productosSinStock.length} productos sin existencia`}
                          </p>
                          <div className="space-y-1.5">
                            {productosSinStock.map((producto) => (
                              <div
                                key={producto.id}
                                className="text-xs text-red-800 bg-white/50 rounded px-2 py-1.5 border border-red-200"
                              >
                                <div className="font-medium">{producto.descripcion}</div>
                                <div className="text-red-600 mt-0.5 flex items-center gap-2">
                                  <span>{producto.clave || 'Sin clave'}</span>
                                  <span className="px-1.5 py-0.5 bg-red-100 rounded text-red-700 font-semibold">
                                    Stock: {producto.cantidad}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-red-700 mt-2 font-medium">
                            ⛔ No se puede agregar productos sin existencia a una salida
                          </p>
                          <p className="text-xs text-red-600 mt-1 italic">
                            💡 Realiza una entrada de inventario primero
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Productos duplicados - Mensaje de alerta elegante */}
                  {productosDuplicados.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-300">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900 mb-1">
                            {productosDuplicados.length === 1
                              ? 'Producto ya agregado'
                              : `${productosDuplicados.length} productos ya agregados`}
                          </p>
                          <div className="space-y-1.5">
                            {productosDuplicados.map((producto) => (
                              <div
                                key={producto.id}
                                className="text-xs text-amber-800 bg-white/50 rounded px-2 py-1.5 border border-amber-200"
                              >
                                <div className="font-medium">{producto.descripcion}</div>
                                <div className="text-amber-600 mt-0.5">
                                  {producto.clave || 'Sin clave'} • Ya está en la lista de partidas
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-amber-700 mt-2 italic">
                            💡 Edita la cantidad directamente en la tabla
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    );
  }
);

SelectorProducto.displayName = 'SelectorProducto';

export default SelectorProducto;

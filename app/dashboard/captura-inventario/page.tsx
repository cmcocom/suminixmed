'use client';

import ProtectedPage from '@/app/components/ProtectedPage';
import apiFetch from '@/lib/fetcher';
import {
  BuildingStorefrontIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Producto {
  id: string;
  clave?: string | null;
  clave2?: string | null;
  nombre: string;
  descripcion?: string;
  categoria: string;
  cantidad: number;
  ubicacion_general?: string;
}

interface Almacen {
  id: string;
  nombre: string;
  es_principal: boolean;
  activo: boolean;
}

interface Ubicacion {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
}

interface InventarioItem {
  producto_id: string;
  producto_nombre: string;
  almacen_id: string;
  ubicacion_id?: string;
  cantidad_sistema: number;
  cantidad_contada: number;
  diferencia: number;
  observaciones?: string;
}

function CapturaInventarioPage() {
  const { data: _session } = useSession();
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlmacen, setSelectedAlmacen] = useState<string>('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showResumenModal, setShowResumenModal] = useState(false);

  // Estados del formulario
  const [nuevoItem, setNuevoItem] = useState({
    producto_id: '',
    ubicacion_id: '',
    cantidad_contada: 0,
    observaciones: '',
  });

  // Cargar datos iniciales
  const fetchAlmacenes = useCallback(async () => {
    try {
      const response = await apiFetch('/api/almacenes');
      if (response.ok) {
        const data = await response.json();
        setAlmacenes(data.almacenes || []);

        // Seleccionar el almacén principal por defecto
        const principal = data.almacenes?.find((a: Almacen) => a.es_principal);
        if (principal) {
          setSelectedAlmacen(principal.id);
        }
      }
    } catch (error) {
      toast.error('Error al cargar almacenes');
    }
  }, []);

  const fetchUbicaciones = useCallback(async (almacenId: string) => {
    if (!almacenId) return;

    try {
      const response = await apiFetch(`/api/ubicaciones?almacenId=${almacenId}`);
      if (response.ok) {
        const data = await response.json();
        setUbicaciones(data.ubicaciones || []);
      }
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      const response = await apiFetch('/api/inventario?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProductos(data.inventarios || []);
      }
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlmacenes(), fetchProductos()]);
      setLoading(false);
    };

    loadData();
  }, [fetchAlmacenes, fetchProductos]);

  useEffect(() => {
    if (selectedAlmacen) {
      fetchUbicaciones(selectedAlmacen);
    }
  }, [selectedAlmacen, fetchUbicaciones]);

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(
    (producto) =>
      (producto.descripcion &&
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.clave && producto.clave.includes(searchTerm)) ||
      (producto.clave2 && producto.clave2.includes(searchTerm))
  );

  // Agregar producto al inventario
  const agregarProducto = (producto: Producto) => {
    const existeItem = inventarioItems.find(
      (item) =>
        item.producto_id === producto.id &&
        item.almacen_id === selectedAlmacen &&
        item.ubicacion_id === nuevoItem.ubicacion_id
    );

    if (existeItem) {
      toast.error('Este producto ya está agregado en esta ubicación');
      return;
    }

    const nuevoInventarioItem: InventarioItem = {
      producto_id: producto.id,
      producto_nombre: producto.descripcion || producto.nombre || 'Sin descripción',
      almacen_id: selectedAlmacen,
      ubicacion_id: nuevoItem.ubicacion_id || undefined,
      cantidad_sistema: 0, // Aquí se debería obtener del sistema
      cantidad_contada: nuevoItem.cantidad_contada,
      diferencia: nuevoItem.cantidad_contada - 0, // cantidad_sistema
      observaciones: nuevoItem.observaciones || undefined,
    };

    setInventarioItems([...inventarioItems, nuevoInventarioItem]);
    setNuevoItem({
      producto_id: '',
      ubicacion_id: '',
      cantidad_contada: 0,
      observaciones: '',
    });
    setShowProductModal(false);
    toast.success('Producto agregado al inventario');
  };

  // Eliminar item del inventario
  const eliminarItem = (index: number) => {
    const nuevosItems = inventarioItems.filter((_, i) => i !== index);
    setInventarioItems(nuevosItems);
    toast.success('Producto eliminado del inventario');
  };

  // Actualizar cantidad contada
  const actualizarCantidad = (index: number, cantidad: number) => {
    const nuevosItems = [...inventarioItems];
    nuevosItems[index].cantidad_contada = cantidad;
    nuevosItems[index].diferencia = cantidad - nuevosItems[index].cantidad_sistema;
    setInventarioItems(nuevosItems);
  };

  // Guardar captura de inventario
  const guardarInventario = async () => {
    if (inventarioItems.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    if (!selectedAlmacen) {
      toast.error('Debe seleccionar un almacén');
      return;
    }

    try {
      // Aquí iría la llamada a la API para guardar
      // const capturaData = {
      //   almacen_id: selectedAlmacen,
      //   fecha_captura: new Date().toISOString(),
      //   items: inventarioItems,
      //   observaciones_generales: 'Captura de inventario desde aplicación web'
      // };

      // Simular guardado por ahora
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Captura de inventario guardada exitosamente');
      setInventarioItems([]);
      setShowResumenModal(false);
    } catch (error) {
      toast.error('Error al guardar inventario');
    }
  };

  // Calcular totales
  const totales = {
    items: inventarioItems.length,
    diferenciasPositivas: inventarioItems.filter((item) => item.diferencia > 0).length,
    diferenciasNegativas: inventarioItems.filter((item) => item.diferencia < 0).length,
    sinDiferencias: inventarioItems.filter((item) => item.diferencia === 0).length,
  };

  if (loading) {
    return (
      <ProtectedPage requiredPermission={{ modulo: 'INVENTARIOS_FISICOS', accion: 'CREAR' }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredPermission={{ modulo: 'INVENTARIOS_FISICOS', accion: 'CREAR' }}>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Captura de Inventario</h1>
            <p className="text-gray-600">Registra el inventario físico por almacén y ubicación</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowResumenModal(true)}
              disabled={inventarioItems.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              Ver Resumen ({inventarioItems.length})
            </button>

            <button
              onClick={() => setShowProductModal(true)}
              disabled={!selectedAlmacen}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar Producto
            </button>
          </div>
        </div>

        {/* Selección de almacén */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-black mb-4">Seleccionar Almacén</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {almacenes.map((almacen) => (
              <div
                key={almacen.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedAlmacen === almacen.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedAlmacen(almacen.id)}
              >
                <div className="flex items-center gap-3">
                  <BuildingStorefrontIcon
                    className={`h-6 w-6 ${
                      selectedAlmacen === almacen.id ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                  <div>
                    <h3 className="font-medium text-black">{almacen.nombre}</h3>
                    {almacen.es_principal && (
                      <span className="text-sm text-green-600">Principal</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de productos capturados */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-black">
              Productos Capturados
              {selectedAlmacen && (
                <span className="text-sm text-gray-600 ml-2">
                  - {almacenes.find((a) => a.id === selectedAlmacen)?.nombre}
                </span>
              )}
            </h2>
          </div>

          {inventarioItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Sistema
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Contado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Diferencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventarioItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{item.producto_nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.ubicacion_id
                            ? ubicaciones.find((u) => u.id === item.ubicacion_id)?.nombre || 'N/A'
                            : 'Sin ubicación'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.cantidad_sistema}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={item.cantidad_contada}
                          onChange={(e) => actualizarCantidad(index, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Cantidad contada"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.diferencia > 0
                              ? 'bg-green-100 text-green-800'
                              : item.diferencia < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.diferencia > 0 ? '+' : ''}
                          {item.diferencia}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => eliminarItem(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-black">No hay productos capturados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un almacén y agrega productos para comenzar la captura.
              </p>
            </div>
          )}
        </div>

        {/* Modal para agregar producto */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-black">Agregar Producto al Inventario</h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Cerrar modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Búsqueda de productos */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Buscar Producto
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Buscar por nombre, categoría o código de barras..."
                    />
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Ubicación (Opcional)
                  </label>
                  <select
                    value={nuevoItem.ubicacion_id}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, ubicacion_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    title="Seleccionar ubicación"
                  >
                    <option value="">Sin ubicación específica</option>
                    {ubicaciones.map((ubicacion) => (
                      <option key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre} ({ubicacion.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad contada */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Cantidad Contada
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoItem.cantidad_contada}
                    onChange={(e) =>
                      setNuevoItem({
                        ...nuevoItem,
                        cantidad_contada: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="0"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.observaciones}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Lista de productos filtrados */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-2">Seleccionar Producto:</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {productosFiltrados.map((producto) => (
                      <div
                        key={producto.id}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => agregarProducto(producto)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-black">
                              {producto.descripcion || producto.nombre}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {producto.clave || producto.clave2 || 'Sin clave'} | Stock:{' '}
                              {producto.cantidad}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {productosFiltrados.length === 0 && searchTerm && (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron productos que coincidan con la búsqueda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de resumen */}
        {showResumenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-black">Resumen de Captura</h2>
                <button
                  onClick={() => setShowResumenModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Cerrar modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totales.items}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {totales.diferenciasPositivas}
                    </div>
                    <div className="text-sm text-gray-600">Sobrantes</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {totales.diferenciasNegativas}
                    </div>
                    <div className="text-sm text-gray-600">Faltantes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{totales.sinDiferencias}</div>
                    <div className="text-sm text-gray-600">Exactos</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={guardarInventario}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Guardar Captura
                  </button>
                  <button
                    onClick={() => setShowResumenModal(false)}
                    className="flex-1 bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Continuar Editando
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

export default CapturaInventarioPage;

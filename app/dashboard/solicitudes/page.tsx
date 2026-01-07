'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Partida {
  id?: string;
  inventarioId: string;
  nombreProducto?: string;
  cantidad: number;
  precio: number;
}

interface Solicitud {
  id: string;
  motivo: string;
  observaciones?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario: {
    name: string | null;
    email: string | null;
  };
  partidas: Partida[];
}

interface Producto {
  id: string;
  clave?: string;
  clave2?: string;
  nombre: string;
  descripcion?: string;
  stock: number;
  precio: number;
}

interface FormData {
  motivo: string;
  observaciones: string;
  partidas: Partida[];
}

interface Paginacion {
  paginaActual: number;
  solicitudesPorPagina: number;
}

interface ValidacionProducto {
  producto_id: string;
  producto_nombre: string;
  cantidad_solicitada: number;
  cantidad_fondo_fijo: number;
  cantidad_inventario: number;
  resultado: 'completo' | 'exceso' | 'pendiente' | 'sin_fondo';
  cantidad_autorizada: number;
  cantidad_vale: number;
  cantidad_pendiente: number;
}

interface ResultadoValidacion {
  solicitudes_generadas: {
    original?: string;
    vale?: string;
    pendiente?: string;
  };
  validaciones: ValidacionProducto[];
  resumen: {
    total_productos: number;
    productos_completos: number;
    productos_con_exceso: number;
    productos_pendientes: number;
    productos_sin_fondo: number;
  };
}

export default function SolicitudesPage() {
  const { data: session } = useSession();

  // Estados principales
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Estados del modal
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    motivo: '',
    observaciones: '',
    partidas: [],
  });

  // Estados de validación
  const [validationError, setValidationError] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoValidacion | null>(null);

  // Estado de paginación
  const [paginacion, setPaginacion] = useState<Paginacion>({
    paginaActual: 1,
    solicitudesPorPagina: 10,
  });

  // Función para mostrar toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  // Cargar solicitudes
  const fetchSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/solicitudes');
      const result = await response.json();

      if (response.ok && result.success) {
        // Filtrar solicitudes por el usuario actual
        const solicitudesDelUsuario = result.data.filter(
          (solicitud: Solicitud) => solicitud.usuario.email === session?.user?.email
        );
        setSolicitudes(solicitudesDelUsuario);
        console.log('📋 Solicitudes cargadas del usuario:', solicitudesDelUsuario.length);
      } else {
        showToast(result.error || 'Error al cargar las solicitudes', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Cargar productos
  const fetchProductos = async () => {
    try {
      const response = await api.get('/api/productos');
      const result = await response.json();

      if (response.ok && result.success) {
        setProductos(result.data);
        // Debug: Verificar que los productos tienen clave y clave2
        console.log('🔍 Productos cargados:', result.data.length);
        console.log('📦 Primer producto:', result.data[0]);
      } else {
      }
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
    }
  };

  // Efectos
  useEffect(() => {
    if (session) {
      fetchSolicitudes();
      fetchProductos();
    }
  }, [session, fetchSolicitudes]);

  // Filtrar productos para búsqueda - BUSCA por clave, clave2, nombre y descripción
  const productosFiltrados = productos.filter((producto) => {
    if (!searchTerm.trim()) return false;

    const searchLower = searchTerm.toLowerCase().trim();
    const matches =
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchLower)) ||
      (producto.nombre && producto.nombre.toLowerCase().includes(searchLower)) ||
      (producto.clave && producto.clave.toLowerCase().includes(searchLower)) ||
      (producto.clave2 && producto.clave2.toLowerCase().includes(searchLower));

    // Debug: Mostrar en consola qué está buscando y si encuentra coincidencias
    if (searchTerm.length >= 2 && matches) {
      console.log('✅ Coincidencia encontrada:', {
        searchTerm,
        producto: {
          descripcion: producto.descripcion,
          nombre: producto.nombre,
          clave: producto.clave,
          clave2: producto.clave2,
        },
      });
    }

    return matches;
  });

  // Agregar producto a la solicitud
  const agregarProducto = (producto: Producto) => {
    const partidaExistente = formData.partidas.find((p) => p.inventarioId === producto.id);

    if (partidaExistente) {
      showToast('El producto ya está en la solicitud', 'error');
      return;
    }

    const nuevaPartida: Partida = {
      inventarioId: producto.id,
      nombreProducto: producto.descripcion,
      cantidad: 1,
      precio: producto.precio,
    };

    setFormData((prev) => ({
      ...prev,
      partidas: [...prev.partidas, nuevaPartida],
    }));

    setSearchTerm('');
  };

  // Actualizar cantidad de partida
  const actualizarCantidad = (index: number, cantidad: number) => {
    if (cantidad < 1) return;

    setFormData((prev) => ({
      ...prev,
      partidas: prev.partidas.map((partida, i) =>
        i === index ? { ...partida, cantidad } : partida
      ),
    }));
  };

  // Eliminar partida
  const eliminarPartida = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      partidas: prev.partidas.filter((_, i) => i !== index),
    }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      motivo: '',
      observaciones: '',
      partidas: [],
    });
    setValidationError(null);
    setUltimoResultado(null);
  };

  // Enviar solicitud
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motivo.trim()) {
      setValidationError('El motivo es requerido');
      return;
    }

    if (formData.partidas.length === 0) {
      setValidationError('Debe agregar al menos un producto');
      return;
    }

    setValidationError(null);
    setSubmitLoading(true);

    try {
      const response = await apiFetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUltimoResultado(result.data);
        showToast('Solicitud procesada exitosamente', 'success');
        fetchSolicitudes();
        resetForm();
        setShowModal(false);
      } else {
        setValidationError(result.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setValidationError('Error de conexión');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Paginación
  const totalSolicitudes = solicitudes.length;
  const totalPaginas = Math.ceil(totalSolicitudes / paginacion.solicitudesPorPagina);
  const indiceInicio = (paginacion.paginaActual - 1) * paginacion.solicitudesPorPagina;
  const indiceFin = indiceInicio + paginacion.solicitudesPorPagina;
  const solicitudesPaginadas = solicitudes.slice(indiceInicio, indiceFin);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginacion((prev) => ({ ...prev, paginaActual: nuevaPagina }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para obtener el color del resultado de validación
  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'completo':
        return 'text-green-600 bg-green-100';
      case 'exceso':
        return 'text-blue-600 bg-blue-100';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100';
      case 'sin_fondo':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Solicitudes con Validación</h1>
                <p className="text-sm text-gray-500">
                  Sistema inteligente con validación de stock fijo y generación de vales
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comience creando una nueva solicitud con validación de stock fijo.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Mis Solicitudes ({solicitudes.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Página {paginacion.paginaActual} de {totalPaginas}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {solicitudesPaginadas.map((solicitud) => (
                <div key={solicitud.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{solicitud.motivo}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{solicitud.observaciones}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>👤 {solicitud.usuario.name}</span>
                        <span>📅 {formatearFecha(solicitud.fecha_creacion)}</span>
                        <span>📦 {solicitud.partidas.length} productos</span>
                      </div>
                    </div>
                  </div>

                  {/* Partidas */}
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    {solicitud.partidas.map((partida) => (
                      <div key={partida.id} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600">{partida.nombreProducto}</span>
                        <span className="text-sm font-medium">{partida.cantidad} unidades</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(indiceFin, totalSolicitudes)}</span> de{' '}
                    <span className="font-medium">{totalSolicitudes}</span> solicitudes
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                      disabled={paginacion.paginaActual === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ‹ Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => {
                        // Mostrar solo algunas páginas alrededor de la actual
                        if (
                          pagina === 1 ||
                          pagina === totalPaginas ||
                          (pagina >= paginacion.paginaActual - 1 &&
                            pagina <= paginacion.paginaActual + 1)
                        ) {
                          return (
                            <button
                              key={pagina}
                              onClick={() => cambiarPagina(pagina)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                pagina === paginacion.paginaActual
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pagina}
                            </button>
                          );
                        } else if (
                          pagina === paginacion.paginaActual - 2 ||
                          pagina === paginacion.paginaActual + 2
                        ) {
                          return (
                            <span key={pagina} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                      disabled={paginacion.paginaActual === totalPaginas}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente ›
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal mejorado para nueva solicitud */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-5">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    📝 Nueva Solicitud de Inventario
                  </h3>
                  <p className="text-sm text-gray-500">
                    Sistema inteligente con validación de stock fijo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Cerrar modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error de validación */}
              {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{validationError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información general */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="motivo_solicitud"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Motivo de la Solicitud *
                  </label>
                  <input
                    id="motivo_solicitud"
                    name="motivo"
                    type="text"
                    value={formData.motivo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium bg-white hover:border-gray-400"
                    placeholder="Describe el motivo de tu solicitud..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones Adicionales
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white hover:border-gray-400"
                    placeholder="Información adicional, urgencia, condiciones especiales..."
                  />
                </div>
              </div>

              {/* Sección de productos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Productos Solicitados *
                  </label>
                </div>

                {/* Búsqueda de productos mejorada */}
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="buscar_producto_solicitud"
                      name="buscar_producto"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Buscar por clave, clave2, nombre o descripción..."
                      aria-label="Buscar productos para añadir a la solicitud"
                    />
                  </div>

                  {/* Resultados de búsqueda mejorados */}
                  {searchTerm && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                      {productosFiltrados.length > 0 ? (
                        productosFiltrados.slice(0, 10).map((producto) => (
                          <button
                            key={producto.id}
                            type="button"
                            onClick={() => agregarProducto(producto)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none transition-colors duration-200"
                          >
                            <div className="font-medium text-gray-900">{producto.descripcion}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {producto.clave || producto.clave2 || 'Sin clave'} | Stock:{' '}
                              {producto.stock}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-gray-500 text-center">
                          <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm">No se encontraron productos</p>
                          <p className="text-xs">Intenta con otros términos de búsqueda</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de productos mejorada */}
                {formData.partidas.length > 0 ? (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 grid grid-cols-12 gap-2 p-3 text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <div className="col-span-4">Producto</div>
                      <div className="col-span-2 text-center">Cantidad</div>
                      <div className="col-span-2 text-center">Stock Disp.</div>
                      <div className="col-span-2 text-center">Precio Unit.</div>
                      <div className="col-span-2 text-center">Acciones</div>
                    </div>

                    {formData.partidas.map((partida, index) => {
                      const producto = productos.find((p) => p.id === partida.inventarioId);
                      return (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 p-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                        >
                          {/* Información del producto */}
                          <div className="col-span-4">
                            <div className="font-semibold text-gray-900">
                              {partida.nombreProducto}
                            </div>
                            {producto && (
                              <div className="text-xs text-gray-500 mt-1">ID: {producto.id}</div>
                            )}
                          </div>

                          {/* Cantidad */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              value={partida.cantidad}
                              onChange={(e) =>
                                actualizarCantidad(index, parseInt(e.target.value) || 1)
                              }
                              className={`w-full px-3 py-2 text-sm text-center border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                                producto && partida.cantidad > producto.stock
                                  ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                              }`}
                              title={
                                producto
                                  ? `Stock disponible: ${producto.stock}`
                                  : 'Cantidad solicitada'
                              }
                            />
                          </div>

                          {/* Stock disponible */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span
                              className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                !producto
                                  ? 'text-gray-500 bg-gray-100'
                                  : producto.stock > 10
                                    ? 'text-green-700 bg-green-100'
                                    : producto.stock > 0
                                      ? 'text-yellow-700 bg-yellow-100'
                                      : 'text-red-700 bg-red-100'
                              }`}
                            >
                              {producto ? producto.stock : 'N/A'}
                            </span>
                          </div>

                          {/* Precio */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900">
                              ${partida.precio?.toFixed(2) || '0.00'}
                            </span>
                          </div>

                          {/* Acciones */}
                          <div className="col-span-2 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => eliminarPartida(index)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Eliminar producto"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Resumen */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-700">
                          Total de productos:{' '}
                          <span className="font-bold">{formData.partidas.length}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Valor estimado:{' '}
                          <span className="font-bold text-blue-600">
                            $
                            {formData.partidas
                              .reduce((sum, p) => sum + p.cantidad * (p.precio || 0), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      No hay productos agregados
                    </p>
                    <p className="text-xs text-gray-500">
                      Busca productos arriba para agregarlos a tu solicitud
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || formData.partidas.length === 0}
                  className="inline-flex items-center px-6 py-3 border-2 border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Procesando Solicitud...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Enviar Solicitud ({formData.partidas.length} productos)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de resultados */}
      {ultimoResultado && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setUltimoResultado(null)}
            />

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Solicitud Procesada</h3>
                    <p className="text-sm text-gray-500">Resultados de la validación</p>
                  </div>
                </div>
                <button
                  onClick={() => setUltimoResultado(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Cerrar resultados"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ultimoResultado.resumen.productos_completos}
                  </div>
                  <div className="text-sm text-green-800">Completos</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {ultimoResultado.resumen.productos_con_exceso}
                  </div>
                  <div className="text-sm text-blue-800">Con Vale</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {ultimoResultado.resumen.productos_pendientes}
                  </div>
                  <div className="text-sm text-yellow-800">Pendientes</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {ultimoResultado.resumen.productos_sin_fondo}
                  </div>
                  <div className="text-sm text-red-800">Sin Fondo</div>
                </div>
              </div>

              {/* Validaciones detalladas */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-gray-900">Detalle de Validaciones</h4>
                {ultimoResultado.validaciones.map((validacion) => (
                  <div
                    key={validacion.producto_id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{validacion.producto_nombre}</h5>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getResultadoColor(validacion.resultado)}`}
                      >
                        {validacion.resultado}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Solicitado:</span>
                        <div className="font-medium">{validacion.cantidad_solicitada}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fondo Fijo:</span>
                        <div className="font-medium">{validacion.cantidad_fondo_fijo}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Autorizado:</span>
                        <div className="font-medium text-green-600">
                          {validacion.cantidad_autorizada}
                        </div>
                      </div>
                      {validacion.cantidad_vale > 0 && (
                        <div>
                          <span className="text-gray-600">Vale:</span>
                          <div className="font-medium text-blue-600">
                            {validacion.cantidad_vale}
                          </div>
                        </div>
                      )}
                      {validacion.cantidad_pendiente > 0 && (
                        <div>
                          <span className="text-gray-600">Pendiente:</span>
                          <div className="font-medium text-yellow-600">
                            {validacion.cantidad_pendiente}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Solicitudes generadas */}
              {Object.keys(ultimoResultado.solicitudes_generadas).length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-lg font-medium text-blue-800 mb-2">Solicitudes Generadas</h4>
                  <div className="space-y-1 text-sm">
                    {ultimoResultado.solicitudes_generadas.original && (
                      <div>
                        ✅ Solicitud original: {ultimoResultado.solicitudes_generadas.original}
                      </div>
                    )}
                    {ultimoResultado.solicitudes_generadas.vale && (
                      <div>📝 Vale generado: {ultimoResultado.solicitudes_generadas.vale}</div>
                    )}
                    {ultimoResultado.solicitudes_generadas.pendiente && (
                      <div>
                        ⏳ Solicitud pendiente: {ultimoResultado.solicitudes_generadas.pendiente}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => setUltimoResultado(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

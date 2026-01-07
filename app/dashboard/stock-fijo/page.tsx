'use client';

import apiFetch from '@/lib/fetcher';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface FondoFijo {
  id_fondo: string;
  id_departamento: string;
  id_producto: string;
  cantidad_asignada: number;
  cantidad_disponible: number;
  cantidad_minima: number;
  createdAt: string;
  updatedAt: string;
  usuario: {
    id: string;
    nombre: string;
    email: string | null;
  };
  producto: {
    id: string;
    descripcion: string;
    categoria: string;
    precio: number;
    estado: string;
  };
}

interface Usuario {
  id: string;
  nombre: string;
  email: string | null;
  telefono?: string | null;
  empresa?: string | null;
  clave?: string | null;
}

interface Producto {
  id: string;
  clave?: string | null;
  clave2?: string | null;
  descripcion: string;
  categoria: string;
  cantidad: number;
  precio: number;
  estado: string;
}

interface FormData {
  id_departamento: string;
  id_producto: string;
  cantidad_asignada: number;
  cantidad_disponible: number;
}

export default function StockFijoPage() {
  const { data: session } = useSession();
  const [fondosFijos, setFondosFijos] = useState<FondoFijo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedFondo, setSelectedFondo] = useState<FondoFijo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id_departamento: '',
    id_producto: '',
    cantidad_asignada: 0,
    cantidad_disponible: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estados para búsqueda en selects
  const [usuarioSearch, setUsuarioSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [showUsuarioDropdown, setShowUsuarioDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [isSearchingUsuario, setIsSearchingUsuario] = useState(false); // Flag para saber si está buscando usuario
  const [isSearchingProducto, setIsSearchingProducto] = useState(false); // Flag para saber si está buscando producto

  // Cargar datos
  const fetchFondosFijos = useCallback(async () => {
    try {
      const [fondosRes, clientesRes, productosRes] = await Promise.all([
        apiFetch('/api/stock-fijo'),
        apiFetch('/api/clientes'),
        apiFetch('/api/inventario'),
      ]);

      const [fondosData, clientesData, productosData] = await Promise.all([
        fondosRes.json(),
        clientesRes.json(),
        productosRes.json(),
      ]);

      if (fondosData.success) {
        setFondosFijos(fondosData.data);
      } else {
        setFondosFijos([]);
      }

      if (clientesData.success && clientesData.data) setUsuarios(clientesData.data);
      if (productosData.inventarios) setProductos(productosData.inventarios);
    } catch (error) {
      setFondosFijos([]);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchFondosFijos();
    }
  }, [session, fetchFondosFijos]);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest('.usuario-search-container') &&
        !target.closest('button[data-usuario-item]')
      ) {
        setShowUsuarioDropdown(false);
      }
      if (
        !target.closest('.producto-search-container') &&
        !target.closest('button[data-producto-item]')
      ) {
        setShowProductoDropdown(false);
      }
    };

    if (showUsuarioDropdown || showProductoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return;
  }, [showUsuarioDropdown, showProductoDropdown]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // Funciones para filtrar clientes y productos
  const usuariosFiltrados = usuarios.filter((usuario) => {
    // Solo filtrar si estamos en modo búsqueda Y hay texto
    if (!isSearchingUsuario) return false;
    if (usuarioSearch.length < 1) return false;

    const searchTerm = usuarioSearch.toLowerCase();
    return (
      usuario.nombre.toLowerCase().includes(searchTerm) ||
      (usuario.email && usuario.email.toLowerCase().includes(searchTerm)) ||
      (usuario.empresa && usuario.empresa.toLowerCase().includes(searchTerm)) ||
      usuario.id.toLowerCase().includes(searchTerm)
    );
  });

  const productosFiltrados = productos.filter((producto) => {
    // Solo filtrar si estamos en modo búsqueda
    if (!isSearchingProducto || productoSearch.length < 1) return false;

    const searchTerm = productoSearch.toLowerCase();
    return (
      producto.descripcion.toLowerCase().includes(searchTerm) ||
      producto.categoria.toLowerCase().includes(searchTerm) ||
      producto.id.toLowerCase().includes(searchTerm)
    );
  });

  // Función para obtener nombre del cliente seleccionado
  const getNombreUsuarioSeleccionado = () => {
    const usuario = usuarios.find((u) => u.id === formData.id_departamento);
    return usuario ? `${usuario.nombre}${usuario.email ? ` (${usuario.email})` : ''}` : '';
  };

  // Función para obtener nombre del producto seleccionado
  const getNombreProductoSeleccionado = () => {
    const producto = productos.find((p) => p.id === formData.id_producto);
    return producto ? `${producto.descripcion} - ${producto.categoria}` : '';
  };

  // Función para seleccionar usuario
  const seleccionarUsuario = (usuario: Usuario) => {
    setFormData((prev) => ({ ...prev, id_departamento: usuario.id }));
    setUsuarioSearch('');
    setShowUsuarioDropdown(false);
    setIsSearchingUsuario(false); // Salir del modo búsqueda
    setValidationError(null);
    setTimeout(() => {
      const productoInput = document.getElementById('producto-search');
      if (productoInput) productoInput.focus();
    }, 100);
  };

  // Función para seleccionar producto
  const seleccionarProducto = (producto: Producto) => {
    setFormData((prev) => ({ ...prev, id_producto: producto.id }));
    setProductoSearch('');
    setShowProductoDropdown(false);
    setIsSearchingProducto(false); // Salir del modo búsqueda
    setValidationError(null);
    setTimeout(() => {
      const cantidadInput = document.getElementById('cantidad_asignada');
      if (cantidadInput) cantidadInput.focus();
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      id_departamento: '',
      id_producto: '',
      cantidad_asignada: 0,
      cantidad_disponible: 0,
    });
    setFormErrors({});
    setSelectedFondo(null);
    setShowModal(false);
    setValidationError(null);
    setUsuarioSearch('');
    setProductoSearch('');
    setShowUsuarioDropdown(false);
    setShowProductoDropdown(false);
    setIsSearchingUsuario(false);
    setIsSearchingProducto(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedFondo(null);
    setShowModal(true);
  };

  const openViewModal = (fondo: FondoFijo) => {
    setSelectedFondo(fondo);
    setFormData({
      id_departamento: fondo.id_departamento,
      id_producto: fondo.id_producto,
      cantidad_asignada: fondo.cantidad_asignada,
      cantidad_disponible: fondo.cantidad_disponible,
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (fondo: FondoFijo) => {
    setSelectedFondo(fondo);
    setFormData({
      id_departamento: fondo.id_departamento,
      id_producto: fondo.id_producto,
      cantidad_asignada: fondo.cantidad_asignada,
      cantidad_disponible: fondo.cantidad_disponible,
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginación
  const fondosFiltrados = (() => {
    // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
    if (!showAll && searchTerm.trim() === '') {
      return [];
    }

    // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
    if (showAll && searchTerm.trim() === '') {
      return fondosFijos || [];
    }

    // Si hay búsqueda, filtrar independientemente del estado del checkbox
    if (searchTerm.trim() !== '') {
      return (fondosFijos || []).filter((fondo) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          fondo.usuario.nombre.toLowerCase().includes(searchLower) ||
          (fondo.usuario.email && fondo.usuario.email.toLowerCase().includes(searchLower)) ||
          fondo.producto.descripcion.toLowerCase().includes(searchLower) ||
          fondo.producto.categoria.toLowerCase().includes(searchLower)
        );
      });
    }

    return [];
  })();

  const totalPages = Math.ceil(fondosFiltrados.length / itemsPerPage);
  const fondosParaPagina = fondosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Obtener estado de stock basado en cantidades
  const getEstadoStock = (fondo: FondoFijo) => {
    const porcentaje = (fondo.cantidad_disponible / fondo.cantidad_asignada) * 100;
    if (fondo.cantidad_disponible <= fondo.cantidad_minima) {
      return { texto: 'Stock Crítico', color: 'bg-red-100 text-red-800' };
    } else if (porcentaje <= 30) {
      return { texto: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { texto: 'Stock Normal', color: 'bg-green-100 text-green-800' };
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.id_departamento) {
      errors.id_departamento = 'Debe seleccionar un usuario';
    }

    if (!formData.id_producto) {
      errors.id_producto = 'Debe seleccionar un producto';
    }

    if (formData.cantidad_asignada <= 0) {
      setValidationError('La cantidad asignada debe ser mayor a 0');
      return false;
    }

    if (formData.cantidad_disponible < 0) {
      setValidationError('La cantidad disponible no puede ser negativa');
      return false;
    }

    if (formData.cantidad_disponible > formData.cantidad_asignada) {
      setValidationError('La cantidad disponible no puede ser mayor a la asignada');
      return false;
    }

    // Verificar duplicados solo para nuevos registros
    if (modalMode === 'create') {
      const duplicado = fondosFijos.find(
        (f) =>
          f.id_departamento === formData.id_departamento && f.id_producto === formData.id_producto
      );
      if (duplicado) {
        setValidationError('Ya existe un stock fijo para este usuario y producto');
        return false;
      }
    }

    setFormErrors(errors);
    setValidationError(null);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('cantidad') ? parseInt(value) || 0 : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    setValidationError(null);

    try {
      const url =
        modalMode === 'create' ? '/api/stock-fijo' : `/api/stock-fijo/${selectedFondo?.id_fondo}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const data =
        modalMode === 'create'
          ? formData
          : {
              cantidad_asignada: formData.cantidad_asignada,
              cantidad_disponible: formData.cantidad_disponible,
            };

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Error al guardar el stock fijo';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el error, usar mensaje genérico
        }

        if (response.status === 401) {
          showToast('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        } else {
          showToast(errorMessage, 'error');
          return;
        }
      }

      const result = await response.json();

      if (result.success) {
        showToast(
          modalMode === 'create'
            ? 'Stock fijo creado correctamente'
            : 'Stock fijo actualizado correctamente',
          'success'
        );
        setShowModal(false);
        fetchFondosFijos();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar el stock fijo', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (fondo: FondoFijo) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el stock fijo para "${fondo.usuario.nombre}" del producto "${fondo.producto.descripcion}"?`
      )
    )
      return;

    try {
      const response = await apiFetch(`/api/stock-fijo/${fondo.id_fondo}`, { method: 'DELETE' });
      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Stock fijo eliminado correctamente', 'success');
        fetchFondosFijos();
      } else {
        showToast(result.error || 'Error al eliminar el stock fijo', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Stock Fijo</h1>
              <p className="text-gray-600 mt-1">
                Administra el inventario asignado por usuario y producto
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nuevo stock fijo"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Stock Fijo
            </button>
          </div>
        </div>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stock Fijo</p>
                <p className="text-2xl font-bold text-gray-900">{(fondosFijos || []).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Asignado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(fondosFijos || []).reduce((sum, fondo) => sum + fondo.cantidad_asignada, 0)}{' '}
                  unidades
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14l-1.5 9A2 2 0 0115.5 19h-7A2 2 0 016.5 17L5 8zM5 8l-1-4H2m4 4h12"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Disponible</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(fondosFijos || []).reduce((sum, fondo) => sum + fondo.cantidad_disponible, 0)}{' '}
                  unidades
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por usuario, producto o categoría
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Resetear a la primera página al buscar
                }}
                placeholder="Escribe para buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <input
                  id="showAll_stock_fijo"
                  name="showAll"
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => {
                    setShowAll(e.target.checked);
                    setCurrentPage(1); // Resetear a la primera página
                    if (e.target.checked) {
                      setSearchTerm(''); // Limpiar búsqueda si se marca 'mostrar todos'
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Mostrar todo el stock fijo</span>
              </label>
            </div>
          </div>
        </div>
        {/* Lista de stock fijo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stock Fijo Registrado</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {fondosFiltrados.length} asignaciones
            </p>
          </div>

          {fondosFiltrados.length === 0 ? (
            <div className="p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {!showAll && searchTerm.trim() === ''
                  ? 'Selecciona una opción para ver stock fijo'
                  : searchTerm.trim() !== ''
                    ? 'No se encontró stock fijo con esa búsqueda'
                    : 'No hay stock fijo registrado'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === ''
                  ? "Marca 'Mostrar todo el stock fijo' o busca por usuario/producto"
                  : searchTerm.trim() !== ''
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comience creando un nuevo stock fijo.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fondosParaPagina.map((fondo) => {
                const estadoStock = getEstadoStock(fondo);
                return (
                  <div key={fondo.id_fondo} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {fondo.usuario.nombre}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {fondo.producto.descripcion}
                              {fondo.usuario.email && ` • ${fondo.usuario.email}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Categoría: {fondo.producto.categoria}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                              {formatearFecha(fondo.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500">Asignado</p>
                          </div>
                          <div className="text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoStock.color}`}
                            >
                              {estadoStock.texto}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openViewModal(fondo)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(fondo)}
                          className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Editar"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(fondo)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, fondosFiltrados.length)} de{' '}
                  {fondosFiltrados.length} resultados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>{' '}
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header mejorado */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nuevo Stock Fijo'}
                        {modalMode === 'edit' && 'Editar Stock Fijo'}
                        {modalMode === 'view' && 'Detalles del Stock Fijo'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' &&
                          'Completa los datos para crear un nuevo stock fijo'}
                        {modalMode === 'edit' && 'Actualiza la información del stock fijo'}
                        {modalMode === 'view' && 'Información detallada del stock fijo'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-150"
                    title="Cerrar modal"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del formulario con scroll mejorado */}
              <div className="overflow-y-auto max-h-[calc(95vh-140px)] custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-6">
                  {/* Alerta de error mejorada */}
                  {validationError && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-md mb-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium">{validationError}</span>
                      </div>
                    </div>
                  )}

                  {/* Secciones organizadas */}
                  <div className="space-y-6">
                    {/* Sección: Información Básica */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        Información Básica
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cliente */}
                        <div className="usuario-search-container relative">
                          <label
                            htmlFor="usuario-search"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Cliente *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="usuario-search"
                              value={
                                formData.id_departamento && !isSearchingUsuario
                                  ? getNombreUsuarioSeleccionado()
                                  : usuarioSearch
                              }
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setUsuarioSearch(newValue);

                                // Si hay un cliente seleccionado y empieza a escribir, limpiar selección
                                if (formData.id_departamento) {
                                  setFormData((prev) => ({ ...prev, id_departamento: '' }));
                                }

                                // Activar modo búsqueda siempre que se escriba
                                setIsSearchingUsuario(true);
                                setShowUsuarioDropdown(true); // Siempre mostrar dropdown cuando se escribe
                              }}
                              onFocus={() => {
                                // Siempre activar búsqueda al hacer focus (solo si no hay cliente seleccionado)
                                if (!formData.id_departamento) {
                                  setIsSearchingUsuario(true);
                                }
                              }}
                              placeholder="Buscar cliente por nombre, email, empresa..."
                              disabled={modalMode === 'view' || modalMode === 'edit'}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.id_departamento ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' || modalMode === 'edit' ? 'bg-gray-50' : ''}`}
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                              </svg>
                            </div>
                            {formData.id_departamento &&
                              modalMode === 'create' &&
                              !isSearchingUsuario && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, id_departamento: '' }));
                                    setUsuarioSearch('');
                                    setShowUsuarioDropdown(false);
                                    setIsSearchingUsuario(false);
                                    setTimeout(() => {
                                      const input = document.getElementById('usuario-search');
                                      if (input) {
                                        input.focus();
                                        setIsSearchingUsuario(true);
                                      }
                                    }, 50);
                                  }}
                                  title="Limpiar selección de cliente"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                          </div>

                          {showUsuarioDropdown && modalMode === 'create' && (
                            <div className="absolute z-[70] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {usuariosFiltrados.length > 0 ? (
                                usuariosFiltrados.map((usuario) => (
                                  <button
                                    key={usuario.id}
                                    type="button"
                                    data-usuario-item="true"
                                    onClick={() => seleccionarUsuario(usuario)}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {usuario.nombre}
                                    </div>
                                    {usuario.email && (
                                      <div className="text-sm text-gray-600">{usuario.email}</div>
                                    )}
                                    {usuario.empresa && (
                                      <div className="text-xs text-gray-500">
                                        Empresa: {usuario.empresa}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-400">
                                      Clave: {usuario.clave || 'Sin clave'}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-gray-500 text-sm text-center">
                                  {usuarioSearch.length < 1
                                    ? 'Escribe para buscar clientes...'
                                    : 'No se encontraron clientes'}
                                </div>
                              )}
                            </div>
                          )}
                          {formErrors.id_departamento && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.id_departamento}
                            </p>
                          )}
                        </div>

                        {/* Producto */}
                        <div className="producto-search-container relative">
                          <label
                            htmlFor="producto-search"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Producto *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="producto-search"
                              value={
                                formData.id_producto && !isSearchingProducto
                                  ? getNombreProductoSeleccionado()
                                  : productoSearch
                              }
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setProductoSearch(newValue);

                                // Si hay un producto seleccionado y empieza a escribir, limpiar selección
                                if (formData.id_producto) {
                                  setFormData((prev) => ({ ...prev, id_producto: '' }));
                                }

                                // Activar modo búsqueda
                                setIsSearchingProducto(true);
                                setShowProductoDropdown(newValue.length > 0);
                              }}
                              onFocus={() => {
                                // Solo activar búsqueda si no hay producto seleccionado
                                if (!formData.id_producto) {
                                  setIsSearchingProducto(true);
                                  if (productoSearch.length > 0) {
                                    setShowProductoDropdown(true);
                                  }
                                }
                              }}
                              placeholder="Buscar producto por nombre, categoría o ID..."
                              disabled={modalMode === 'view' || modalMode === 'edit'}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.id_producto ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' || modalMode === 'edit' ? 'bg-gray-50' : ''}`}
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                            {formData.id_producto &&
                              modalMode === 'create' &&
                              !isSearchingProducto && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, id_producto: '' }));
                                    setProductoSearch('');
                                    setShowProductoDropdown(false);
                                    setIsSearchingProducto(false);
                                    setTimeout(() => {
                                      const input = document.getElementById('producto-search');
                                      if (input) {
                                        input.focus();
                                        setIsSearchingProducto(true);
                                      }
                                    }, 50);
                                  }}
                                  title="Limpiar selección de producto"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                          </div>

                          {showProductoDropdown && modalMode === 'create' && (
                            <div className="absolute z-[70] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {productosFiltrados.length > 0 ? (
                                productosFiltrados.map((producto) => (
                                  <button
                                    key={producto.id}
                                    type="button"
                                    data-producto-item="true"
                                    onClick={() => seleccionarProducto(producto)}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {producto.descripcion}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {producto.clave || producto.clave2 || 'Sin clave'} | Stock:{' '}
                                      {producto.cantidad}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-gray-500 text-sm text-center">
                                  {productoSearch.length < 1
                                    ? 'Escribe para buscar productos...'
                                    : 'No se encontraron productos'}
                                </div>
                              )}
                            </div>
                          )}
                          {formErrors.id_producto && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.id_producto}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección: Cantidades */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                          />
                        </svg>
                        Información de Cantidades
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cantidad Asignada */}
                        <div>
                          <label
                            htmlFor="cantidad_asignada"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Cantidad Asignada (unidades) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="cantidad_asignada"
                              name="cantidad_asignada"
                              value={formData.cantidad_asignada}
                              onChange={handleChange}
                              min="0"
                              step="1"
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Cantidad Disponible */}
                        <div>
                          <label
                            htmlFor="cantidad_disponible"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Cantidad Disponible (unidades) *
                          </label>
                          <input
                            type="number"
                            id="cantidad_disponible"
                            name="cantidad_disponible"
                            value={formData.cantidad_disponible}
                            onChange={handleChange}
                            min="0"
                            max={formData.cantidad_asignada}
                            step="1"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="0"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            La alerta de reabastecimiento se basa en el punto de reorden configurado
                            en el producto
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer con botones mejorado */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Los campos marcados con * son obligatorios
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-150"
                  >
                    Cancelar
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      form="stock-fijo-form"
                      disabled={submitLoading}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center"
                      onClick={handleSubmit}
                    >
                      {submitLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          {modalMode === 'create' ? 'Crear Stock Fijo' : 'Actualizar Stock Fijo'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import ProtectedPage from '@/app/components/ProtectedPage';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/fetcher';
import {
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Categoria {
  id: string;
  descripcion: string;
  activo: boolean;
}

interface UnidadMedida {
  id: string;
  clave: string;
  nombre: string;
  descripcion?: string;
}

interface Proveedor {
  id: string;
  nombre: string;
  razon_social?: string;
  rfc?: string;
  email?: string;
  activo: boolean;
}

interface Producto {
  id: string;
  clave?: string;
  clave2?: string;
  descripcion: string;
  categoriaId?: string;
  cantidad?: number;
  precio?: number;
  proveedor?: string;
  proveedor_id?: string;
  fechaVencimiento?: string;
  estado?: string;
  imagen?: string;
  numero_lote?: string;
  cantidad_minima?: number;
  cantidad_maxima?: number;
  punto_reorden?: number;
  dias_reabastecimiento?: number;
  unidad_medida_id?: string;
  unidades_medida?: UnidadMedida;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  clave: string;
  clave2: string;
  descripcion: string;
  categoriaId: string;
  cantidad: number;
  precio: number;
  fechaVencimiento: string;
  estado: string;
  imagen: string;
  numero_lote: string;
  cantidad_maxima: number;
  punto_reorden: number;
  dias_reabastecimiento: number;
  unidad_medida_id: string;
  activo: boolean;
}

interface FormErrors {
  clave?: string;
  clave2?: string;
  nombre?: string;
  descripcion?: string;
  categoriaId?: string;
  cantidad?: string;
  precio?: string;
  fechaVencimiento?: string;
  estado?: string;
  imagen?: string;
  numero_lote?: string;
  cantidad_minima?: string;
  cantidad_maxima?: string;
  punto_reorden?: string;
  dias_reabastecimiento?: string;
  unidad_medida_id?: string;
  activo?: string;
}

function ProductosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [_proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce de 500ms
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clave: '',
    clave2: '',
    descripcion: '',
    categoriaId: '',
    cantidad: 0,
    precio: 0,
    fechaVencimiento: '',
    estado: 'DISPONIBLE',
    imagen: '',
    numero_lote: '',
    cantidad_maxima: 0,
    punto_reorden: 0,
    dias_reabastecimiento: 7,
    unidad_medida_id: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cargar productos
  const fetchProductos = useCallback(async () => {
    try {
      // Usar la API de inventario SIN filtro de stock (inStock=false)
  const response = await api.get(`/api/inventario?limit=1000`);
      if (response.ok) {
        const result = await response.json();
        if (result.inventarios) {
          // Mapear datos a productos con activo basado en estado
          // IMPORTANTE: Convertir categoria_id (snake_case) a categoriaId (camelCase)
          const productosConActivo = result.inventarios.map((item: any) => ({
            ...item,
            categoriaId: item.categoria_id, // Mapear categoria_id a categoriaId
            activo: item.estado !== 'DESCONTINUADO' && item.estado !== 'descontinuado'
          }));
          setProductos(productosConActivo);
        } else {
setProductos([]);
        }
      } else {
setProductos([]);
      }
    } catch (error) {
setProductos([]);
    }
  }, []);

  // Cargar categor�as
  const fetchCategorias = useCallback(async () => {
    try {
  const response = await api.get('/api/categorias');
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setCategorias(result.data.filter((c: Categoria) => c.activo));
        } else {
setCategorias([]);
        }
      } else {
setCategorias([]);
      }
    } catch (error) {
setCategorias([]);
    }
  }, []);

  // Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    try {
  const response = await api.get('/api/proveedores?activo=true&limit=1000');
      if (response.ok) {
        const result = await response.json();
        if (result.proveedores) {
          setProveedores(result.proveedores);
        } else {
          setProveedores([]);
        }
      } else {
        setProveedores([]);
      }
    } catch (error) {
      setProveedores([]);
    }
  }, []);

  // Cargar unidades de medida
  const fetchUnidadesMedida = useCallback(async () => {
    try {
  const response = await api.get('/api/unidades-medida');
      if (response.ok) {
        const unidades = await response.json();
        setUnidadesMedida(unidades);
      } else {
        setUnidadesMedida([]);
      }
    } catch (error) {
      setUnidadesMedida([]);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchProductos();
      fetchCategorias();
      fetchProveedores();
      fetchUnidadesMedida();
    }
  }, [session, fetchProductos, fetchCategorias, fetchProveedores, fetchUnidadesMedida]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const resetForm = () => {
    // Obtener unidad PIEZA por defecto
    const piezaUnidad = unidadesMedida.find(u => u.clave === 'PIEZA');
    
    setFormData({ 
      clave: '',
      clave2: '',
      descripcion: '',
      categoriaId: '',
      cantidad: 0,
      precio: 0,
      fechaVencimiento: '',
      estado: 'DISPONIBLE',
      imagen: '',
      numero_lote: '',
      cantidad_maxima: 0,
      punto_reorden: 0,
      dias_reabastecimiento: 7,
      unidad_medida_id: piezaUnidad?.id || '',
      activo: true
    });
    setFormErrors({});
    setSelectedProducto(null);
    setShowModal(false);
  };

  const openViewModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setFormData({
      clave: producto.clave || '',
      clave2: producto.clave2 || '',
      descripcion: producto.descripcion || '',
      categoriaId: producto.categoriaId || '',
      cantidad: producto.cantidad || 0,
      precio: producto.precio || 0,
      fechaVencimiento: producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '',
      estado: producto.estado || 'DISPONIBLE',
      imagen: producto.imagen || '',
      numero_lote: producto.numero_lote || '',
      cantidad_maxima: producto.cantidad_maxima || 0,
      punto_reorden: producto.punto_reorden || 0,
      dias_reabastecimiento: producto.dias_reabastecimiento || 7,
      unidad_medida_id: producto.unidad_medida_id || '',
      activo: producto.activo
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setFormData({
      clave: producto.clave || '',
      clave2: producto.clave2 || '',
      descripcion: producto.descripcion || '',
      categoriaId: producto.categoriaId || '',
      cantidad: producto.cantidad || 0,
      precio: producto.precio || 0,
      fechaVencimiento: producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toISOString().split('T')[0] : '',
      estado: producto.estado || 'DISPONIBLE',
      imagen: producto.imagen || '',
      numero_lote: producto.numero_lote || '',
      cantidad_maxima: producto.cantidad_maxima || 0,
      punto_reorden: producto.punto_reorden || 0,
      dias_reabastecimiento: producto.dias_reabastecimiento || 7,
      unidad_medida_id: producto.unidad_medida_id || '',
      activo: producto.activo
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginaci�n - SIEMPRE muestra todos los productos sin importar existencia
  const productosFiltrados = (() => {
    const todosLosProductos = productos || [];
    
    // Si no Est� marcado "mostrar todos" y no hay b�squeda, no mostrar nada
    if (!showAll && debouncedSearchTerm.trim() === "") {
      return [];
    }
    
    // Si Est� marcado "mostrar todos" y no hay b�squeda, mostrar todos los productos
    if (showAll && debouncedSearchTerm.trim() === "") {
      return todosLosProductos;
    }
    
    // Si hay b�squeda, filtrar TODOS los productos (sin filtro de existencia)
    if (debouncedSearchTerm.trim() !== "") {
      return todosLosProductos.filter(producto => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
          (producto.descripcion && producto.descripcion.toLowerCase().includes(searchLower)) ||
          (producto.estado && producto.estado.toLowerCase().includes(searchLower)) ||
          (producto.clave && producto.clave.toLowerCase().includes(searchLower)) ||
          (producto.clave2 && producto.clave2.toLowerCase().includes(searchLower))
        );
      });
    }
    
    return [];
  })();

  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);
  const productosParaPagina = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validar que al menos una clave esté presente
    if (!formData.clave.trim() && !formData.clave2.trim()) {
      errors.clave = 'Debe proporcionar al menos una clave';
      errors.clave2 = 'Debe proporcionar al menos una clave';
    }

    if (!formData.descripcion.trim()) {
      errors.descripcion = 'La descripci�n es requerida';
    } else if (formData.descripcion.length > 150) {
      errors.descripcion = 'La descripci�n no puede exceder 150 caracteres';
    }

    if (!formData.categoriaId) {
      errors.categoriaId = 'La categor�a es requerida';
    }

    if (formData.cantidad < 0) {
      errors.cantidad = 'La cantidad debe ser mayor o igual a 0';
    }

    // Validar precio solo si se proporciona
    if (formData.precio !== undefined && formData.precio !== null && formData.precio < 0) {
      errors.precio = 'El precio no puede ser negativo';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    
    try {
      const url = modalMode === 'create' 
        ? '/api/inventario' 
        : `/api/inventario/${selectedProducto?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Error al guardar el producto';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el error, usar mensaje gen�rico
        }
        
        if (response.status === 401) {
          showToast('sesi�n expirada. Por favor, inicia sesi�n nuevamente.', 'error');
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

      if (result.success || result.inventario) {
        showToast(modalMode === 'create' ? 'Producto creado correctamente' : 'Producto actualizado correctamente', 'success');
        setShowModal(false);
        fetchProductos();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar el producto', 'error');
      }
    } catch (error) {
showToast('Error de conexi�n', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (producto: Producto) => {
    if (!confirm(`�Est�s seguro de que quieres desactivar el producto "${producto.descripcion}"?`)) return;

    try {
      const response = await apiFetch(`/api/inventario/${producto.id}`, { method: 'DELETE' });

      // Manejar respuestas no-JSON (p.ej. redirecciones a login que devuelven HTML)
      const contentType = response.headers.get('content-type') || '';
      let result: any = null;

      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (err) {
          // Si falla el parseo JSON, tratamos como error de conexi�n
          showToast('Error de conexi�n', 'error');
          return;
        }
      } else {
        // No es JSON: si es 401 asumimos sesi�n inv�lida; en otro caso mostrar error gen�rico
        if (response.status === 401) {
          showToast('Sesi�n expirada. Por favor, inicia sesi�n nuevamente.', 'error');
          setTimeout(() => { window.location.href = '/login'; }, 1200);
          return;
        }
        showToast('Error de conexi�n', 'error');
        return;
      }

      if (response.ok && (result?.success || result?.message)) {
        showToast('Producto desactivado correctamente', 'success');
        fetchProductos();
      } else {
        showToast(result?.error || 'Error al desactivar el producto', 'error');
      }
    } catch (error) {
      showToast('Error de conexi�n', 'error');
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
              <h1 className="text-2xl font-bold text-gray-900">Gesti�n de Productos</h1>
              <p className="text-gray-600 mt-1">Administra tu cat�logo de productos</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/productos/nuevo')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nuevo producto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Estad�sticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{(productos || []).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(productos || []).filter(p => p.activo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(productos || []).filter(p => !p.activo).length}
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
                Buscar por nombre, descripci�n, proveedor o estado
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Resetear a la primera p�gina al buscar
                }}
                placeholder="Escribe para buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="showAll_products" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <input
                  id="showAll_products"
                  name="showAll"
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => {
                    setShowAll(e.target.checked);
                    setCurrentPage(1); // Resetear a la primera p�gina
                    if (e.target.checked) {
                      setSearchTerm(""); // Limpiar b�squeda si se marca 'mostrar todos'
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Mostrar todos los productos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Productos Registrados</h2>
            <p className="text-sm text-gray-600 mt-1">Total: {productosFiltrados.length} productos</p>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {!showAll && searchTerm.trim() === "" 
                  ? "Selecciona una opci�n para ver productos" 
                  : searchTerm.trim() !== "" 
                    ? "No se encontraron productos con esa b�squeda" 
                    : "No hay productos registrados"
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === "" 
                  ? "Marca 'Mostrar todos los productos' o busca por nombre/descripci�n" 
                  : searchTerm.trim() !== "" 
                    ? "Intenta con otros t�rminos de b�squeda" 
                    : "Comience creando un nuevo producto."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {productosParaPagina.map((producto) => (
                <div key={producto.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {producto.imagen ? (
                          <Image
                            src={producto.imagen}
                            alt={`Foto de ${producto.descripcion}`}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {producto.descripcion}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {producto.descripcion || 'Sin descripci�n'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {producto.cantidad || 0}
                          </p>
                          <p className="text-xs text-gray-500">Stock</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            ${(producto.precio || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Precio</p>
                        </div>
                        <div className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            producto.estado === 'DISPONIBLE'
                              ? 'bg-green-100 text-green-800'
                              : producto.estado === 'AGOTADO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {producto.estado || 'DISPONIBLE'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(producto)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditModal(producto)}
                        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {producto.activo && (
                        <button
                          onClick={() => handleDelete(producto)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Desactivar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* paginaci�n */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, productosFiltrados.length)} de {productosFiltrados.length} resultados
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
                  p�gina {currentPage} de {totalPages}
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
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header mejorado */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nuevo Producto'}
                        {modalMode === 'edit' && 'Editar Producto'}
                        {modalMode === 'view' && 'Detalles del Producto'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' && 'Completa los datos para crear un nuevo producto'}
                        {modalMode === 'edit' && 'Actualiza la informaci�n del producto'}
                        {modalMode === 'view' && 'informaci�n detallada del producto'}
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
                  {/* Secciones organizadas */}
                  <div className="space-y-6">
                    {/* Sección: informaci�n Básica */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        informaci�n Básica
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* descripci�n */}
                        <div className="md:col-span-2">
                          <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-2">
                            descripci�n del Producto *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="descripcion"
                              name="descripcion"
                              value={formData.descripcion}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.descripcion ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              maxLength={150}
                              placeholder="Ej. Laptop HP Pavilion 15"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          </div>
                          {formErrors.descripcion && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.descripcion}</p>
                          )}
                        </div>

                        {/* Clave */}
                        <div>
                          <label htmlFor="clave" className="block text-sm font-semibold text-gray-700 mb-2">
                            Clave {modalMode !== 'view' && <span className="text-xs text-gray-500">(al menos una requerida)</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="clave"
                              name="clave"
                              value={formData.clave}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.clave ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              maxLength={50}
                              placeholder="Ej. PROD-001"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                          </div>
                          {formErrors.clave && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.clave}</p>
                          )}
                        </div>

                        {/* Clave2 */}
                        <div>
                          <label htmlFor="clave2" className="block text-sm font-semibold text-gray-700 mb-2">
                            Clave 2 {modalMode !== 'view' && <span className="text-xs text-gray-500">(opcional)</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="clave2"
                              name="clave2"
                              value={formData.clave2}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.clave2 ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              maxLength={50}
                              placeholder="Ej. ALT-001"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                          </div>
                          {formErrors.clave2 && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.clave2}</p>
                          )}
                        </div>

                        {/* categor�a */}
                        <div>
                          <label htmlFor="categoriaId" className="block text-sm font-semibold text-gray-700 mb-2">
                            categor�a *
                          </label>
                          <select
                            id="categoriaId"
                            name="categoriaId"
                            value={formData.categoriaId}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.categoriaId ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                          >
                            <option value="">Seleccionar categor�a</option>
                            {categorias.map((categoria) => (
                              <option key={categoria.id} value={categoria.id}>
                                {categoria.descripcion}
                              </option>
                            ))}
                          </select>
                          {formErrors.categoriaId && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.categoriaId}</p>
                          )}
                        </div>

                        {/* Estado Activo */}
                        {modalMode !== 'view' && (
                          <div className="flex items-center justify-center">
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 w-full">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="activo"
                                  name="activo"
                                  checked={formData.activo}
                                  onChange={handleChange}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="activo" className="ml-3 text-sm font-medium text-gray-700">
                                  Producto Activo
                                </label>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                formData.activo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {formData.activo ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección: Inventario y Precios */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Inventario y Precios
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Precio */}
                        <div>
                          <label htmlFor="precio" className="block text-sm font-semibold text-gray-700 mb-2">
                            Precio Unitario
                          </label>
                          <input
                            type="number"
                            id="precio"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.precio ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            placeholder="0.00"
                          />
                          {formErrors.precio && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.precio}</p>
                          )}
                        </div>

                        {/* Punto de Reorden */}
                        <div>
                          <label htmlFor="punto_reorden" className="block text-sm font-semibold text-gray-700 mb-2">
                            Punto de Reorden *
                            <span className="text-xs text-gray-500 ml-2">(Alerta de reabastecimiento)</span>
                          </label>
                          <input
                            type="number"
                            id="punto_reorden"
                            name="punto_reorden"
                            value={formData.punto_reorden}
                            onChange={handleChange}
                            min="0"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.punto_reorden ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            placeholder="Ej: 50"
                          />
                          {formErrors.punto_reorden && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.punto_reorden}</p>
                          )}
                          {modalMode !== 'view' && (
                            <p className="mt-1 text-xs text-gray-500">
                              Cantidad que activa una alerta para hacer pedido
                            </p>
                          )}
                        </div>

                        {/* Cantidad Máxima */}
                        <div>
                          <label htmlFor="cantidad_maxima" className="block text-sm font-semibold text-gray-700 mb-2">
                            Cantidad Máxima
                            <span className="text-xs text-gray-500 ml-2">(Límite de stock)</span>
                          </label>
                          <input
                            type="number"
                            id="cantidad_maxima"
                            name="cantidad_maxima"
                            value={formData.cantidad_maxima}
                            onChange={handleChange}
                            min="0"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.cantidad_maxima ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            placeholder="Ej: 200"
                          />
                          {formErrors.cantidad_maxima && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.cantidad_maxima}</p>
                          )}
                          {modalMode !== 'view' && (
                            <p className="mt-1 text-xs text-gray-500">
                              Alerta cuando se excede este límite
                            </p>
                          )}
                        </div>

                        {/* Días de Reabastecimiento */}
                        <div>
                          <label htmlFor="dias_reabastecimiento" className="block text-sm font-semibold text-gray-700 mb-2">
                            Días de Reabastecimiento
                          </label>
                          <input
                            type="number"
                            id="dias_reabastecimiento"
                            name="dias_reabastecimiento"
                            value={formData.dias_reabastecimiento}
                            onChange={handleChange}
                            min="1"
                            max="365"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.dias_reabastecimiento ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            placeholder="Días del proveedor"
                          />
                          {formErrors.dias_reabastecimiento && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.dias_reabastecimiento}</p>
                          )}
                        </div>

                        {/* Estado */}
                        <div>
                          <label htmlFor="estado" className="block text-sm font-semibold text-gray-700 mb-2">
                            Estado
                          </label>
                          <select
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                          >
                            <option value="DISPONIBLE">Disponible</option>
                            <option value="AGOTADO">Agotado</option>
                            <option value="DESCONTINUADO">Descontinuado</option>
                          </select>
                        </div>

                        {/* Unidad de Medida */}
                        <div>
                          <label htmlFor="unidad_medida_id" className="block text-sm font-semibold text-gray-700 mb-2">
                            Unidad de Medida <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="unidad_medida_id"
                            name="unidad_medida_id"
                            value={formData.unidad_medida_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.unidad_medida_id ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            required
                          >
                            <option value="">Seleccione una unidad</option>
                            {unidadesMedida.map((unidad) => (
                              <option key={unidad.id} value={unidad.id}>
                                {unidad.clave} - {unidad.nombre}
                              </option>
                            ))}
                          </select>
                          {formErrors.unidad_medida_id && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.unidad_medida_id}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección: informaci�n Adicional */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        informaci�n Adicional
                      </h4>
                      
                      <p className="text-sm text-gray-500 italic">
                        Los números de lote, cantidades y fechas de vencimiento se gestionan a través del módulo de Entradas de Inventario.
                      </p>
                    </div>

                    {/* Sección: Imagen del Producto */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Imagen del Producto
                      </h4>
                      
                      <div className="flex items-start space-x-4">
                        {/* Preview de la imagen */}
                        <div className="flex-shrink-0">
                          {formData.imagen || (selectedProducto?.imagen) ? (
                            <div className="relative group">
                              <Image
                                src={formData.imagen || selectedProducto?.imagen || ''}
                                alt="Imagen del producto"
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                              />
                              {modalMode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      imagen: ''
                                    }));
                                  }}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-600"
                                  title="Eliminar imagen"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Input de archivo mejorado */}
                        {modalMode !== 'view' && (
                          <div className="flex-1">
                            <input
                              type="file"
                              id="imagen"
                              name="imagen"
                              accept="image/*"
                              title="Seleccionar archivo de imagen para el producto"
                              aria-label="Seleccionar archivo de imagen para el producto"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Validar tamaño del archivo (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error('El archivo debe ser menor a 5MB');
                                    return;
                                  }

                                  const formDataUpload = new FormData();
                                  formDataUpload.append('file', file);

                                  try {
                                    const response = await apiFetch('/api/upload', {
                                      method: 'POST',
                                      body: formDataUpload,
                                    });

                                    if (!response.ok) throw new Error('Error al subir la imagen');

                                    const data = await response.json();
                                    if (data.success && data.path) {
                                      setFormData(prev => ({
                                        ...prev,
                                        imagen: data.path
                                      }));
                                      toast.success('Imagen subida correctamente');
                                    } else {
                                      throw new Error('Error al procesar la imagen');
                                    }
                                  } catch (error) {
                                    toast.error('Error al subir la imagen');
}
                                }
                              }}
                              className="block w-full text-sm text-gray-600
                                file:mr-4 file:py-3 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 file:transition-colors file:duration-150
                                border border-gray-300 rounded-lg cursor-pointer
                                focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              PNG, JPG, GIF hasta 5MB. Se recomienda una imagen cuadrada.
                            </p>
                          </div>
                        )}
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
                      form="producto-form"
                      disabled={submitLoading}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center"
                      onClick={handleSubmit}
                    >
                      {submitLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          {modalMode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
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

// Exportar el componente protegido
export default function ProtectedProductosPage() {
  console.log('🔍 [PRODUCTOS PAGE] Inicializando con módulo: CATALOGOS_PRODUCTOS');
  return (
    <ProtectedPage requiredPermission={{ modulo: 'CATALOGOS_PRODUCTOS', accion: 'LEER' }}>
      <ProductosPage />
    </ProtectedPage>
  );
}


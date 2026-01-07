'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import apiFetch from '@/lib/fetcher';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export default function CategoriasPage() {
  const { data: _session } = useSession();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    activo: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar categorías
  const fetchCategorias = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/categorias?limit=100`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategorias(result.data);
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

  useEffect(() => {
    if (_session) {
      fetchCategorias();
    }
  }, [_session, fetchCategorias]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setFormErrors({});
    setSelectedCategoria(null);
    setShowModal(false);
    setValidationError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedCategoria(null);
    setShowModal(true);
  };

  const openViewModal = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo,
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo,
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginación
  const categoriasFiltradas = (() => {
    // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
    if (!showAll && searchTerm.trim() === '') {
      return [];
    }

    // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
    if (showAll && searchTerm.trim() === '') {
      return categorias || [];
    }

    // Si hay búsqueda, filtrar independientemente del estado del checkbox
    if (searchTerm.trim() !== '') {
      return (categorias || []).filter((categoria) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          categoria.nombre.toLowerCase().includes(searchLower) ||
          (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchLower))
        );
      });
    }

    return [];
  })();

  const totalPages = Math.ceil(categoriasFiltradas.length / itemsPerPage);
  const categoriasParaPagina = categoriasFiltradas.slice(
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

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 150) {
      errors.nombre = 'El nombre no puede exceder 150 caracteres';
    }

    if (formData.descripcion.length > 200) {
      errors.descripcion = 'La descripción no puede exceder 200 caracteres';
    }

    setFormErrors(errors);
    setValidationError(null);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
        modalMode === 'create' ? '/api/categorias' : `/api/categorias/${selectedCategoria?.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Error al guardar la categoría';

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
            ? 'Categoría creada correctamente'
            : 'Categoría actualizada correctamente',
          'success'
        );
        setShowModal(false);
        fetchCategorias();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar la categoría', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (categoria: Categoria) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar la categoría "${categoria.nombre}"?`))
      return;

    try {
      const response = await apiFetch(`/api/categorias/${categoria.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Categoría desactivada correctamente', 'success');
        fetchCategorias();
      } else {
        showToast(result.error || 'Error al desactivar la categoría', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  if (!_session) {
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
              <p className="text-gray-600 mt-1">Administra tu catálogo de categorías</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nueva categoría"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva Categoría
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                <p className="text-2xl font-bold text-gray-900">{(categorias || []).length}</p>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorías Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(categorias || []).filter((c) => c.activo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorías Inactivas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(categorias || []).filter((c) => !c.activo).length}
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
                Buscar por nombre o descripción
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
                <span>Mostrar todas las categorías</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Categorías Registradas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {categoriasFiltradas.length} categorías
            </p>
          </div>

          {categoriasFiltradas.length === 0 ? (
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {!showAll && searchTerm.trim() === ''
                  ? 'Selecciona una opción para ver categorías'
                  : searchTerm.trim() !== ''
                    ? 'No se encontraron categorías con esa búsqueda'
                    : 'No hay categorías registradas'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === ''
                  ? "Marca 'Mostrar todas las categorías' o busca por nombre/descripción"
                  : searchTerm.trim() !== ''
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comience creando una nueva categoría.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categoriasParaPagina.map((categoria) => (
                <div key={categoria.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{categoria.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            {categoria.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {formatearFecha(categoria.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">Registrada</p>
                        </div>
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              categoria.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {categoria.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(categoria)}
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
                        onClick={() => openEditModal(categoria)}
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
                      {categoria.activo && (
                        <button
                          onClick={() => handleDelete(categoria)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Desactivar"
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, categoriasFiltradas.length)} de{' '}
                  {categoriasFiltradas.length} resultados
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nueva Categoría'}
                        {modalMode === 'edit' && 'Editar Categoría'}
                        {modalMode === 'view' && 'Detalles de la Categoría'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' &&
                          'Completa los datos para crear una nueva categoría'}
                        {modalMode === 'edit' && 'Actualiza la información de la categoría'}
                        {modalMode === 'view' && 'Información detallada de la categoría'}
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        Información Básica
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="nombre"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Nombre de la Categoría *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="nombre"
                              name="nombre"
                              value={formData.nombre}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              maxLength={150}
                              placeholder="Ej. Medicamentos, Equipo Médico"
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
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.nombre && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                          )}
                        </div>

                        {/* Descripción */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="descripcion"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Descripción
                          </label>
                          <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.descripcion ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            maxLength={200}
                            placeholder="Descripción de la categoría"
                          />
                          {formErrors.descripcion && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.descripcion}</p>
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
                                <label
                                  htmlFor="activo"
                                  className="ml-3 text-sm font-medium text-gray-700"
                                >
                                  Categoría Activa
                                </label>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  formData.activo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {formData.activo ? '✅ Activa' : '❌ Inactiva'}
                              </span>
                            </div>
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
                      form="categoria-form"
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
                          {modalMode === 'create' ? 'Crear Categoría' : 'Actualizar Categoría'}
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

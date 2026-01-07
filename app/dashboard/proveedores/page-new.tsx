'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import apiFetch from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Proveedor {
  id: string;
  nombre: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rfc?: string;
  contacto?: string;
  sitioWeb?: string;
  notas?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nombre: string;
  razonSocial: string;
  email: string;
  telefono: string;
  direccion: string;
  rfc: string;
  contacto: string;
  sitioWeb: string;
  notas: string;
  activo: boolean;
}

export default function ProveedoresPage() {
  const { data: session } = useSession();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    razonSocial: '',
    email: '',
    telefono: '',
    direccion: '',
    rfc: '',
    contacto: '',
    sitioWeb: '',
    notas: '',
    activo: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/proveedores?limit=100`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProveedores(result.data);
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

  useEffect(() => {
    if (session) {
      fetchProveedores();
    }
  }, [session, fetchProveedores]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const validateEmailUnique = async (email: string, proveedorId?: string): Promise<boolean> => {
    if (!email) return true;

    setIsValidatingEmail(true);

    try {
      const requestBody = { email, proveedorId };

      const response = await apiFetch('/api/proveedores/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return true; // En caso de error, permitir continuar
      }

      const data = await response.json();

      if (!data.isUnique) {
        setValidationError('Este email ya está en uso');
        return false;
      }

      return true;
    } catch (error: unknown) {
      return true; // En caso de error, permitir continuar
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      razonSocial: '',
      email: '',
      telefono: '',
      direccion: '',
      rfc: '',
      contacto: '',
      sitioWeb: '',
      notas: '',
      activo: true,
    });
    setFormErrors({});
    setSelectedProveedor(null);
    setShowModal(false);
    setValidationError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedProveedor(null);
    setShowModal(true);
  };

  const openViewModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      razonSocial: proveedor.razonSocial || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      rfc: proveedor.rfc || '',
      contacto: proveedor.contacto || '',
      sitioWeb: proveedor.sitioWeb || '',
      notas: proveedor.notas || '',
      activo: proveedor.activo,
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      razonSocial: proveedor.razonSocial || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      rfc: proveedor.rfc || '',
      contacto: proveedor.contacto || '',
      sitioWeb: proveedor.sitioWeb || '',
      notas: proveedor.notas || '',
      activo: proveedor.activo,
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginación
  const proveedoresFiltrados = (() => {
    // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
    if (!showAll && searchTerm.trim() === '') {
      return [];
    }

    // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
    if (showAll && searchTerm.trim() === '') {
      return proveedores || [];
    }

    // Si hay búsqueda, filtrar independientemente del estado del checkbox
    if (searchTerm.trim() !== '') {
      return (proveedores || []).filter((proveedor) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          proveedor.nombre.toLowerCase().includes(searchLower) ||
          (proveedor.email && proveedor.email.toLowerCase().includes(searchLower)) ||
          (proveedor.rfc && proveedor.rfc.toLowerCase().includes(searchLower)) ||
          (proveedor.razonSocial && proveedor.razonSocial.toLowerCase().includes(searchLower)) ||
          (proveedor.contacto && proveedor.contacto.toLowerCase().includes(searchLower))
        );
      });
    }

    return [];
  })();

  const totalPages = Math.ceil(proveedoresFiltrados.length / itemsPerPage);
  const proveedoresParaPagina = proveedoresFiltrados.slice(
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

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    }

    if (formData.rfc.trim() && formData.rfc.length > 20) {
      errors.rfc = 'El RFC no puede exceder 20 caracteres';
    }

    if (formData.razonSocial.length > 200) {
      errors.razonSocial = 'La razón social no puede exceder 200 caracteres';
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
      // Validar email único
      if (formData.email.trim()) {
        const isEmailValid = await validateEmailUnique(formData.email, selectedProveedor?.id);
        if (!isEmailValid) {
          setSubmitLoading(false);
          return;
        }
      }

      const url =
        modalMode === 'create' ? '/api/proveedores' : `/api/proveedores/${selectedProveedor?.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Error al guardar el proveedor';

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
            ? 'Proveedor creado correctamente'
            : 'Proveedor actualizado correctamente',
          'success'
        );
        setShowModal(false);
        fetchProveedores();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar el proveedor', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (proveedor: Proveedor) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar el proveedor "${proveedor.nombre}"?`))
      return;

    try {
      const response = await apiFetch(`/api/proveedores/${proveedor.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Proveedor desactivado correctamente', 'success');
        fetchProveedores();
      } else {
        showToast(result.error || 'Error al desactivar el proveedor', 'error');
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
              <p className="text-gray-600 mt-1">Administra tu catálogo de proveedores</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nuevo proveedor"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Proveedor
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{(proveedores || []).length}</p>
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
                <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(proveedores || []).filter((p) => p.activo).length}
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
                <p className="text-sm font-medium text-gray-600">Proveedores Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(proveedores || []).filter((p) => !p.activo).length}
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
                Buscar por nombre, email, RFC o razón social
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
                <span>Mostrar todos los proveedores</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de proveedores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Proveedores Registrados</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {proveedoresFiltrados.length} proveedores
            </p>
          </div>

          {proveedoresFiltrados.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {!showAll && searchTerm.trim() === ''
                  ? 'Selecciona una opción para ver proveedores'
                  : searchTerm.trim() !== ''
                    ? 'No se encontraron proveedores con esa búsqueda'
                    : 'No hay proveedores registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === ''
                  ? "Marca 'Mostrar todos los proveedores' o busca por nombre/email"
                  : searchTerm.trim() !== ''
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comience creando un nuevo proveedor.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {proveedoresParaPagina.map((proveedor) => (
                <div key={proveedor.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{proveedor.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            {proveedor.razonSocial && `${proveedor.razonSocial} • `}
                            {proveedor.email || 'Sin email'}
                          </p>
                          {proveedor.rfc && (
                            <p className="text-xs text-gray-500">RFC: {proveedor.rfc}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {formatearFecha(proveedor.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">Registrado</p>
                        </div>
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              proveedor.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {proveedor.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(proveedor)}
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
                        onClick={() => openEditModal(proveedor)}
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
                      {proveedor.activo && (
                        <button
                          onClick={() => handleDelete(proveedor)}
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
                  {Math.min(currentPage * itemsPerPage, proveedoresFiltrados.length)} de{' '}
                  {proveedoresFiltrados.length} resultados
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nuevo Proveedor'}
                        {modalMode === 'edit' && 'Editar Proveedor'}
                        {modalMode === 'view' && 'Detalles del Proveedor'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' &&
                          'Completa los datos para crear un nuevo proveedor'}
                        {modalMode === 'edit' && 'Actualiza la información del proveedor'}
                        {modalMode === 'view' && 'Información detallada del proveedor'}
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
                            Nombre del Proveedor *
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
                              placeholder="Ej. Proveedora Médica ABC"
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
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.nombre && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                          )}
                        </div>

                        {/* Razón Social */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="razonSocial"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Razón Social
                          </label>
                          <input
                            type="text"
                            id="razonSocial"
                            name="razonSocial"
                            value={formData.razonSocial}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.razonSocial ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            maxLength={200}
                            placeholder="Razón social completa"
                          />
                          {formErrors.razonSocial && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.razonSocial}</p>
                          )}
                        </div>

                        {/* RFC */}
                        <div>
                          <label
                            htmlFor="rfc"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            RFC
                          </label>
                          <input
                            type="text"
                            id="rfc"
                            name="rfc"
                            value={formData.rfc}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.rfc ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            maxLength={20}
                            placeholder="RFC del proveedor"
                          />
                          {formErrors.rfc && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.rfc}</p>
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
                                  Proveedor Activo
                                </label>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  formData.activo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {formData.activo ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección: Información de Contacto */}
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
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Información de Contacto
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Email
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.email ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              placeholder="proveedor@ejemplo.com"
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
                                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                          )}
                          {isValidatingEmail && (
                            <div className="mt-2 flex items-center text-sm text-blue-600">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
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
                              Validando email...
                            </div>
                          )}
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label
                            htmlFor="telefono"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="55 1234 5678"
                          />
                        </div>

                        {/* Contacto */}
                        <div>
                          <label
                            htmlFor="contacto"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Persona de Contacto
                          </label>
                          <input
                            type="text"
                            id="contacto"
                            name="contacto"
                            value={formData.contacto}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="Nombre del contacto"
                          />
                        </div>

                        {/* Sitio Web */}
                        <div>
                          <label
                            htmlFor="sitioWeb"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Sitio Web
                          </label>
                          <input
                            type="url"
                            id="sitioWeb"
                            name="sitioWeb"
                            value={formData.sitioWeb}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="https://ejemplo.com"
                          />
                        </div>

                        {/* Dirección */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="direccion"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Dirección
                          </label>
                          <textarea
                            id="direccion"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            rows={2}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="Dirección completa del proveedor"
                          />
                        </div>

                        {/* Notas */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="notas"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Notas
                          </label>
                          <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            placeholder="Notas adicionales sobre el proveedor"
                          />
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
                      form="proveedor-form"
                      disabled={submitLoading || isValidatingEmail}
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
                      ) : isValidatingEmail ? (
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
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          {modalMode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
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

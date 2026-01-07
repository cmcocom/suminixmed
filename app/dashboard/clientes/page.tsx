'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import apiFetch from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Cliente {
  id: string;
  nombre: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rfc?: string;
  contacto?: string;
  codigo_postal?: string;
  imagen?: string;
  activo: boolean;
  // Campos médicos
  clave?: string;
  medico_tratante?: string;
  especialidad?: string;
  localidad?: string;
  estado?: string;
  pais?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion: string;
  rfc: string;
  contacto: string;
  codigo_postal: string;
  imagen: string;
  activo: boolean;
  // Campos médicos
  clave: string;
  medico_tratante: string;
  especialidad: string;
  localidad: string;
  estado: string;
  pais: string;
}

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    rfc: '',
    contacto: '',
    codigo_postal: '',
    imagen: '',
    activo: true,
    // Campos médicos
    clave: '',
    medico_tratante: '',
    especialidad: '',
    localidad: '',
    estado: '',
    pais: 'México',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar clientes
  const fetchClientes = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/clientes?limit=500`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setClientes(result.data);
        } else {
          setClientes([]);
        }
      } else {
        setClientes([]);
      }
    } catch (error) {
      setClientes([]);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchClientes();
    }
  }, [session, fetchClientes]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const validateEmailUnique = async (email: string, clienteId?: string): Promise<boolean> => {
    if (!email) return true;

    setIsValidatingEmail(true);

    try {
      const requestBody = { email, clienteId };

      const response = await apiFetch('/api/clientes/validate-email', {
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
      empresa: '',
      email: '',
      telefono: '',
      direccion: '',
      rfc: '',
      contacto: '',
      codigo_postal: '',
      imagen: '',
      activo: true,
      // Campos médicos
      clave: '',
      medico_tratante: '',
      especialidad: '',
      localidad: '',
      estado: '',
      pais: 'México',
    });
    setFormErrors({});
    setSelectedCliente(null);
    setShowModal(false);
    setValidationError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedCliente(null);
    setShowModal(true);
  };

  const openViewModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      empresa: cliente.empresa || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      rfc: cliente.rfc || '',
      contacto: cliente.contacto || '',
      codigo_postal: cliente.codigo_postal || '',
      imagen: cliente.imagen || '',
      activo: cliente.activo,
      // Campos médicos
      clave: cliente.clave || '',
      medico_tratante: cliente.medico_tratante || '',
      especialidad: cliente.especialidad || '',
      localidad: cliente.localidad || '',
      estado: cliente.estado || '',
      pais: cliente.pais || 'México',
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      empresa: cliente.empresa || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      rfc: cliente.rfc || '',
      contacto: cliente.contacto || '',
      codigo_postal: cliente.codigo_postal || '',
      imagen: cliente.imagen || '',
      activo: cliente.activo,
      // Campos médicos
      clave: cliente.clave || '',
      medico_tratante: cliente.medico_tratante || '',
      especialidad: cliente.especialidad || '',
      localidad: cliente.localidad || '',
      estado: cliente.estado || '',
      pais: cliente.pais || 'México',
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginación
  const clientesFiltrados = (() => {
    // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
    if (!showAll && searchTerm.trim() === '') {
      return [];
    }

    // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
    if (showAll && searchTerm.trim() === '') {
      return clientes || [];
    }

    // Si hay búsqueda, filtrar independientemente del estado del checkbox
    if (searchTerm.trim() !== '') {
      return (clientes || []).filter((cliente) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          cliente.nombre.toLowerCase().includes(searchLower) ||
          (cliente.email && cliente.email.toLowerCase().includes(searchLower)) ||
          (cliente.rfc && cliente.rfc.toLowerCase().includes(searchLower)) ||
          (cliente.empresa && cliente.empresa.toLowerCase().includes(searchLower)) ||
          (cliente.contacto && cliente.contacto.toLowerCase().includes(searchLower)) ||
          (cliente.clave && cliente.clave.toLowerCase().includes(searchLower)) ||
          (cliente.medico_tratante &&
            cliente.medico_tratante.toLowerCase().includes(searchLower)) ||
          (cliente.especialidad && cliente.especialidad.toLowerCase().includes(searchLower)) ||
          (cliente.localidad && cliente.localidad.toLowerCase().includes(searchLower))
        );
      });
    }

    return [];
  })();

  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const clientesParaPagina = clientesFiltrados.slice(
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

    if (formData.empresa.length > 200) {
      errors.empresa = 'La empresa no puede exceder 200 caracteres';
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
        const isEmailValid = await validateEmailUnique(formData.email, selectedCliente?.id);
        if (!isEmailValid) {
          setSubmitLoading(false);
          return;
        }
      }

      const url = modalMode === 'create' ? '/api/clientes' : `/api/clientes/${selectedCliente?.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Error al guardar el cliente';

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
            ? 'Cliente creado correctamente'
            : 'Cliente actualizado correctamente',
          'success'
        );
        setShowModal(false);
        fetchClientes();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar el cliente', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar el cliente "${cliente.nombre}"?`)) return;

    try {
      const response = await apiFetch(`/api/clientes/${cliente.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Cliente desactivado correctamente', 'success');
        fetchClientes();
      } else {
        showToast(result.error || 'Error al desactivar el cliente', 'error');
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">Administra tu catálogo de clientes</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nuevo cliente"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Cliente
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{(clientes || []).length}</p>
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
                <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(clientes || []).filter((c) => c.activo).length}
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
                <p className="text-sm font-medium text-gray-600">Clientes Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(clientes || []).filter((c) => !c.activo).length}
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
                Buscar por nombre, email, RFC, empresa, clave, médico, especialidad o localidad
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
                <span>Mostrar todos los clientes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Clientes Registrados</h2>
            <p className="text-sm text-gray-600 mt-1">Total: {clientesFiltrados.length} clientes</p>
          </div>

          {clientesFiltrados.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {!showAll && searchTerm.trim() === ''
                  ? 'Selecciona una opción para ver clientes'
                  : searchTerm.trim() !== ''
                    ? 'No se encontraron clientes con esa búsqueda'
                    : 'No hay clientes registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === ''
                  ? "Marca 'Mostrar todos los clientes' o busca por nombre/email"
                  : searchTerm.trim() !== ''
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comience creando un nuevo cliente.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clientesParaPagina.map((cliente) => (
                <div key={cliente.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {cliente.imagen ? (
                          <Image
                            src={cliente.imagen}
                            alt={`Foto de ${cliente.nombre}`}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{cliente.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            {cliente.empresa && `${cliente.empresa} • `}
                            {cliente.email || 'Sin email'}
                          </p>
                          {cliente.rfc && (
                            <p className="text-xs text-gray-500">RFC: {cliente.rfc}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {formatearFecha(cliente.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">Registrado</p>
                        </div>
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cliente.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(cliente)}
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
                        onClick={() => openEditModal(cliente)}
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
                      {cliente.activo && (
                        <button
                          onClick={() => handleDelete(cliente)}
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
                  {Math.min(currentPage * itemsPerPage, clientesFiltrados.length)} de{' '}
                  {clientesFiltrados.length} resultados
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nuevo Cliente'}
                        {modalMode === 'edit' && 'Editar Cliente'}
                        {modalMode === 'view' && 'Detalles del Cliente'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' && 'Completa los datos para crear un nuevo cliente'}
                        {modalMode === 'edit' && 'Actualiza la información del cliente'}
                        {modalMode === 'view' && 'Información detallada del cliente'}
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
                <form id="cliente-form" onSubmit={handleSubmit} className="p-6">
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
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
                            Nombre del Cliente *
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
                              placeholder="Ej. Juan Pérez González"
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
                          </div>
                          {formErrors.nombre && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                          )}
                        </div>

                        {/* Empresa */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor="empresa"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Empresa
                          </label>
                          <input
                            type="text"
                            id="empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                              formErrors.empresa ? 'border-red-500' : 'border-gray-300'
                            } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                            disabled={modalMode === 'view'}
                            maxLength={200}
                            placeholder="Empresa donde trabaja"
                          />
                          {formErrors.empresa && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.empresa}</p>
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
                            placeholder="RFC del cliente"
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
                                  Cliente Activo
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
                              placeholder="cliente@ejemplo.com"
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

                        {/* Dirección */}
                        <div className="md:col-span-1">
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
                            placeholder="Dirección completa del cliente"
                          />
                        </div>

                        {/* Código Postal */}
                        <div>
                          <label
                            htmlFor="codigo_postal"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Código Postal
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="codigo_postal"
                              name="codigo_postal"
                              value={formData.codigo_postal}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.codigo_postal ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              maxLength={10}
                              placeholder="Ej. 12345"
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
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.codigo_postal && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.codigo_postal}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección: Información Médica y Ubicación */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-teal-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Información Médica y Ubicación
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Clave */}
                        <div>
                          <label
                            htmlFor="clave"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Clave del Cliente
                            {modalMode !== 'view' && (
                              <span className="ml-2 text-xs text-teal-600 font-normal">
                                (Editable)
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="clave"
                              name="clave"
                              value={formData.clave}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${
                                modalMode === 'view'
                                  ? 'bg-gray-50 cursor-not-allowed'
                                  : 'border-gray-300 bg-white hover:border-teal-400'
                              }`}
                              disabled={modalMode === 'view'}
                              maxLength={50}
                              placeholder={
                                modalMode === 'view'
                                  ? 'Sin clave asignada'
                                  : 'Ingresa un código único para el cliente'
                              }
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className={`h-5 w-5 ${modalMode === 'view' ? 'text-gray-400' : 'text-teal-500'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                                />
                              </svg>
                            </div>
                          </div>
                          {modalMode !== 'view' && (
                            <p className="mt-1 text-xs text-gray-500">
                              💡 Puedes asignar un código personalizado para identificar al cliente
                            </p>
                          )}
                        </div>

                        {/* Médico Tratante */}
                        <div>
                          <label
                            htmlFor="medico_tratante"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Médico Tratante
                          </label>
                          <input
                            type="text"
                            id="medico_tratante"
                            name="medico_tratante"
                            value={formData.medico_tratante}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            maxLength={200}
                            placeholder="Nombre del médico"
                          />
                        </div>

                        {/* Especialidad */}
                        <div>
                          <label
                            htmlFor="especialidad"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Especialidad
                          </label>
                          <input
                            type="text"
                            id="especialidad"
                            name="especialidad"
                            value={formData.especialidad}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            maxLength={150}
                            placeholder="Ej. Cardiología, Pediatría"
                          />
                        </div>

                        {/* Localidad */}
                        <div>
                          <label
                            htmlFor="localidad"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Localidad / Ciudad
                          </label>
                          <input
                            type="text"
                            id="localidad"
                            name="localidad"
                            value={formData.localidad}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            maxLength={150}
                            placeholder="Ciudad o municipio"
                          />
                        </div>

                        {/* Estado */}
                        <div>
                          <label
                            htmlFor="estado"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Estado / Provincia
                          </label>
                          <input
                            type="text"
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            maxLength={100}
                            placeholder="Estado o provincia"
                          />
                        </div>

                        {/* País */}
                        <div>
                          <label
                            htmlFor="pais"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            País
                          </label>
                          <input
                            type="text"
                            id="pais"
                            name="pais"
                            value={formData.pais}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-all duration-150 ${modalMode === 'view' ? 'bg-gray-50' : 'border-gray-300'}`}
                            disabled={modalMode === 'view'}
                            maxLength={100}
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección: Imagen del Cliente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Imagen del Cliente
                      </h4>

                      <div className="flex items-start space-x-4">
                        {/* Preview de la imagen */}
                        <div className="flex-shrink-0">
                          {formData.imagen || selectedCliente?.imagen ? (
                            <div className="relative group">
                              <Image
                                src={formData.imagen || selectedCliente?.imagen || ''}
                                alt="Imagen del cliente"
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                              />
                              {modalMode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      imagen: '',
                                    }));
                                  }}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-600"
                                  title="Eliminar imagen"
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
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                              <svg
                                className="h-8 w-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
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
                              title="Seleccionar archivo de imagen para el cliente"
                              aria-label="Seleccionar archivo de imagen para el cliente"
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
                                      setFormData((prev) => ({
                                        ...prev,
                                        imagen: data.path,
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
                      form="cliente-form"
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
                          {modalMode === 'create' ? 'Crear Cliente' : 'Actualizar Cliente'}
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

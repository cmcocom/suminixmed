'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Entidad {
  id_empresa: string;
  nombre: string;
  rfc: string;
  logo?: string;
  correo?: string;
  telefono?: string;
  contacto?: string;
  licencia_usuarios_max: number;
  tiempo_sesion_minutos: number;
  fecha_registro: string;
  estatus: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
  capturar_lotes_entradas?: boolean;
}

interface ConfigFolio {
  id: number;
  tipo: 'entrada' | 'salida';
  serie_actual: string;
  proximo_folio: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  nombre: string;
  rfc: string;
  correo: string;
  telefono: string;
  contacto: string;
  licencia: string;
  logo: string;
  tiempo_sesion_minutos: number;
  estatus: 'activo' | 'inactivo';
  capturar_lotes_entradas: boolean;
}

export default function EntidadesPage() {
  const { data: session } = useSession();
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [configFolios, setConfigFolios] = useState<ConfigFolio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedEntidad, setSelectedEntidad] = useState<Entidad | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    rfc: '',
    correo: '',
    telefono: '',
    contacto: '',
    licencia: '',
    logo: '',
    tiempo_sesion_minutos: 30,
    estatus: 'activo',
    capturar_lotes_entradas: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estados para edición de folios
  const [editingFolios, setEditingFolios] = useState<{ entrada: boolean; salida: boolean }>({
    entrada: false,
    salida: false,
  });
  const [foliosTemp, setFoliosTemp] = useState<{
    entrada: ConfigFolio | null;
    salida: ConfigFolio | null;
  }>({
    entrada: null,
    salida: null,
  });

  // Cargar entidades
  const fetchEntidades = useCallback(async () => {
    try {
      const response = await api.get(`/api/entidades?limit=100`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEntidades(result.data);
        } else {
          setEntidades([]);
        }
      } else {
        setEntidades([]);
      }
    } catch (error) {
      setEntidades([]);
    }
  }, []);

  // Cargar configuración de folios
  const fetchConfigFolios = useCallback(async () => {
    try {
      const response = await api.get('/api/config-folios');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfigFolios(result.data);
          // Inicializar valores temporales
          const entrada = result.data.find((c: ConfigFolio) => c.tipo === 'entrada');
          const salida = result.data.find((c: ConfigFolio) => c.tipo === 'salida');
          setFoliosTemp({ entrada, salida });
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración de folios:', error);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchEntidades();
      fetchConfigFolios();
    }
  }, [session, fetchEntidades, fetchConfigFolios]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const validateEmailUnique = async (email: string, entidadId?: string): Promise<boolean> => {
    if (!email) return true;

    setIsValidatingEmail(true);

    try {
      const requestBody = { email, entidadId };

      const response = await api.post('/api/entidades/validate-email', requestBody);

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
      rfc: '',
      correo: '',
      telefono: '',
      contacto: '',
      licencia: '',
      logo: '',
      tiempo_sesion_minutos: 30,
      estatus: 'activo',
      capturar_lotes_entradas: false,
    });
    setFormErrors({});
    setSelectedEntidad(null);
    setShowModal(false);
    setValidationError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedEntidad(null);
    setShowModal(true);
  };

  const openViewModal = (entidad: Entidad) => {
    setSelectedEntidad(entidad);
    setFormData({
      nombre: entidad.nombre,
      rfc: entidad.rfc,
      correo: entidad.correo || '',
      telefono: entidad.telefono || '',
      contacto: entidad.contacto || '',
      licencia: entidad.licencia_usuarios_max?.toString() || '',
      logo: entidad.logo || '',
      tiempo_sesion_minutos: entidad.tiempo_sesion_minutos || 3,
      estatus: entidad.estatus,
      capturar_lotes_entradas: entidad.capturar_lotes_entradas || false,
    });
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (entidad: Entidad) => {
    setSelectedEntidad(entidad);
    setFormData({
      nombre: entidad.nombre,
      rfc: entidad.rfc,
      correo: entidad.correo || '',
      telefono: entidad.telefono || '',
      contacto: entidad.contacto || '',
      licencia: entidad.licencia_usuarios_max?.toString() || '',
      logo: entidad.logo || '',
      tiempo_sesion_minutos: entidad.tiempo_sesion_minutos || 3,
      estatus: entidad.estatus,
      capturar_lotes_entradas: entidad.capturar_lotes_entradas || false,
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // Filtrado y paginación
  const entidadesFiltradas = (() => {
    // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
    if (!showAll && searchTerm.trim() === '') {
      return [];
    }

    // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
    if (showAll && searchTerm.trim() === '') {
      return entidades || [];
    }

    // Si hay búsqueda, filtrar independientemente del estado del checkbox
    if (searchTerm.trim() !== '') {
      return (entidades || []).filter((entidad) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          entidad.nombre.toLowerCase().includes(searchLower) ||
          (entidad.correo && entidad.correo.toLowerCase().includes(searchLower)) ||
          (entidad.rfc && entidad.rfc.toLowerCase().includes(searchLower)) ||
          (entidad.contacto && entidad.contacto.toLowerCase().includes(searchLower))
        );
      });
    }

    return [];
  })();

  const totalPages = Math.ceil(entidadesFiltradas.length / itemsPerPage);
  const entidadesParaPagina = entidadesFiltradas.slice(
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
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 150) {
      errors.nombre = 'El nombre no puede exceder 150 caracteres';
    }

    if (formData.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      errors.correo = 'El formato del email no es válido';
    }

    if (formData.rfc.trim() && formData.rfc.length > 20) {
      errors.rfc = 'El RFC no puede exceder 20 caracteres';
    }

    // Validar tiempo de sesión (5-120 minutos = 2 horas)
    if (
      !formData.tiempo_sesion_minutos ||
      formData.tiempo_sesion_minutos < 5 ||
      formData.tiempo_sesion_minutos > 120
    ) {
      errors.tiempo_sesion_minutos =
        'El tiempo de sesión debe estar entre 5 y 120 minutos (2 horas)';
    }

    // Validar licencia si se proporciona
    if (formData.licencia && formData.licencia.trim()) {
      const licenciaNum = parseInt(formData.licencia);
      if (isNaN(licenciaNum) || licenciaNum < 1) {
        errors.licencia = 'La licencia debe ser un número mayor a 0';
      }
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

    let processedValue: string | number | boolean = value;

    // Procesar valores numéricos
    if (name === 'tiempo_sesion_minutos') {
      const numValue = parseInt(value);
      processedValue = isNaN(numValue) ? 3 : numValue;
    }

    setFormData((prev: FormData) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
    setFormErrors((prev: Record<string, string>) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    setValidationError(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    setValidationError(null);

    try {
      // Validar email único
      if (formData.correo.trim()) {
        const isEmailValid = await validateEmailUnique(
          formData.correo,
          selectedEntidad?.id_empresa
        );
        if (!isEmailValid) {
          setSubmitLoading(false);
          return;
        }
      }

      const url =
        modalMode === 'create' ? '/api/entidades' : `/api/entidades/${selectedEntidad?.id_empresa}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await (method === 'POST' ? api.post(url, formData) : api.put(url, formData));

      if (!response.ok) {
        let errorMessage = 'Error al guardar la entidad';

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
            ? 'Entidad creada correctamente'
            : 'Entidad actualizada correctamente',
          'success'
        );
        setShowModal(false);
        fetchEntidades();
        resetForm();
      } else {
        showToast(result.error || 'Error al guardar la entidad', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (entidad: Entidad) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar la entidad "${entidad.nombre}"?`)) return;

    try {
      const response = await api.del(`/api/entidades/${entidad.id_empresa}`);
      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Entidad desactivada correctamente', 'success');
        fetchEntidades();
      } else {
        showToast(result.error || 'Error al desactivar la entidad', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // Funciones para gestión de folios
  const handleEditFolio = (tipo: 'entrada' | 'salida') => {
    setEditingFolios((prev) => ({ ...prev, [tipo]: true }));
  };

  const handleCancelFolio = (tipo: 'entrada' | 'salida') => {
    // Restaurar valores originales
    const config = configFolios.find((c) => c.tipo === tipo);
    setFoliosTemp((prev) => ({ ...prev, [tipo]: config || null }));
    setEditingFolios((prev) => ({ ...prev, [tipo]: false }));
  };

  const handleSaveFolio = async (tipo: 'entrada' | 'salida') => {
    const config = foliosTemp[tipo];
    if (!config) return;

    try {
      const response = await api.put('/api/config-folios', {
        tipo,
        serie_actual: config.serie_actual,
        proximo_folio: config.proximo_folio,
      });

      if (response.ok) {
        showToast(
          `Configuración de ${tipo === 'entrada' ? 'entradas' : 'salidas'} actualizada`,
          'success'
        );
        fetchConfigFolios();
        setEditingFolios((prev) => ({ ...prev, [tipo]: false }));
      } else {
        const error = await response.json();
        showToast(error.error || 'Error al actualizar configuración', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleChangeFolio = (
    tipo: 'entrada' | 'salida',
    field: 'serie_actual' | 'proximo_folio',
    value: string | number
  ) => {
    setFoliosTemp((prev) => ({
      ...prev,
      [tipo]: prev[tipo]
        ? {
            ...prev[tipo]!,
            [field]: value,
          }
        : null,
    }));
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Entidades</h1>
              <p className="text-gray-600 mt-1">Administra tu catálogo de entidades</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Crear nueva entidad"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva Entidad
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
                <p className="text-sm font-medium text-gray-600">Total Entidades</p>
                <p className="text-2xl font-bold text-gray-900">{(entidades || []).length}</p>
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
                <p className="text-sm font-medium text-gray-600">Entidades Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(entidades || []).filter((e) => e.estatus === 'activo').length}
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
                <p className="text-sm font-medium text-gray-600">Entidades Inactivas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(entidades || []).filter((e) => e.estatus === 'inactivo').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Configuración de Folios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
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
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Configuración de Folios
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona la numeración de entradas y salidas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuración de Entradas */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-blue-900 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Entradas
                </h3>
                {!editingFolios.entrada ? (
                  <button
                    onClick={() => handleEditFolio('entrada')}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelFolio('entrada')}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveFolio('entrada')}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Serie Actual
                  </label>
                  {!editingFolios.entrada ? (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-900">
                      {foliosTemp.entrada?.serie_actual || '(sin serie)'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={foliosTemp.entrada?.serie_actual || ''}
                      onChange={(e) => handleChangeFolio('entrada', 'serie_actual', e.target.value)}
                      maxLength={10}
                      placeholder="Ej: A, 2025, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {foliosTemp.entrada?.serie_actual
                      ? `Ejemplo de folio: ${foliosTemp.entrada.serie_actual}-${foliosTemp.entrada.proximo_folio}`
                      : `Ejemplo de folio: ${foliosTemp.entrada?.proximo_folio || 1}`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Próximo Folio
                  </label>
                  {!editingFolios.entrada ? (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-semibold text-blue-900">
                      {foliosTemp.entrada?.proximo_folio || 1}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={foliosTemp.entrada?.proximo_folio || 1}
                      onChange={(e) =>
                        handleChangeFolio('entrada', 'proximo_folio', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-semibold"
                      aria-label="Próximo folio para entradas"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    La próxima entrada será el folio #{foliosTemp.entrada?.proximo_folio || 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Configuración de Salidas */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-orange-900 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Salidas
                </h3>
                {!editingFolios.salida ? (
                  <button
                    onClick={() => handleEditFolio('salida')}
                    className="text-xs px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelFolio('salida')}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveFolio('salida')}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Serie Actual
                  </label>
                  {!editingFolios.salida ? (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-900">
                      {foliosTemp.salida?.serie_actual || '(sin serie)'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={foliosTemp.salida?.serie_actual || ''}
                      onChange={(e) => handleChangeFolio('salida', 'serie_actual', e.target.value)}
                      maxLength={10}
                      placeholder="Ej: B, 2025, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {foliosTemp.salida?.serie_actual
                      ? `Ejemplo de folio: ${foliosTemp.salida.serie_actual}-${foliosTemp.salida.proximo_folio}`
                      : `Ejemplo de folio: ${foliosTemp.salida?.proximo_folio || 1}`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Próximo Folio
                  </label>
                  {!editingFolios.salida ? (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-semibold text-orange-900">
                      {foliosTemp.salida?.proximo_folio || 1}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={foliosTemp.salida?.proximo_folio || 1}
                      onChange={(e) =>
                        handleChangeFolio('salida', 'proximo_folio', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-black font-semibold"
                      aria-label="Próximo folio para salidas"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    La próxima salida será el folio #{foliosTemp.salida?.proximo_folio || 1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por nombre, email, RFC o contacto
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
                <span>Mostrar todas las entidades</span>
              </label>
            </div>
          </div>
        </div>{' '}
        {/* Lista de entidades */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Entidades Registradas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {entidadesFiltradas.length} entidades
            </p>
          </div>

          {entidadesFiltradas.length === 0 ? (
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
                  ? 'Selecciona una opción para ver entidades'
                  : searchTerm.trim() !== ''
                    ? 'No se encontraron entidades con esa búsqueda'
                    : 'No hay entidades registradas'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!showAll && searchTerm.trim() === ''
                  ? "Marca 'Mostrar todas las entidades' o busca por nombre/email"
                  : searchTerm.trim() !== ''
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comience creando una nueva entidad.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {entidadesParaPagina.map((entidad) => (
                <div key={entidad.id_empresa} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {entidad.logo ? (
                          <Image
                            src={entidad.logo}
                            alt={`Logo de ${entidad.nombre}`}
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{entidad.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            RFC: {entidad.rfc} • {entidad.correo || 'Sin email'}
                          </p>
                          {entidad.contacto && (
                            <p className="text-xs text-gray-500">Contacto: {entidad.contacto}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {formatearFecha(entidad.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">Registrado</p>
                        </div>
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entidad.estatus === 'activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {entidad.estatus === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(entidad)}
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
                        onClick={() => openEditModal(entidad)}
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
                      {entidad.estatus === 'activo' && (
                        <button
                          onClick={() => handleDelete(entidad)}
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
                  {Math.min(currentPage * itemsPerPage, entidadesFiltradas.length)} de{' '}
                  {entidadesFiltradas.length} resultados
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' && 'Nueva Entidad'}
                        {modalMode === 'edit' && 'Editar Entidad'}
                        {modalMode === 'view' && 'Detalles de la Entidad'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {modalMode === 'create' &&
                          'Completa los datos para crear una nueva entidad'}
                        {modalMode === 'edit' && 'Actualiza la información de la entidad'}
                        {modalMode === 'view' && 'Información detallada de la entidad'}
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
                            Nombre de la Entidad *
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
                              placeholder="Ej. Hospital General de México"
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

                        {/* RFC */}
                        <div>
                          <label
                            htmlFor="rfc"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            RFC *
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
                            placeholder="RFC de la entidad"
                            required
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
                                  id="estatus"
                                  name="estatus"
                                  checked={formData.estatus === 'activo'}
                                  onChange={(e) =>
                                    setFormData((prev: FormData) => ({
                                      ...prev,
                                      estatus: e.target.checked ? 'activo' : 'inactivo',
                                    }))
                                  }
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor="estatus"
                                  className="ml-3 text-sm font-medium text-gray-700"
                                >
                                  Entidad Activa
                                </label>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  formData.estatus === 'activo'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {formData.estatus === 'activo' ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>{' '}
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
                            htmlFor="correo"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Email
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              id="correo"
                              name="correo"
                              value={formData.correo}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.correo ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              placeholder="entidad@ejemplo.com"
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
                          {formErrors.correo && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.correo}</p>
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
                        <div className="md:col-span-2">
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
                            placeholder="Nombre del responsable"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Sección: Configuración y Licencia */}
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Configuración y Licencia
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="licencia"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Número de Licencias de Usuario
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="licencia"
                              name="licencia"
                              value={formData.licencia}
                              onChange={handleChange}
                              min="1"
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.licencia ? 'border-red-500' : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              placeholder="5"
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
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.licencia && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.licencia}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo de usuarios simultáneos permitidos
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="tiempo_sesion_minutos"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Tiempo de Sesión (minutos) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="tiempo_sesion_minutos"
                              name="tiempo_sesion_minutos"
                              value={formData.tiempo_sesion_minutos || 30}
                              onChange={handleChange}
                              min="5"
                              max="120"
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-150 ${
                                formErrors.tiempo_sesion_minutos
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                              disabled={modalMode === 'view'}
                              placeholder="30"
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          {formErrors.tiempo_sesion_minutos && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.tiempo_sesion_minutos}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Tiempo de inactividad antes del cierre automático (5-120 min, 2 horas
                            máx)
                          </p>
                        </div>

                        {/* Toggle: Capturar lotes en entradas */}
                        <div>
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex-1">
                              <span className="block text-sm font-semibold text-gray-700 mb-1">
                                Capturar Lotes en Entradas
                              </span>
                              <span className="block text-xs text-gray-500">
                                Habilitar campos de número de lote y fecha de vencimiento al
                                registrar entradas
                              </span>
                            </div>
                            <div className="relative ml-4">
                              <input
                                type="checkbox"
                                id="capturar_lotes_entradas"
                                checked={formData.capturar_lotes_entradas}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    capturar_lotes_entradas: e.target.checked,
                                  }))
                                }
                                className="sr-only peer"
                                disabled={modalMode === 'view'}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>{' '}
                    {/* Sección: Logo de la Entidad */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-indigo-600"
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
                        Logo de la Entidad
                      </h4>

                      <div className="flex items-start space-x-4">
                        {/* Preview del logo */}
                        <div className="flex-shrink-0">
                          {formData.logo || selectedEntidad?.logo ? (
                            <div className="relative group">
                              <Image
                                src={formData.logo || selectedEntidad?.logo || ''}
                                alt="Logo de la entidad"
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                              />
                              {modalMode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev: FormData) => ({
                                      ...prev,
                                      logo: '',
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
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
                              id="logo"
                              name="logo"
                              accept="image/*"
                              title="Seleccionar archivo de imagen para el logo"
                              aria-label="Seleccionar archivo de imagen para el logo"
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
                                    const response = await api.form('/api/upload', formDataUpload);

                                    if (!response.ok) throw new Error('Error al subir la imagen');

                                    const data = await response.json();
                                    if (data.success && data.path) {
                                      setFormData((prev: FormData) => ({
                                        ...prev,
                                        logo: data.path,
                                      }));
                                      toast.success('Logo subido correctamente');
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
                      form="entidad-form"
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
                          {modalMode === 'create' ? 'Crear Entidad' : 'Actualizar Entidad'}
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

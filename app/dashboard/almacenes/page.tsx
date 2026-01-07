'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import apiFetch from '@/lib/fetcher';
import ProtectedPage from '@/app/components/ProtectedPage';
import {
  PlusIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface Almacen {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  responsable?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  es_principal: boolean;
  createdAt: string;
  updatedAt: string;
  ubicaciones_almacen?: Ubicacion[];
  _count?: {
    ubicaciones_almacen: number;
    inventario_almacen: number;
  };
}

interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  activo: boolean;
  _count?: {
    inventario_almacen: number;
  };
}

interface FormData {
  nombre: string;
  descripcion: string;
  direccion: string;
  responsable: string;
  telefono: string;
  email: string;
  es_principal: boolean;
}

function AlmacenesPage() {
  const { data: _session } = useSession();
  // Para evitar warning de variable no usada
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);

  // Estados para ubicaciones
  const [showUbicacionesModal, setShowUbicacionesModal] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [showNuevaUbicacionModal, setShowNuevaUbicacionModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    direccion: '',
    responsable: '',
    telefono: '',
    email: '',
    es_principal: false,
  });

  const [nuevaUbicacion, setNuevaUbicacion] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'ESTANTE',
  });

  // Cargar almacenes
  const fetchAlmacenes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/almacenes');

      // Leer la respuesta una sola vez
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar almacenes');
      }

      setAlmacenes(data.almacenes || []);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar almacenes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar ubicaciones de un almacén
  const fetchUbicaciones = async (almacenId: string) => {
    try {
      const response = await apiFetch(`/api/ubicaciones?almacenId=${almacenId}`);

      // Leer la respuesta una sola vez
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar ubicaciones');
      }

      setUbicaciones(data.ubicaciones || []);
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar ubicaciones');
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchAlmacenes();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchAlmacenes]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre del almacén es requerido');
      return;
    }

    try {
      const url =
        modalMode === 'create' ? '/api/almacenes' : `/api/almacenes/${selectedAlmacen?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setShowModal(false);
        resetForm();
        fetchAlmacenes();
      } else {
        toast.error(data.error || 'Error al guardar almacén');
      }
    } catch (error) {
      toast.error('Error al guardar almacén');
    }
  };

  // Crear nueva ubicación
  const handleCreateUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevaUbicacion.nombre.trim()) {
      toast.error('El nombre de la ubicación es requerido');
      return;
    }

    try {
      const response = await apiFetch('/api/ubicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nuevaUbicacion,
          almacen_id: selectedAlmacen?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setShowNuevaUbicacionModal(false);
        setNuevaUbicacion({ nombre: '', descripcion: '', tipo: 'ESTANTE' });
        if (selectedAlmacen) {
          fetchUbicaciones(selectedAlmacen.id);
        }
      } else {
        toast.error(data.error || 'Error al crear ubicación');
      }
    } catch (error) {
      toast.error('Error al crear ubicación');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      direccion: '',
      responsable: '',
      telefono: '',
      email: '',
      es_principal: false,
    });
    setSelectedAlmacen(null);
  };

  const handleEdit = (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setFormData({
      nombre: almacen.nombre,
      descripcion: almacen.descripcion || '',
      direccion: almacen.direccion || '',
      responsable: almacen.responsable || '',
      telefono: almacen.telefono || '',
      email: almacen.email || '',
      es_principal: almacen.es_principal,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setModalMode('view');
    setShowModal(true);
  };

  const handleViewUbicaciones = (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    fetchUbicaciones(almacen.id);
    setShowUbicacionesModal(true);
  };

  const tiposUbicacion = [
    { value: 'ESTANTE', label: 'Estante' },
    { value: 'PISO', label: 'Piso' },
    { value: 'REFRIGERADO', label: 'Refrigerado' },
    { value: 'CONGELADOR', label: 'Congelador' },
    { value: 'VITRINA', label: 'Vitrina' },
    { value: 'BODEGA', label: 'Bodega' },
    { value: 'CUARTO_FRIO', label: 'Cuarto Frío' },
    { value: 'OTRO', label: 'Otro' },
  ];

  if (loading) {
    return (
      <ProtectedPage requiredPermission={{ modulo: 'CATALOGOS_ALMACENES', accion: 'LEER' }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredPermission={{ modulo: 'CATALOGOS_ALMACENES', accion: 'LEER' }}>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Gestión de Almacenes</h1>
            <p className="text-gray-600">Administra almacenes y sus ubicaciones</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalMode('create');
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Almacén
          </button>
        </div>

        {/* Lista de almacenes */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {almacenes.map((almacen) => (
            <div key={almacen.id} className="bg-white rounded-lg shadow border">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-black text-lg">{almacen.nombre}</h3>
                      {almacen.es_principal && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(almacen)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Ver detalles"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(almacen)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {almacen.descripcion && (
                  <p className="text-gray-600 mt-2 text-sm">{almacen.descripcion}</p>
                )}

                <div className="mt-4 space-y-2">
                  {almacen.responsable && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>{almacen.responsable}</span>
                    </div>
                  )}
                  {almacen.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{almacen.telefono}</span>
                    </div>
                  )}
                  {almacen.direccion && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{almacen.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {almacen._count?.ubicaciones_almacen || 0} ubicaciones •{' '}
                    {almacen._count?.inventario_almacen || 0} productos
                  </div>
                  <button
                    onClick={() => handleViewUbicaciones(almacen)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ver ubicaciones
                  </button>
                </div>

                <div
                  className={`mt-3 px-2 py-1 rounded-full text-xs text-center ${
                    almacen.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {almacen.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {almacenes.length === 0 && (
          <div className="text-center py-8">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-black">No hay almacenes</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer almacén.</p>
          </div>
        )}

        {/* Modal para crear/editar almacén */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-black">
                  {modalMode === 'create'
                    ? 'Crear Almacén'
                    : modalMode === 'edit'
                      ? 'Editar Almacén'
                      : 'Detalles del Almacén'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Nombre del Almacén *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Ej: Almacén Principal"
                    required
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    rows={3}
                    placeholder="Descripción del almacén..."
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Dirección física del almacén"
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Nombre del responsable"
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Teléfono"
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Email"
                      disabled={modalMode === 'view'}
                    />
                  </div>
                </div>

                {modalMode !== 'view' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="es_principal"
                      checked={formData.es_principal}
                      onChange={(e) => setFormData({ ...formData, es_principal: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="es_principal" className="ml-2 text-sm text-black">
                      Marcar como almacén principal
                    </label>
                  </div>
                )}

                {modalMode !== 'view' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="h-5 w-5" />
                      {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Modal para ubicaciones */}
        {showUbicacionesModal && selectedAlmacen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-black">
                  Ubicaciones de {selectedAlmacen.nombre}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNuevaUbicacionModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nueva Ubicación
                  </button>
                  <button
                    onClick={() => setShowUbicacionesModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ubicaciones.map((ubicacion) => (
                    <div key={ubicacion.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-black">{ubicacion.nombre}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            ubicacion.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ubicacion.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ubicacion.tipo}</p>
                      {ubicacion.descripcion && (
                        <p className="text-sm text-gray-500">{ubicacion.descripcion}</p>
                      )}
                      <div className="mt-3 text-xs text-gray-500">
                        {ubicacion._count?.inventario_almacen || 0} productos
                      </div>
                    </div>
                  ))}
                </div>

                {ubicaciones.length === 0 && (
                  <div className="text-center py-8">
                    <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-black">No hay ubicaciones</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comienza creando ubicaciones para organizar mejor el inventario.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para nueva ubicación */}
        {showNuevaUbicacionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-black">Nueva Ubicación</h2>
                <button
                  onClick={() => setShowNuevaUbicacionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUbicacion} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Nombre de la Ubicación *
                  </label>
                  <input
                    type="text"
                    value={nuevaUbicacion.nombre}
                    onChange={(e) =>
                      setNuevaUbicacion({ ...nuevaUbicacion, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Ej: A1, B2, Estante-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Tipo de Ubicación
                  </label>
                  <select
                    value={nuevaUbicacion.tipo}
                    onChange={(e) => setNuevaUbicacion({ ...nuevaUbicacion, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    title="Seleccionar tipo de ubicación"
                  >
                    {tiposUbicacion.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Descripción</label>
                  <textarea
                    value={nuevaUbicacion.descripcion}
                    onChange={(e) =>
                      setNuevaUbicacion({ ...nuevaUbicacion, descripcion: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    rows={3}
                    placeholder="Descripción de la ubicación..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Crear Ubicación
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNuevaUbicacionModal(false)}
                    className="flex-1 bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

export default AlmacenesPage;

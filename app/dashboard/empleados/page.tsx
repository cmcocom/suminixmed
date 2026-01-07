/**
 * Página de Gestión de Empleados
 * Gestión completa de empleados con vinculación opcional de usuarios
 */

'use client';

import { useState, useEffect } from 'react';
import ProtectedPage from '@/app/components/ProtectedPage';
import { toast } from 'react-hot-toast';
import apiFetch from '@/lib/fetcher';
import { useDebounce } from '@/hooks/useDebounce';
import {
  UserGroupIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  clave: string;
  email: string | null;
  name: string | null;
  activo: boolean;
  createdAt: string;
}

interface Empleado {
  id: string;
  user_id: string | null;
  numero_empleado: string;
  nombre: string;
  cargo: string;
  servicio: string | null;
  turno: string;
  correo: string | null;
  celular: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  User: User | null;
}

interface EmpleadoFormData {
  numero_empleado: string;
  nombre: string;
  cargo: string;
  servicio: string;
  turno: string;
  correo: string;
  celular: string;
  activo: boolean;
  createUser: boolean;
}

function EmpleadosManagementPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]); // Empleados filtrados para la tabla
  const [todosLosEmpleados, setTodosLosEmpleados] = useState<Empleado[]>([]); // Todos los empleados para estadísticas
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); // Debounce de 500ms
  const [showAll, setShowAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EmpleadoFormData>({
    numero_empleado: '',
    nombre: '',
    cargo: '',
    servicio: '',
    turno: 'Matutino',
    correo: '',
    celular: '',
    activo: true,
    createUser: false,
  });

  // Cargar todos los empleados (para estadísticas)
  const cargarTodosLosEmpleados = async () => {
    try {
      const res = await apiFetch('/api/empleados?includeInactive=true');
      const data = await res.json();

      if (res.ok) {
        setTodosLosEmpleados(data.empleados || []);
      }
    } catch (error) {}
  };

  // Cargar empleados (filtrados para la tabla)
  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Si showAll está activo, incluir inactivos y no filtrar por búsqueda
      if (showAll) {
        params.append('includeInactive', 'true');
      } else if (debouncedSearch) {
        // Solo buscar si hay texto de búsqueda y showAll no está activo
        params.append('search', debouncedSearch);
      }

      const res = await apiFetch(`/api/empleados?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        // Si no hay búsqueda y showAll no está activo, no mostrar resultados
        if (!showAll && !debouncedSearch) {
          setEmpleados([]);
        } else {
          setEmpleados(data.empleados || []);
        }
      } else {
        toast.error(data.error || 'Error al cargar empleados');
      }
    } catch (error) {
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, showAll]); // Usar debouncedSearch en lugar de search

  // Cargar todos los empleados una vez al montar el componente (para estadísticas)
  useEffect(() => {
    cargarTodosLosEmpleados();
  }, []);

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingEmpleado(null);
    setFormData({
      numero_empleado: '',
      nombre: '',
      cargo: '',
      servicio: '',
      turno: 'Matutino',
      correo: '',
      celular: '',
      activo: true,
      createUser: false,
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      numero_empleado: empleado.numero_empleado,
      nombre: empleado.nombre,
      cargo: empleado.cargo,
      servicio: empleado.servicio || '',
      turno: empleado.turno,
      correo: empleado.correo || '',
      celular: empleado.celular || '',
      activo: empleado.activo,
      createUser: false,
    });
    setShowModal(true);
  };

  // Guardar empleado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingEmpleado ? `/api/empleados/${editingEmpleado.id}` : '/api/empleados';

      const method = editingEmpleado ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Empleado guardado exitosamente');
        setShowModal(false);
        cargarEmpleados();
        cargarTodosLosEmpleados(); // Actualizar estadísticas
      } else {
        toast.error(data.error || 'Error al guardar empleado');
      }
    } catch (error) {
      toast.error('Error al guardar empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar empleado
  const handleDelete = async (empleado: Empleado) => {
    if (!confirm(`¿Estás seguro de desactivar al empleado ${empleado.nombre}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/empleados/${empleado.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Empleado desactivado');
        cargarEmpleados();
        cargarTodosLosEmpleados(); // Actualizar estadísticas
      } else {
        toast.error(data.error || 'Error al desactivar empleado');
      }
    } catch (error) {
      toast.error('Error al desactivar empleado');
    }
  };

  // Crear usuario para empleado
  const handleCreateUser = async (empleado: Empleado) => {
    if (
      !confirm(
        `¿Crear usuario de acceso para ${empleado.nombre}?\n\nClave: ${empleado.numero_empleado}\nContraseña: Issste2025!`
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(`/api/empleados/${empleado.id}/crear-usuario`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Usuario creado exitosamente');
        cargarEmpleados();
        cargarTodosLosEmpleados(); // Actualizar estadísticas
      } else {
        toast.error(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      toast.error('Error al crear usuario');
    }
  };

  // Estadísticas - Basadas en TODOS los empleados, no en los filtrados
  const stats = {
    total: todosLosEmpleados.length,
    conUsuario: todosLosEmpleados.filter((e) => e.user_id).length,
    sinUsuario: todosLosEmpleados.filter((e) => !e.user_id).length,
    activos: todosLosEmpleados.filter((e) => e.activo).length,
  };

  return (
    <ProtectedPage requiredPermission={{ modulo: 'CATALOGOS_EMPLEADOS', accion: 'LEER' }}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Empleado
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Con Usuario</p>
                <p className="text-2xl font-bold text-green-600">{stats.conUsuario}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sin Usuario</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sinUsuario}</p>
              </div>
              <XCircleIcon className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activos}</p>
              </div>
              <UserIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Mostrar todos</span>
            </label>
          </div>
        </div>

        {/* Tabla de empleados */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  No. Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : empleados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {!showAll && !search
                      ? 'Escribe en el buscador o activa "Mostrar todos" para ver empleados'
                      : 'No se encontraron empleados'}
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => (
                  <tr key={empleado.id} className={!empleado.activo ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {empleado.numero_empleado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {empleado.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {empleado.servicio || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {empleado.User ? (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span className="text-green-700 font-medium">{empleado.User.clave}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin usuario</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          empleado.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {empleado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!empleado.user_id && empleado.activo && (
                          <button
                            onClick={() => handleCreateUser(empleado)}
                            className="text-green-600 hover:text-green-900"
                            title="Crear usuario"
                          >
                            <UserPlusIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(empleado)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        {empleado.activo && (
                          <button
                            onClick={() => handleDelete(empleado)}
                            className="text-red-600 hover:text-red-900"
                            title="Desactivar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de formulario */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="numero_empleado"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      No. Empleado *
                    </label>
                    <input
                      id="numero_empleado"
                      type="text"
                      required
                      disabled={!!editingEmpleado}
                      value={formData.numero_empleado}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_empleado: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="turno" className="block text-sm font-medium text-gray-700 mb-1">
                      Turno *
                    </label>
                    <select
                      id="turno"
                      required
                      value={formData.turno}
                      onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                      <option value="Nocturno">Nocturno</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo *
                    </label>
                    <input
                      id="cargo"
                      type="text"
                      required
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="servicio"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Servicio
                    </label>
                    <input
                      id="servicio"
                      type="text"
                      value={formData.servicio}
                      onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="correo"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Correo Electrónico
                    </label>
                    <input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="celular"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Teléfono/Celular
                    </label>
                    <input
                      id="celular"
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {!editingEmpleado && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="createUser"
                      checked={formData.createUser}
                      onChange={(e) => setFormData({ ...formData, createUser: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="createUser" className="text-sm text-gray-700">
                      Crear usuario de acceso al crear el empleado (Contraseña: Issste2025!)
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activo" className="text-sm text-gray-700">
                    Empleado activo
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
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

export default EmpleadosManagementPage;

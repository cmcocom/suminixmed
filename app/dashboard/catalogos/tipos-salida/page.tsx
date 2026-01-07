'use client';

import { useState, useEffect } from 'react';
import apiFetch from '@/lib/fetcher';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TipoSalida {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  requiere_cliente?: boolean;
  requiere_referencia?: boolean;
}

export default function TiposSalidaPage() {
  const [tipos, setTipos] = useState<TipoSalida[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoSalida | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true,
    orden: 0,
    requiere_cliente: false,
    requiere_referencia: false,
  });

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/tipos-salida');
      const data = await response.json();

      if (data.success) {
        setTipos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTipo ? `/api/tipos-salida/${editingTipo.id}` : '/api/tipos-salida';

      const method = editingTipo ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTipos();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tipo de salida?')) return;

    try {
      const response = await apiFetch(`/api/tipos-salida/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTipos();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleEdit = (tipo: TipoSalida) => {
    setEditingTipo(tipo);
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      activo: tipo.activo,
      orden: tipo.orden,
      requiere_cliente: tipo.requiere_cliente || false,
      requiere_referencia: tipo.requiere_referencia || false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTipo(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true,
      orden: 0,
      requiere_cliente: false,
      requiere_referencia: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tipos de Salida</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los tipos de movimientos de salida de inventario
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Tipo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Orden</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                Req. Cliente
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                Req. Referencia
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900">{tipo.orden}</td>
                <td className="px-4 py-4 text-sm text-gray-900 font-mono">{tipo.codigo}</td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{tipo.nombre}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{tipo.descripcion || '-'}</td>
                <td className="px-4 py-4 text-sm text-center">
                  {tipo.requiere_cliente ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ✓ Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      – No
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  {tipo.requiere_referencia ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ✓ Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      – No
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tipo.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tipo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tipo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tipo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">
                {editingTipo ? 'Editar Tipo de Salida' : 'Nuevo Tipo de Salida'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    id="codigo"
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: SERVICIOS_MEDICOS"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Servicios Médicos"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="descripcion"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción opcional del tipo de salida"
                  />
                </div>

                <div>
                  <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    title="Orden de visualización"
                  />
                </div>

                <div>
                  <label htmlFor="activo" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    id="activo"
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Estado del tipo"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiere_cliente}
                      onChange={(e) =>
                        setFormData({ ...formData, requiere_cliente: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Requiere Cliente</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Marcar si este tipo de salida requiere seleccionar un cliente
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiere_referencia}
                      onChange={(e) =>
                        setFormData({ ...formData, requiere_referencia: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Requiere Referencia Externa
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Marcar si este tipo de salida requiere una referencia o folio externo
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTipo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import type { User } from '@/hooks/useUsersManagement';

interface Empleado {
  id: string;
  numero_empleado: string;
  nombre: string;
  cargo?: string | null;
  servicio?: string | null;
}

interface VincularEmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

export default function VincularEmpleadoModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: VincularEmpleadoModalProps) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar empleados sin usuario vinculado
  useEffect(() => {
    if (isOpen) {
      cargarEmpleados();
    }
  }, [isOpen]);

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/empleados');
      if (!response.ok) throw new Error('Error al cargar empleados');

      const data = await response.json();

      // Filtrar solo empleados sin usuario vinculado
      const empleadosSinUsuario = data.empleados.filter(
        (emp: Empleado & { usuario?: { id: string } | null }) => !emp.usuario
      );

      setEmpleados(empleadosSinUsuario);
    } catch (error) {
      toast.error('Error al cargar la lista de empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmpleadoId) {
      toast.error('Selecciona un empleado');
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/api/usuarios/${user.id}/vincular-empleado`, {
        empleadoId: selectedEmpleadoId,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al vincular empleado');
      }

      toast.success('Empleado vinculado exitosamente');
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al vincular empleado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmpleadoId('');
    setSearchTerm('');
    onClose();
  };

  // Salir temprano si el modal no está abierto o no hay usuario
  if (!isOpen || !user) return null;

  // Filtrar empleados por búsqueda (solo se ejecuta si el modal está abierto)
  const empleadosFiltrados = empleados.filter((emp) => {
    if (!emp) return false;

    const searchLower = searchTerm.toLowerCase();
    const nombre = emp.nombre?.toLowerCase() || '';
    const numeroEmpleado = emp.numero_empleado?.toLowerCase() || '';
    const cargo = emp.cargo?.toLowerCase() || '';

    return (
      nombre.includes(searchLower) ||
      numeroEmpleado.includes(searchLower) ||
      cargo.includes(searchLower)
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Vincular Empleado</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={submitting}
              title="Cerrar modal"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Usuario: {user.name} ({user.email})
          </p>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Búsqueda */}
            <div className="mb-4">
              <label
                htmlFor="buscar-empleado-modal"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Buscar empleado
              </label>
              <input
                id="buscar-empleado-modal"
                name="buscar_empleado"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, número o cargo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Lista de empleados */}
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : empleadosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? 'No se encontraron empleados'
                  : 'No hay empleados disponibles para vincular'}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {empleadosFiltrados.map((empleado) => (
                  <label
                    key={empleado.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmpleadoId === empleado.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="empleado"
                      value={empleado.id}
                      checked={selectedEmpleadoId === empleado.id}
                      onChange={(e) => setSelectedEmpleadoId(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{empleado.nombre}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-mono">No. Empleado: {empleado.numero_empleado}</span>
                        {empleado.cargo && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{empleado.cargo}</span>
                          </>
                        )}
                      </div>
                      {empleado.servicio && (
                        <div className="text-sm text-gray-500 mt-1">
                          Servicio: {empleado.servicio}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedEmpleadoId || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vinculando...
                </>
              ) : (
                'Vincular Empleado'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

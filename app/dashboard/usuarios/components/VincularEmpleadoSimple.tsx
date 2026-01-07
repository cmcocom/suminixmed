'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { User } from '@/hooks/useUsersManagement';

interface Empleado {
  id: string;
  numero_empleado: string;
  nombre: string;
  cargo?: string | null;
  servicio?: string | null;
}

interface VincularEmpleadoSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
  onCreateEmpleado?: () => void; // Callback para abrir modal de crear empleado
}

export default function VincularEmpleadoSimple({
  isOpen,
  onClose,
  user,
  onSuccess,
  onCreateEmpleado,
}: VincularEmpleadoSimpleProps) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 empleados por página

  // Cargar empleados cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarEmpleados();
      setSearchTerm('');
      setCurrentPage(1); // Reset página al abrir
    }
  }, [isOpen]);

  // Auto-completar búsqueda con el nombre del usuario
  useEffect(() => {
    if (isOpen && user && !searchTerm) {
      const userName = user.name || '';
      setSearchTerm(userName);
    }
  }, [isOpen, user, searchTerm]);

  // Resetear página cuando cambia el filtro - DEBE ESTAR ANTES DEL EARLY RETURN
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      console.error('Error al cargar empleados:', error);
      toast.error('Error al cargar la lista de empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleVincular = async (empleadoId: string, empleadoNombre: string) => {
    if (!user) return;

    // Confirmación del usuario
    const confirmacion = confirm(
      `¿Estás seguro de vincular al usuario "${user.name || user.email}" con el empleado "${empleadoNombre}"?\n\n` +
        `Esta acción:\n` +
        `• Sincronizará los datos del empleado con el usuario\n` +
        `• El empleado no podrá vincularse con otro usuario\n` +
        `• El usuario no podrá vincularse con otro empleado`
    );

    if (!confirmacion) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/api/usuarios/${user.id}/vincular-empleado`, {
        empleado_id: empleadoId,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al vincular empleado');
      }

      toast.success('✅ Empleado vinculado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al vincular:', error);
      toast.error(error instanceof Error ? error.message : 'Error al vincular empleado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearEmpleado = () => {
    onClose();
    if (onCreateEmpleado) {
      onCreateEmpleado();
    } else {
      toast.error('La funcionalidad de crear empleado no está disponible');
    }
  };

  // Early return - Solo renderizar si está abierto
  if (!isOpen || !user) return null;

  // Filtrar empleados por búsqueda
  const empleadosFiltrados = empleados.filter((emp) => {
    if (!emp) return false;

    const searchLower = searchTerm.toLowerCase().trim();

    // Si no hay búsqueda, no mostrar ningún empleado (debe buscar activamente)
    if (!searchLower) return false;

    const nombre = emp.nombre?.toLowerCase() || '';
    const numeroEmpleado = emp.numero_empleado?.toLowerCase() || '';
    const cargo = emp.cargo?.toLowerCase() || '';

    return (
      nombre.includes(searchLower) ||
      numeroEmpleado.includes(searchLower) ||
      cargo.includes(searchLower)
    );
  });

  // Determinar si hay coincidencias cercanas con el nombre del usuario
  const tieneCoincidencias = empleadosFiltrados.length > 0;
  const buscandoPorNombreUsuario =
    searchTerm.toLowerCase().trim() === (user.name?.toLowerCase().trim() || '');

  // Paginación
  const totalPages = Math.ceil(empleadosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const empleadosPaginados = empleadosFiltrados.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Vincular a Empleado</h2>
                <p className="text-green-100 text-sm">
                  Usuario: <span className="font-semibold">{user.name || user.email}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg disabled:opacity-50"
              title="Cerrar"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, número de empleado o cargo..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              name="empleado_search"
              aria-label="Buscar empleados"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de empleados */}
        <div className="overflow-y-auto max-h-[calc(85vh-280px)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-500">Cargando empleados...</p>
            </div>
          ) : !tieneCoincidencias && buscandoPorNombreUsuario ? (
            /* Mensaje cuando no hay coincidencias con el nombre del usuario */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-yellow-100 rounded-full p-4 mb-4">
                <ExclamationTriangleIcon className="w-16 h-16 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontró empleado para "{user.name}"
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                No existe un empleado registrado con el nombre "{user.name}". Puedes crear un nuevo
                empleado o buscar con otro término.
              </p>

              <button
                onClick={handleCrearEmpleado}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Crear Nuevo Empleado
              </button>

              <p className="text-sm text-gray-500 mt-4">O modifica el término de búsqueda arriba</p>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            /* Mensaje cuando la búsqueda no arroja resultados */
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <UserIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron empleados</p>
              <p className="text-sm mt-2 mb-4">Intenta con otro término de búsqueda</p>
              <button
                onClick={handleCrearEmpleado}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Crear Nuevo Empleado
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {empleadosPaginados.map((empleado) => (
                  <button
                    key={empleado.id}
                    onClick={() => handleVincular(empleado.id, empleado.nombre)}
                    disabled={submitting}
                    className="group relative flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Icono de empleado */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all">
                      <UserIcon className="w-6 h-6 text-green-700" />
                    </div>

                    {/* Información del empleado */}
                    <div className="flex-1 ml-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                        {empleado.nombre}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                          #{empleado.numero_empleado}
                        </span>
                        {empleado.cargo && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{empleado.cargo}</span>
                          </>
                        )}
                      </div>
                      {empleado.servicio && (
                        <div className="mt-1 text-xs text-gray-500">📍 {empleado.servicio}</div>
                      )}
                    </div>

                    {/* Icono de flecha */}
                    <div className="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {/* Indicador de clic */}
                    {submitting && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pb-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || submitting}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={submitting}
                        className={`min-w-[2.5rem] px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || submitting}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Página siguiente"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                {empleadosFiltrados.length} empleado{empleadosFiltrados.length !== 1 ? 's' : ''}
                {searchTerm ? ' encontrado' : ' disponible'}
                {empleadosFiltrados.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { api } from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface PrefilledData {
  nombre?: string;
  correo?: string | null;
  celular?: string | null;
}

interface CrearEmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledData?: PrefilledData;
}

interface FormData {
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

export default function CrearEmpleadoModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledData,
}: CrearEmpleadoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    numero_empleado: '',
    nombre: prefilledData?.nombre || '',
    cargo: '',
    servicio: '',
    turno: 'Matutino',
    correo: prefilledData?.correo || '',
    celular: prefilledData?.celular || '',
    activo: true,
    createUser: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/empleados', formData);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear empleado');
      }

      toast.success('✅ Empleado creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al crear empleado:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Crear Nuevo Empleado</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg disabled:opacity-50"
              title="Cerrar"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="numero_empleado"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                No. Empleado <span className="text-red-500">*</span>
              </label>
              <input
                id="numero_empleado"
                type="text"
                required
                value={formData.numero_empleado}
                onChange={(e) => setFormData({ ...formData, numero_empleado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: EMP001"
              />
            </div>

            <div>
              <label htmlFor="turno" className="block text-sm font-medium text-gray-700 mb-1">
                Turno <span className="text-red-500">*</span>
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
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre completo del empleado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo <span className="text-red-500">*</span>
              </label>
              <input
                id="cargo"
                type="text"
                required
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Médico, Enfermera"
              />
            </div>

            <div>
              <label htmlFor="servicio" className="block text-sm font-medium text-gray-700 mb-1">
                Servicio
              </label>
              <input
                id="servicio"
                type="text"
                value={formData.servicio}
                onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Urgencias, Consulta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="celular" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono/Celular
              </label>
              <input
                id="celular"
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10 dígitos"
              />
            </div>
          </div>

          {/* Checkbox para crear usuario */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="createUser"
              checked={formData.createUser}
              onChange={(e) => setFormData({ ...formData, createUser: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="createUser" className="text-sm text-gray-700 flex-1">
              Crear usuario de acceso al crear el empleado
              <span className="block text-xs text-gray-500 mt-0.5">
                Clave: No. Empleado | Contraseña: Issste2025!
              </span>
            </label>
          </div>

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

          {/* Footer con botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  Crear Empleado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

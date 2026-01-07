/**
 * Componente UserStats - Panel de estadísticas de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx (líneas ~540-620)
 *
 * Propósito: Mostrar tarjetas con estadísticas clave de usuarios (total, activos, inactivos)
 * de forma visual y organizada. Separado para mejorar la legibilidad y reutilización.
 *
 * Props:
 * - users: Array de usuarios para calcular estadísticas
 *
 * PRESERVADO: Diseño exacto de tarjetas, iconos y colores
 */

import type { User } from '@/hooks/useUsersManagement';
import { calcularEstadisticas } from '@/lib/user-utils';
import { BriefcaseIcon, UserIcon } from '@heroicons/react/24/outline';

interface UserStatsProps {
  users: User[];
}

export default function UserStats({ users }: UserStatsProps) {
  const stats = calcularEstadisticas(users);

  // Calcular estadísticas de empleados
  const empleados = users.filter((u) => u.empleados);
  const soloUsuarios = users.filter((u) => !u.empleados);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {/* Tarjeta: Total Usuarios */}
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta: Usuarios Activos */}
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
            <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
              <p className="text-sm text-green-600 font-medium">({stats.porcentajeActivos}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta: Usuarios Inactivos */}
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
            <p className="text-sm font-medium text-gray-600">Usuarios Inactivos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.inactivos}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta: Usuarios-Empleados */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BriefcaseIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Empleados</p>
            <p className="text-2xl font-bold text-gray-900">{empleados.length}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta: Solo Usuarios */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <UserIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Solo Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{soloUsuarios.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

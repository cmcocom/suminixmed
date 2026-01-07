/**
 * Componente UserCard - Tarjeta individual de usuario
 * Extraído de: app/dashboard/usuarios/page.tsx (líneas ~870-950)
 *
 * Propósito: Mostrar la información de un usuario individual en formato de tarjeta
 * con foto, datos básicos, rol, estado y botones de acción según permisos.
 *
 * Props:
 * - user: Datos del usuario a mostrar
 * - onEdit: Callback para editar usuario
 * - onDelete: Callback para eliminar usuario
 * - canEdit: Permiso para editar
 * - canDelete: Permiso para eliminar
 *
 * PRESERVADO: Layout exacto, manejo de imágenes y estilos
 */

import Image from 'next/image';
import type { User } from '@/hooks/useUsersManagement';
import { formatearFecha, generarIniciales } from '@/lib/user-utils';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onVincularEmpleado?: (user: User) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function UserCard({
  user,
  onEdit,
  onDelete,
  onVincularEmpleado,
  canEdit,
  canDelete,
}: UserCardProps) {
  // Obtener el primer rol RBAC del usuario
  const userRole = user.rbac_user_roles?.[0]?.rbac_roles;
  const roleName = userRole?.name || 'Sin rol';

  // Verificar si es empleado
  const esEmpleado = !!user.empleados;

  // Capitalizar el nombre del rol para display
  const displayRoleName =
    roleName === 'Sin rol' ? roleName : roleName.charAt(0).toUpperCase() + roleName.slice(1);

  // Definir colores para roles
  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'desarrollador':
        return 'bg-purple-100 text-purple-800';
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'colaborador':
        return 'bg-blue-100 text-blue-800';
      case 'operador':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {/* Avatar del usuario */}
            {user.image ? (
              <Image
                src={user.image}
                alt={`Foto de ${user.name}`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border border-gray-200">
                <span className="text-sm font-semibold text-blue-800">
                  {generarIniciales(user.name)}
                </span>
              </div>
            )}

            {/* Información del usuario */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                {/* Badge si es empleado */}
                {esEmpleado && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <BriefcaseIcon className="w-3 h-3" />
                    Empleado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Clave: {user.clave} {user.email && `• Email: ${user.email}`}
              </p>
              {/* Info del empleado si existe */}
              {esEmpleado && user.empleados && (
                <p className="text-xs text-blue-600 mt-0.5">
                  No. Empleado: {user.empleados.numero_empleado} • {user.empleados.cargo}
                  {user.empleados.servicio && ` • ${user.empleados.servicio}`}
                </p>
              )}
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(roleName)}`}
                >
                  {displayRoleName}
                </span>
              </div>
            </div>

            {/* Fecha de registro */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{formatearFecha(user.createdAt)}</p>
              <p className="text-xs text-gray-500">Registrado</p>
            </div>

            {/* Estado del usuario */}
            <div className="text-center">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {user.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 ml-4">
          {/* Botón Vincular a Empleado - Solo si NO es empleado y tiene callback */}
          {!esEmpleado && onVincularEmpleado && canEdit && (
            <button
              onClick={() => onVincularEmpleado(user)}
              className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all group relative"
              title="Vincular a empleado"
            >
              <BriefcaseIcon className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Vincular empleado
              </span>
            </button>
          )}

          {/* Botón Editar - Solo si tiene permisos */}
          {canEdit && (
            <button
              onClick={() => onEdit(user)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Editar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {/* Botón Eliminar - Solo si tiene permisos */}
          {canDelete && (
            <button
              onClick={() => onDelete(user.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}

          {/* Mensaje si no tiene permisos */}
          {!canEdit && !canDelete && (
            <span className="text-xs text-gray-400 italic">Sin permisos</span>
          )}
        </div>
      </div>
    </div>
  );
}

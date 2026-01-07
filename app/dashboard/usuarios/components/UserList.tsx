/**
 * Componente UserList - Lista paginada de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx (líneas ~800-990)
 *
 * Propósito: Mostrar la lista de usuarios filtrados con paginación,
 * estados vacíos y controles de navegación. Incluye la lógica de
 * mostrar diferentes mensajes según el contexto (sin filtros, sin resultados, etc.)
 *
 * Props:
 * - users: Array de usuarios filtrados
 * - currentPage: Página actual
 * - itemsPerPage: Elementos por página
 * - onPageChange: Callback para cambio de página
 * - onEdit: Callback para editar usuario
 * - onDelete: Callback para eliminar usuario
 * - canEdit: Permiso para editar
 * - canDelete: Permiso para eliminar
 * - isFiltered: Si está aplicado algún filtro (para mensajes contextuales)
 *
 * PRESERVADO: Lógica exacta de paginación y mensajes de estado
 */

import UserCard from './UserCard';
import type { User } from '@/hooks/useUsersManagement';
import { paginarUsuarios } from '@/lib/user-utils';

interface UserListProps {
  users: User[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onVincularEmpleado?: (user: User) => void;
  canEdit: boolean;
  canDelete: boolean;
  search: string;
  showAll: boolean;
}

export default function UserList({
  users,
  currentPage,
  itemsPerPage,
  onPageChange,
  onEdit,
  onDelete,
  onVincularEmpleado,
  canEdit,
  canDelete,
  search,
  showAll,
}: UserListProps) {
  const paginationData = paginarUsuarios(users, currentPage, itemsPerPage);
  const {
    usuarios: usuariosParaPagina,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = paginationData;

  const nextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Usuarios Registrados</h2>
        <p className="text-sm text-gray-600 mt-1">Total: {totalItems} usuarios</p>
      </div>

      {/* Lista de usuarios o mensaje de estado vacío */}
      {usuariosParaPagina.length === 0 ? (
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {!showAll && search.trim() === ''
              ? 'Selecciona una opción para ver usuarios'
              : search.trim() !== ''
                ? 'No se encontraron usuarios con esa búsqueda'
                : 'No hay usuarios registrados'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!showAll && search.trim() === ''
              ? "Marca 'Mostrar todos los usuarios' o busca por nombre/email"
              : search.trim() !== ''
                ? 'Intenta con otros términos de búsqueda'
                : 'Comience creando un nuevo usuario.'}
          </p>
        </div>
      ) : (
        <>
          {/* Lista de usuarios */}
          <div className="divide-y divide-gray-200">
            {usuariosParaPagina.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                onVincularEmpleado={onVincularEmpleado}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Mostrando {startIndex} a {endIndex} de {totalItems} resultados
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
        </>
      )}
    </div>
  );
}

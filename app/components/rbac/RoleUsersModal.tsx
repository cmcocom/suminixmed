'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import apiFetch from '@/lib/fetcher';

interface User {
  id: string;
  name: string | null;
  email: string;
  static_role: string | null;
  activo: boolean | null;
  created_at: Date;
  assigned_at: Date;
  assigned_by: string | null;
}

interface RoleInfo {
  id: string;
  name: string;
  description: string | null;
}

interface RoleUsersModalProps {
  roleId: string;
  roleName: string;
  isOpen: boolean;
  onClose: () => void;
}

const USERS_PER_PAGE = 10;

export default function RoleUsersModal({ roleId, roleName, isOpen, onClose }: RoleUsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar usuarios asignados al rol
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/rbac/roles/${roleId}/users`);

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data.users || []);
        setRoleInfo(result.data.role || null);
      } else {
        console.error('Error al cargar usuarios del rol');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    if (isOpen && roleId) {
      void loadUsers();
    }
  }, [isOpen, roleId, loadUsers]);

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      false ||
      user.email.toLowerCase().includes(search)
    );
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Usuarios con el rol: {roleName}</h3>
            {roleInfo?.description && (
              <p className="text-sm text-gray-600 mt-1">{roleInfo.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Búsqueda y contador */}
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
                    {filteredUsers.length === 1 ? ' usuario asignado' : ' usuarios asignados'}
                  </div>
                  {users.length > 0 && (
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  )}
                </div>
              </div>

              {/* Lista de usuarios */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'No se encontraron usuarios con ese criterio de búsqueda'
                      : 'No hay usuarios asignados a este rol'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">
                              {user.name || 'Sin nombre'}
                            </h4>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                user.activo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>
                              Asignado:{' '}
                              {new Date(user.assigned_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {user.assigned_by && <span>Por: {user.assigned_by}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} de{' '}
                    {filteredUsers.length}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página anterior"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    {/* Números de página */}
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Mostrar solo algunas páginas alrededor de la actual
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página siguiente"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

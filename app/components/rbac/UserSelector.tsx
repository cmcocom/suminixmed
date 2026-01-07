'use client';

import apiFetch from '@/lib/fetcher';
import { ChevronDownIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  staticRole: string;
  image: string | null;
  active: boolean;
  summary: {
    totalDynamicRoles: number;
    dynamicRoles: Array<{ id: string; name: string }>;
    displayRole: string;
  };
}

interface UserSelectorProps {
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  loading?: boolean;
}

export default function UserSelector({
  selectedUser,
  onUserSelect,
  loading = false,
}: UserSelectorProps) {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [authError, setAuthError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar usuarios al abrir el dropdown
  const loadUsers = async (search = '') => {
    try {
      setLoadingUsers(true);
      setAuthError(false);
      const response = await apiFetch(
        `/api/rbac/users/list?search=${encodeURIComponent(search)}&limit=50`
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      } else if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        setUsers([]);
      } else {
        await response.json().catch(() => ({}));
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Efecto para cargar usuarios inicialmente
  useEffect(() => {
    if (isOpen && users.length === 0 && status === 'authenticated') {
      loadUsers();
    }
  }, [isOpen, users.length, status]);

  // Efecto para búsqueda
  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      const debounce = setTimeout(() => {
        loadUsers(searchTerm);
      }, 300);

      return () => clearTimeout(debounce);
    }
    return;
  }, [searchTerm, isOpen, status]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      DESARROLLADOR: 'bg-purple-100 text-purple-800',
      ADMINISTRADOR: 'bg-red-100 text-red-800',
      COLABORADOR: 'bg-blue-100 text-blue-800',
      OPERADOR: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative p-4" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          w-full p-4 bg-white border-2 rounded-lg text-left transition-all duration-200
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedUser ? (
              <>
                {selectedUser.image ? (
                  <Image
                    src={selectedUser.image}
                    alt={selectedUser.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getRoleColor(selectedUser.staticRole)}`}
                  >
                    {selectedUser.summary.displayRole}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-500">Seleccionar usuario...</p>
                  <p className="text-sm text-gray-400">Haz clic para elegir</p>
                </div>
              </div>
            )}
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Búsqueda */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="max-h-64 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Cargando usuarios...</p>
              </div>
            ) : authError || status === 'unauthenticated' ? (
              <div className="p-4 text-center text-orange-500">
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-sm">Inicia sesión para ver usuarios</p>
                <p className="text-xs text-gray-400 mt-1">Se requiere autenticación</p>
              </div>
            ) : status === 'loading' ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Verificando sesión...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No se encontraron usuarios</p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`
                    w-full p-3 text-left hover:bg-gray-50 transition-colors duration-150
                    ${selectedUser?.id === user.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                    border-b border-gray-100 last:border-b-0
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${getRoleColor(user.staticRole)}`}
                        >
                          {user.staticRole}
                        </span>
                        {user.summary.totalDynamicRoles > 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            +{user.summary.totalDynamicRoles} roles
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

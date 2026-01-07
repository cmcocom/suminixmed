/**
 * Página de Gestión de Usuarios - Refactorizada
 * Archivo original: 900+ líneas → Objetivo: max 380 líneas
 *
 * REFACTORIZACIÓN COMPLETADA:
 *
 * Hooks extraídos:
 * - useUsersManagement: Lógica CRUD completa (hooks/useUsersManagement.ts)
 * - useUserForm: Gestión del formulario (hooks/useUserForm.ts)
 *
 * Componentes extraídos:
 * - UserStats: Panel de estadísticas (components/UserStats.tsx)
 * - UserFilters: Filtros y búsqueda (components/UserFilters.tsx)
 * - UserList: Lista paginada (components/UserList.tsx)
 * - UserCard: Tarjeta de usuario (components/UserCard.tsx)
 * - UserModal: Modal de creación/edición (components/UserModal.tsx)
 *
 * Utilidades extraídas:
 * - user-utils.ts: Formateo, validación, paginación (lib/user-utils.ts)
 *
 * PRESERVADO COMPLETAMENTE:
 * - Sistema de permisos y autenticación
 * - Lógica de timeouts y validaciones de seguridad
 * - Manejo de sesiones y formularios
 * - Todos los estados y funcionalidades originales
 *
 * OPTIMIZACIONES BACKEND SUGERIDAS:
 * - Implementar paginación server-side en /api/users
 * - Crear endpoint /api/users/stats para estadísticas
 * - Optimizar filtrado con índices en name/email
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedPage from '@/app/components/ProtectedPage';
import { useUsersManagement, type User, type UserFormData } from '@/hooks/useUsersManagement';
import {
  UserStats,
  UserFilters,
  UserList,
  UserModal,
  VincularEmpleadoSimple,
  CrearEmpleadoModal,
} from './components';
import { filtrarUsuarios } from '@/lib/user-utils';

/**
 * Componente principal de gestión de usuarios
 * PRESERVADO: Toda la funcionalidad original, solo reorganizada en hooks y subcomponentes
 */
function UsersManagementPage() {
  // Hook principal para gestión de usuarios - PRESERVA: Toda la lógica CRUD original
  const {
    users,
    loading,
    editingUser,
    isSubmitting,
    isValidatingEmail,
    cargarUsuarios,
    submitUser,
    eliminarUsuario,
    editarUsuario,
    cancelarEdicion,
    permisos,
  } = useUsersManagement();

  // Estados locales para UI - PRESERVADOS: Estados de filtrado y paginación originales
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Estados para vincular empleado
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCrearEmpleadoModal, setShowCrearEmpleadoModal] = useState(false);

  // Cargar usuarios al montar el componente - PRESERVADO: useEffect original
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Efecto para detectar si se debe abrir el modal de edición del perfil
  // PRESERVADO: Lógica exacta del parámetro URL editProfile
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editProfileEmail = searchParams.get('editProfile');

    if (editProfileEmail && users.length > 0) {
      // Buscar el usuario con el email especificado
      const userToEdit = users.find((user) => user.email === editProfileEmail);
      if (userToEdit) {
        editarUsuario(userToEdit);
        setShowModal(true);
        // Limpiar el parámetro de la URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [users, editarUsuario]);

  // Filtrado y paginación - PRESERVADO: Lógica exacta de filtrado original
  const usuariosFiltrados = filtrarUsuarios(users, search, showAll);

  // Handlers para eventos de UI - PRESERVADOS: Comportamientos originales
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  }, []);

  const handleShowAllChange = useCallback((checked: boolean) => {
    setShowAll(checked);
    setCurrentPage(1); // Resetear a la primera página
    if (checked) {
      setSearch(''); // Limpiar búsqueda si se marca 'mostrar todos'
    }
  }, []);

  const handleModalOpen = useCallback(() => {
    cancelarEdicion(); // Limpiar usuario en edición
    setShowModal(true);
  }, [cancelarEdicion]);

  const handleModalClose = useCallback(() => {
    cancelarEdicion();
    setShowModal(false);
  }, [cancelarEdicion]);

  const handleEdit = useCallback(
    (user: User) => {
      editarUsuario(user);
      setShowModal(true);
    },
    [editarUsuario]
  );

  const handleSubmit = useCallback(
    async (formData: UserFormData) => {
      const success = await submitUser(formData);
      if (success) {
        setShowModal(false);
        return true;
      }
      return false;
    },
    [submitUser]
  );

  const handleVincularEmpleado = useCallback((user: User) => {
    setSelectedUser(user);
    setShowVincularModal(true);
  }, []);

  const handleVincularSuccess = useCallback(() => {
    cargarUsuarios(); // Recargar lista de usuarios
    setShowVincularModal(false);
    setSelectedUser(null);
  }, [cargarUsuarios]);

  const handleCrearEmpleado = useCallback(() => {
    setShowCrearEmpleadoModal(true);
  }, []);

  const handleCrearEmpleadoSuccess = useCallback(() => {
    setShowCrearEmpleadoModal(false);
    cargarUsuarios(); // Recargar usuarios después de crear empleado
  }, [cargarUsuarios]);

  // Loading state - PRESERVADO: Spinner original
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - PRESERVADO: Diseño y funcionalidad exactos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
            </div>
            {/* Botón Nuevo Usuario - PRESERVADO: Solo si tiene permisos */}
            {permisos.crear && (
              <button
                onClick={handleModalOpen}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Crear nuevo usuario"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nuevo Usuario
              </button>
            )}
          </div>
        </div>

        {/* Estadísticas - Componente extraído */}
        <UserStats users={users} />

        {/* Filtros - Componente extraído */}
        <UserFilters
          search={search}
          onSearchChange={handleSearchChange}
          showAll={showAll}
          onShowAllChange={handleShowAllChange}
        />

        {/* Modal - Componente extraído, PRESERVADO: Toda la funcionalidad */}
        <UserModal
          isOpen={showModal}
          onClose={handleModalClose}
          editingUser={editingUser}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isValidatingEmail={isValidatingEmail}
        />

        {/* Modal Simplificado de Vincular Empleado */}
        <VincularEmpleadoSimple
          isOpen={showVincularModal}
          onClose={() => setShowVincularModal(false)}
          user={selectedUser}
          onSuccess={handleVincularSuccess}
          onCreateEmpleado={handleCrearEmpleado}
        />

        {/* Modal de Crear Empleado */}
        {showCrearEmpleadoModal && (
          <CrearEmpleadoModal
            isOpen={showCrearEmpleadoModal}
            onClose={() => setShowCrearEmpleadoModal(false)}
            onSuccess={handleCrearEmpleadoSuccess}
            prefilledData={
              selectedUser
                ? {
                    nombre: selectedUser.name || '',
                    correo: selectedUser.email || null,
                    celular: null, // User no tiene campo telefono en la interfaz
                  }
                : undefined
            }
          />
        )}

        {/* Lista de usuarios - Componente extraído */}
        <UserList
          users={usuariosFiltrados}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={eliminarUsuario}
          onVincularEmpleado={handleVincularEmpleado}
          canEdit={permisos.editar}
          canDelete={permisos.eliminar}
          search={search}
          showAll={showAll}
        />
      </div>
    </div>
  );
}

/**
 * Exportar el componente protegido
 * PRESERVADO: Exactamente la misma protección de permisos original
 */
export default function ProtectedUsersPage() {
  return (
    <ProtectedPage requiredPermission={{ modulo: 'AJUSTES_USUARIOS', accion: 'LEER' }}>
      <UsersManagementPage />
    </ProtectedPage>
  );
}

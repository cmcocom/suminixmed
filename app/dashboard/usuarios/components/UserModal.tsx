/**
 * Componente UserModal - Modal de creación/edición de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx (líneas ~670-850)
 *
 * Propósito: Componente modal completo para crear o editar usuarios.
 * Incluye formulario con validación, subida de imágenes, manejo de roles
 * y todas las funcionalidades de UX/UI originales.
 *
 * Props:
 * - isOpen: Estado de visibilidad del modal
 * - onClose: Callback para cerrar modal
 * - editingUser: Usuario a editar (null para nuevo usuario)
 * - onSubmit: Callback para envío del formulario
 * - isSubmitting: Estado de envío del formulario
 * - isValidatingEmail: Estado de validación de email
 * - currentUserRole: Rol del usuario actual para filtrar opciones
 *
 * PRESERVADO: Todo el diseño, animaciones, validaciones y estructura del formulario
 */

import { useEffect } from 'react';
import Image from 'next/image';
import { useUserForm } from '@/hooks/useUserForm';
import type { User, UserFormData } from '@/hooks/useUsersManagement';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  onSubmit: (formData: UserFormData) => Promise<boolean>;
  isSubmitting: boolean;
  isValidatingEmail: boolean;
}

export default function UserModal({
  isOpen,
  onClose,
  editingUser,
  onSubmit,
  isSubmitting,
  isValidatingEmail,
}: UserModalProps) {
  const {
    formData,
    validationError,
    showPassword,
    handleChange,
    handleImageUpload,
    validateForm,
    initializeForm,
    resetForm,
    clearImage,
    togglePasswordVisibility,
    availableRoles,
  } = useUserForm(editingUser);

  // Inicializar formulario cuando se abre para edición
  useEffect(() => {
    if (isOpen && editingUser) {
      initializeForm(editingUser);
    } else if (isOpen && !editingUser) {
      resetForm();
    }
  }, [isOpen, editingUser, initializeForm, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await onSubmit(formData);
    if (success) {
      resetForm();
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <p className="text-indigo-100 text-sm">
                  {editingUser
                    ? 'Actualiza la información del usuario'
                    : 'Completa los datos para crear un nuevo usuario'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-150"
              title="Cerrar modal"
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
        </div>

        {/* Contenido del formulario con scroll mejorado */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Alerta de error mejorada */}
            {validationError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-md mb-6 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{validationError}</span>
                </div>
              </div>
            )}

            {/* Grid de campos para mejor organización */}
            <div className="space-y-6">
              {/* Sección: Información Personal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Información Personal
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="clave"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Clave de Usuario *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="clave"
                        name="clave"
                        value={formData.clave}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black transition-all duration-150"
                        placeholder="Ej. 905887 o cve-888963"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Identificador único del usuario para login. Para empleados usar número de
                      empleado.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black transition-all duration-150"
                        placeholder="Ej. Juan Pérez García"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black transition-all duration-150"
                        placeholder="usuario@ejemplo.com"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    {isValidatingEmail && (
                      <div className="mt-2 flex items-center text-sm text-indigo-600">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Validando email...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Seguridad */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Seguridad y Acceso
                </h4>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Contraseña {editingUser ? '(dejar vacío para mantener)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black transition-all duration-150"
                        placeholder={
                          editingUser
                            ? 'Nueva contraseña (opcional)'
                            : 'Ingrese una contraseña segura'
                        }
                        required={!editingUser}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-indigo-600 transition-colors duration-150"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {editingUser
                        ? 'Deja este campo vacío si no deseas cambiar la contraseña actual'
                        : 'Mínimo 8 caracteres recomendado'}
                    </p>
                  </div>

                  {/* Campo de Rol */}
                  <div>
                    <label
                      htmlFor="roleId"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Rol del Usuario *
                    </label>
                    <div className="relative">
                      <select
                        id="roleId"
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black transition-all duration-150 bg-white"
                        required
                      >
                        <option value="">Seleccionar rol...</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {availableRoles.find((r) => r.id === formData.roleId)?.description ||
                        'Selecciona un rol para ver su descripción'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="activo"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="activo" className="ml-3 text-sm font-medium text-gray-700">
                        Usuario Activo
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formData.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {formData.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Imagen de Perfil */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Imagen de Perfil
                </h4>

                <div className="flex items-start space-x-4">
                  {/* Preview de la imagen */}
                  <div className="flex-shrink-0">
                    {formData.image || editingUser?.image ? (
                      <div className="relative group">
                        <Image
                          src={formData.image || editingUser?.image || ''}
                          alt="Imagen de perfil"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Input de archivo mejorado */}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      title="Seleccionar archivo de imagen para el perfil"
                      aria-label="Seleccionar archivo de imagen para el perfil"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-600
                        file:mr-4 file:py-3 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100 file:transition-colors file:duration-150
                        border border-gray-300 rounded-lg cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer con botones mejorado */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">Los campos marcados con * son obligatorios</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={isSubmitting || isValidatingEmail}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center"
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </>
              ) : isValidatingEmail ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Validando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

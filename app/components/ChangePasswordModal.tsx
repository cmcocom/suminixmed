'use client';

import { useState } from 'react';
import { useChangePassword } from '@/hooks/useChangePassword';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isChanging, changePassword } = useChangePassword();

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await changePassword(formData);

    if (success) {
      // Resetear formulario y cerrar modal
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header compacto con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold !text-white">Cambiar Contraseña</h3>
            <button
              onClick={handleClose}
              disabled={isChanging}
              title="Cerrar"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Body compacto */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Contraseña actual */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.currentPassword
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
                placeholder="Contraseña actual"
                disabled={isChanging}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isChanging}
                title={showPasswords.current ? 'Ocultar' : 'Mostrar'}
              >
                {showPasswords.current ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.newPassword
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
                placeholder="Nueva contraseña (min. 6 caracteres)"
                disabled={isChanging}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isChanging}
                title={showPasswords.new ? 'Ocultar' : 'Mostrar'}
              >
                {showPasswords.new ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
                placeholder="Confirma la nueva contraseña"
                disabled={isChanging}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isChanging}
                title={showPasswords.confirm ? 'Ocultar' : 'Mostrar'}
              >
                {showPasswords.confirm ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Mensaje informativo */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-indigo-700">
                La contraseña debe tener mínimo 6 caracteres y ser diferente a la actual.
              </p>
            </div>
          </div>
        </form>

        {/* Footer compacto */}
        <div className="bg-gray-50 px-5 py-3 rounded-b-xl flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isChanging}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isChanging}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 !text-white text-sm rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
          >
            {isChanging ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
              </span>
            ) : (
              'Cambiar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

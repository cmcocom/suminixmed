'use client';

import { useState } from 'react';
import { api } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
  warningMessage?: string;
}

export default function PasswordVerificationModal({
  isOpen,
  onClose,
  onVerified,
  title = 'Verificación de Contraseña',
  description = 'Esta acción requiere verificación. Ingresa tu contraseña para continuar.',
  warningMessage = 'Esta acción es irreversible y puede afectar la seguridad del sistema.',
}: PasswordVerificationModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { data: session } = useSession();

  const handleVerify = async () => {
    if (!password.trim()) {
      toast.error('Por favor ingresa tu contraseña');
      return;
    }

    if (!session?.user?.email) {
      toast.error('No se pudo verificar la sesión');
      return;
    }

    setIsVerifying(true);

    try {
      // Verificar contraseña con el endpoint de login
      const response = await api.post('/api/auth/verify-password', {
        email: session.user.email,
        password: password.trim(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Contraseña verificada correctamente');
        onVerified();
        handleClose();
      } else {
        toast.error(data.error || 'Contraseña incorrecta');
      }
    } catch (error) {
      toast.error('Error al verificar la contraseña');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setIsVerifying(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            disabled={isVerifying}
            aria-label="Cerrar modal"
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">{description}</p>

          {/* Warning */}
          {warningMessage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{warningMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ingresa tu contraseña"
                disabled={isVerifying}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isVerifying}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isVerifying}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying || !password.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isVerifying ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import PasswordVerificationModal from '@/app/components/PasswordVerificationModal';
import { logger } from '@/lib/logger';
import { useState } from 'react';

interface UsePasswordVerificationOptions {
  title?: string;
  description?: string;
  warningMessage?: string;
}

export function usePasswordVerification(options: UsePasswordVerificationOptions = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationPromise, setVerificationPromise] = useState<{
    resolve: (value: boolean) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);

  const requestVerification = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setVerificationPromise({ resolve, reject });
      setIsModalOpen(true);
    });
  };

  const handleVerified = () => {
    if (verificationPromise) {
      verificationPromise.resolve(true);
      setVerificationPromise(null);
    }
    setIsModalOpen(false);
  };

  const handleClose = () => {
    if (verificationPromise) {
      verificationPromise.resolve(false);
      setVerificationPromise(null);
    }
    setIsModalOpen(false);
  };

  const PasswordModal = () => (
    <PasswordVerificationModal
      isOpen={isModalOpen}
      onClose={handleClose}
      onVerified={handleVerified}
      title={options.title}
      description={options.description}
      warningMessage={options.warningMessage}
    />
  );

  return {
    requestVerification,
    PasswordModal,
    isModalOpen,
  };
}

// Hook especializado para acciones sensibles
export function useSensitiveAction(
  action: () => void | Promise<void>,
  options: UsePasswordVerificationOptions = {}
) {
  const { requestVerification, PasswordModal } = usePasswordVerification({
    title: 'Acción Sensible',
    description: 'Esta acción requiere verificación de contraseña para continuar.',
    warningMessage: 'Esta acción puede tener efectos importantes en el sistema.',
    ...options,
  });

  const executeWithVerification = async () => {
    try {
      const verified = await requestVerification();
      if (verified) {
        await action();
      }
    } catch (error) {
      logger.error('Error al ejecutar acción sensible:', error);
    }
  };

  return {
    executeWithVerification,
    PasswordModal,
  };
}

// Hook para gestión de roles con verificación
export function useRoleManagement() {
  const { PasswordModal } = usePasswordVerification({
    title: 'Modificación de Roles',
    description: 'Cambiar roles de usuario requiere verificación de contraseña.',
    warningMessage:
      'Los cambios de roles afectan los permisos y accesos del usuario en todo el sistema.',
  });

  return {
    PasswordModal,
  };
}

// Hook para eliminación de recursos importantes
export function useDeleteConfirmation() {
  const { requestVerification, PasswordModal } = usePasswordVerification({
    title: 'Confirmación de Eliminación',
    description: 'Esta eliminación es permanente y requiere verificación de contraseña.',
    warningMessage:
      'Esta acción no se puede deshacer. Los datos eliminados no se pueden recuperar.',
  });

  const deleteWithConfirmation = async (deleteFunction: () => Promise<void>) => {
    try {
      const verified = await requestVerification();
      if (verified) {
        await deleteFunction();
      }
    } catch (error) {
      logger.error('Error al eliminar:', error);
    }
  };

  return {
    deleteWithConfirmation,
    PasswordModal,
  };
}

'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import apiFetch from '@/lib/fetcher';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UseChangePasswordResult {
  isChanging: boolean;
  changePassword: (data: ChangePasswordData) => Promise<boolean>;
}

export function useChangePassword(): UseChangePasswordResult {
  const [isChanging, setIsChanging] = useState(false);

  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    // Validaciones del frontend
    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      toast.error('Todos los campos son requeridos');
      return false;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return false;
    }

    if (data.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (data.currentPassword === data.newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return false;
    }

    setIsChanging(true);

    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Contraseña actualizada correctamente');
        return true;
      } else {
        toast.error(result.error || 'Error al cambiar la contraseña');
        return false;
      }
    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      toast.error('Error de conexión');
      return false;
    } finally {
      setIsChanging(false);
    }
  };

  return {
    isChanging,
    changePassword,
  };
}

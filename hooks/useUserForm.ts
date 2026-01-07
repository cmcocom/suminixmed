/**
 * Hook personalizado para la gestión del formulario de usuario
 * Extraído de: app/dashboard/usuarios/page.tsx
 *
 * Propósito: Centralizar toda la lógica del formulario de usuarios incluyendo
 * validación, estado, manejo de cambios y reseteo. Mejora la separación de
 * responsabilidades y reutilización.
 *
 * Funcionalidades:
 * - Manejo del estado del formulario
 * - Validación de campos (formato email, campos requeridos)
 * - Manejo de cambios en inputs
 * - Control de visibilidad de contraseña
 * - Reset y inicialización del formulario
 * - Estados de validación y errores
 *
 * CRÍTICO: Mantiene intacta toda la lógica de validación y seguridad
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import type { User, UserFormData } from './useUsersManagement';
import { useRbacRoles } from './useRbacRoles';
import apiFetch from '@/lib/fetcher';

export function useUserForm(editingUser: User | null = null) {
  const { roles } = useRbacRoles();

  // Obtener rol por defecto (OPERADOR) con comparación case-insensitive
  const defaultRole =
    roles.find((role) => (role.name || '').toUpperCase() === 'OPERADOR')?.id || '';

  // Estado principal del formulario - ACTUALIZADO: roleId dinámico
  const [formData, setFormData] = useState<UserFormData>({
    clave: '',
    name: '',
    email: '',
    password: '',
    image: '',
    activo: true,
    roleId: defaultRole, // Cambio de rol enum a roleId dinámico
  });

  // Estados de validación y UI - PRESERVADOS: Estados críticos para UX/seguridad
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Función para validar el formulario
   * PRESERVADO: Toda la lógica de validación crítica para seguridad
   */
  const validateForm = (): boolean => {
    if (!formData.clave.trim()) {
      setValidationError('La clave es requerida');
      return false;
    }
    if (!formData.name.trim()) {
      setValidationError('El nombre es requerido');
      return false;
    }

    // Email es opcional, pero si se proporciona debe tener formato válido
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Formato de email inválido');
      return false;
    }

    // Validar contraseña solo si es nuevo usuario o si se está cambiando
    // PRESERVADO: Lógica de contraseña según contexto (nuevo vs edición)
    if (!editingUser && !formData.password.trim()) {
      setValidationError('La contraseña es requerida');
      return false;
    }

    setValidationError(null);
    return true;
  };

  /**
   * Manejador de cambios en los campos del formulario
   * PRESERVADO: Lógica completa de manejo de tipos de input y checkbox
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setValidationError(null);
  }, []);

  /**
   * Función para manejar subida de imágenes
   * PRESERVADO: Validación de tamaño y manejo de errores
   */
  const handleImageUpload = async (file: File): Promise<boolean> => {
    // Validar tamaño del archivo (max 5MB) - CRÍTICO: Límite de seguridad
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 5MB');
      return false;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await apiFetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Error al subir la imagen');

      const data = await response.json();
      if (data.success && data.path) {
        setFormData((prev) => ({
          ...prev,
          image: data.path,
        }));
        toast.success('Imagen subida correctamente');
        return true;
      } else {
        throw new Error('Error al procesar la imagen');
      }
    } catch (error) {
      toast.error('Error al subir la imagen');
      logger.error('Error:', error);
      return false;
    }
  };

  /**
   * Función para inicializar el formulario con datos de usuario existente
   * ACTUALIZADO: Usar primer rol RBAC del usuario
   */
  const initializeForm = useCallback(
    (user: User) => {
      // Obtener el primer rol RBAC del usuario o usar OPERADOR por defecto
      const userRoleId = user.rbac_user_roles?.[0]?.rbac_roles?.id || defaultRole;

      setFormData({
        clave: user.clave || '',
        name: user.name || '',
        email: user.email || '',
        password: '',
        image: user.image || '',
        activo: user.activo,
        roleId: userRoleId,
      });
      setValidationError(null);
      setShowPassword(false);
    },
    [defaultRole]
  );

  /**
   * Función para resetear el formulario a valores por defecto
   * ACTUALIZADO: Usar roleId dinámico
   */
  const resetForm = useCallback(() => {
    setFormData({
      clave: '',
      name: '',
      email: '',
      password: '',
      image: '',
      activo: true,
      roleId: defaultRole, // Cambio a roleId dinámico
    });
    setValidationError(null);
    setShowPassword(false);
  }, [defaultRole]);

  /**
   * Función para limpiar solo la imagen del formulario
   */
  const clearImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
  }, []);

  /**
   * Toggle para mostrar/ocultar contraseña
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  /**
   * Función para limpiar solo el error de validación
   */
  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    // Estado del formulario
    formData,
    validationError,
    showPassword,

    // Funciones principales
    handleChange,
    handleImageUpload,
    validateForm,
    initializeForm,
    resetForm,
    clearImage,
    togglePasswordVisibility,
    clearValidationError,

    // Roles disponibles
    availableRoles: roles,

    // Setters directos para casos especiales
    setFormData,
    setValidationError,
    setShowPassword,
  };
}

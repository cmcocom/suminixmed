import apiFetch from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  EmailValidationState,
  Entidad,
  FormData,
  ToastType,
  UseEntityManagementReturn,
} from '../types';

/**
 * Hook personalizado para gestionar entidades y el formulario de edición
 */
export function useEntityManagement(): UseEntityManagementReturn {
  const [entidadActiva, setEntidadActiva] = useState<Entidad | null>(null);
  const [loadingEntidad, setLoadingEntidad] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    rfc: '',
    correo: '',
    telefono: '',
    contacto: '',
    licencia: '',
    logo: '',
    tiempo_sesion_minutos: 3,
    estatus: 'activo',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [emailValidationState, setEmailValidationState] = useState<EmailValidationState>('idle');

  useEffect(() => {
    const loadActiveEntity = async () => {
      try {
        setLoadingEntidad(true);

        // helper to call api with configurable timeout
        // Este endpoint puede tardar si Prisma está estableciendo conexión o realiza queries pesadas.
        // Aumentamos el timeout localmente para evitar fallos de UI mientras investigamos la raíz.
        const callEntidades = (timeoutMs = 30000) =>
          apiFetch('/api/entidades/active', undefined, timeoutMs);

        let response: Response | undefined;
        try {
          response = await callEntidades(30000);
        } catch (err: unknown) {
          if (err instanceof Error && err.message === 'TimeoutError') {
            logger.warn('[ENTIDAD] Timeout al cargar entidad, reintentando con timeout extendido');
            // Reintentar con timeout aún mayor
            response = await callEntidades(45000);
          } else {
            throw err;
          }
        }

        if (response && response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setEntidadActiva(data.data);
          }
        } else if (response && response.status === 404) {
          // No hay entidad activa configurada
        } else if (response && response.status === 401) {
          // No autorizado para cargar entidad
        } else {
          logger.error(
            '[ENTIDAD] Error al cargar entidad:',
            response?.status,
            response?.statusText
          );
        }
      } catch (error) {
        logger.error('[ENTIDAD] Error al cargar entidad:', error);
      } finally {
        setLoadingEntidad(false);
      }
    };

    loadActiveEntity();
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (typeof window !== 'undefined') {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'info':
          toast(message);
          break;
        case 'warning':
          toast(message, { icon: '⚠️' });
          break;
        default:
          toast(message);
      }
    }
  }, []);

  const validateEmailUnique = useCallback(
    async (email: string, entidadId?: string): Promise<boolean> => {
      if (!email) return true;

      setIsValidatingEmail(true);
      setEmailValidationState('validating');

      try {
        const requestBody = { email, entidadId };

        const response = await apiFetch('/api/entidades/validate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          setEmailValidationState('error');
          return true; // En caso de error, permitir continuar
        }

        const data = await response.json();

        if (!data.isUnique) {
          setValidationError('Este email ya está en uso');
          setEmailValidationState('error');
          return false;
        }

        setValidationError(null);
        setEmailValidationState('valid');
        return true;
      } catch (error: unknown) {
        setEmailValidationState('error');
        return true; // En caso de error, permitir continuar
      } finally {
        setIsValidatingEmail(false);
      }
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 150) {
      errors.nombre = 'El nombre no puede exceder 150 caracteres';
    }

    if (formData.correo.trim() && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.correo)) {
      errors.correo = 'El formato del email no es válido';
    }

    if (formData.rfc.trim() && formData.rfc.length > 20) {
      errors.rfc = 'El RFC no puede exceder 20 caracteres';
    }

    if (formData.tiempo_sesion_minutos < 1 || formData.tiempo_sesion_minutos > 5) {
      errors.tiempo_sesion_minutos = 'El tiempo de sesión debe estar entre 1 y 5 minutos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: name === 'tiempo_sesion_minutos' ? parseInt(value) || 3 : value,
      }));

      // Limpiar errores cuando el usuario empieza a escribir
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // Validar email en tiempo real si es el campo de correo
      if (name === 'correo' && value.trim()) {
        const timeoutId = setTimeout(() => {
          validateEmailUnique(value, entidadActiva?.id_empresa);
        }, 500); // Debounce de 500ms

        return () => clearTimeout(timeoutId);
      }

      return;
    },
    [formErrors, entidadActiva?.id_empresa, validateEmailUnique]
  );

  const resetForm = useCallback(() => {
    setFormData({
      nombre: '',
      rfc: '',
      correo: '',
      telefono: '',
      contacto: '',
      licencia: '',
      logo: '',
      tiempo_sesion_minutos: 3,
      estatus: 'activo',
    });
    setFormErrors({});
    setValidationError(null);
    setEmailValidationState('idle');
  }, []);

  const loadEntityToForm = useCallback((entidad: Entidad) => {
    setFormData({
      nombre: entidad.nombre || '',
      rfc: entidad.rfc || '',
      correo: entidad.correo || '',
      telefono: entidad.telefono || '',
      contacto: entidad.contacto || '',
      licencia: entidad.licencia_usuarios_max?.toString() || '',
      logo: entidad.logo || '',
      tiempo_sesion_minutos: entidad.tiempo_sesion_minutos || 3,
      estatus: entidad.estatus || 'activo',
    });
    setFormErrors({});
    setValidationError(null);
    setEmailValidationState('idle');
  }, []);

  return {
    entidadActiva,
    setEntidadActiva,
    loadingEntidad,

    formData,
    setFormData,
    formErrors,
    setFormErrors,
    submitLoading,
    setSubmitLoading,
    isValidatingEmail,
    validationError,
    setValidationError,
    emailValidationState,

    validateEmailUnique,
    validateForm,

    handleChange,
    resetForm,
    loadEntityToForm,

    showToast,
  };
}

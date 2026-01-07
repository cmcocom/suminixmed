/**
 * Hook personalizado para la gestión completa de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx
 *
 * Propósito: Centralizar toda la lógica CRUD de usuarios (cargar, crear, editar, eliminar)
 * y manejo de estado relacionado. Mejora la reutilización y reduce la complejidad
 * del componente principal.
 *
 * Funcionalidades:
 * - Carga de usuarios desde API
 * - Creación y edición de usuarios
 * - Eliminación de usuarios
 * - Manejo de estados de carga y errores
 * - Integración con sistema de permisos
 * - Validación de email único
 *
 * CRÍTICO: Mantiene intacta toda la lógica de permisos, timeouts y validaciones
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserImage } from '@/app/contexts/UserImageContext';
import { useRbacRoles } from '@/hooks/useRbacRoles';
import apiFetch from '@/lib/fetcher';

// Tipos actualizados para sistema RBAC dinámico
export interface UserRole {
  rbac_roles: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface UserEmpleado {
  id: string;
  numero_empleado: string;
  nombre: string;
  cargo: string;
  servicio: string | null;
  turno: string;
}

export interface User {
  id: string;
  clave: string;
  name: string | null;
  email: string | null;
  image: string | null;
  activo: boolean;
  rbac_user_roles: UserRole[];
  empleados: UserEmpleado | null; // Corregido: empleados (plural) según schema Prisma
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  clave: string;
  name: string;
  email: string;
  password: string;
  image: string;
  activo: boolean;
  roleId: string; // Cambio de rol enum a roleId dinámico
}

export function useUsersManagement() {
  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estados del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  // Hooks del contexto
  const { updateUserImage } = useUserImage();
  const { tienePermiso, user: currentUser } = useAuth();
  const { roles: _roles } = useRbacRoles();

  /**
   * Función para cargar usuarios desde la API
   * PRESERVADO: Toda la lógica de manejo de errores y logging debug
   */
  const cargarUsuarios = useCallback(async () => {
    try {
      const response = await apiFetch('/api/users');

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setUsers(result.data || []);
      } else {
        setUsers([]); // Asegurar que users sea un array vacío en caso de error
      }
    } catch (error) {
      logger.error('Error cargando usuarios:', error);
      setUsers([]); // Asegurar que users sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Función para validar email único
   * PRESERVADO: Toda la lógica de seguridad y validación crítica
   */
  const validateEmailUnique = async (email: string, userId?: string): Promise<boolean> => {
    // Si el email está vacío, es válido (ahora es opcional)
    if (!email || !email.trim()) {
      return true;
    }

    setIsValidatingEmail(true);

    try {
      const response = await apiFetch('/api/users/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (!data.isUnique) {
        toast.error('Este email ya está en uso');
        return false;
      }

      return true;
    } catch (error: unknown) {
      logger.error('Error validando email:', error);
      toast.error('Error al validar el email');
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  /**
   * Función para mostrar notificaciones
   * PRESERVADO: Manejo de mensajes de usuario
   */
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  /**
   * Función principal para enviar datos del formulario
   * PRESERVADO: Toda la lógica de manejo de errores, timeouts y validaciones críticas
   */
  const submitUser = async (formData: UserFormData): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      // Validar email único - CRÍTICO: No modificar esta validación
      const isEmailValid = await validateEmailUnique(formData.email, editingUser?.id);
      if (!isEmailValid) return false;

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';

      const method = editingUser ? 'PUT' : 'POST';

      console.log('🚀 Realizando petición:', { method, url, data: formData });

      interface SubmitData {
        clave: string;
        name: string;
        email: string;
        password?: string;
        image: string;
        activo: boolean;
        roleId: string; // Cambio de rol a roleId
      }

      const submitData: SubmitData = { ...formData };
      if (editingUser && !formData.password) {
        delete submitData.password;
      }

      console.log('📤 Datos enviados a la API:', submitData);

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      console.log('📥 Respuesta recibida:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // PRESERVADO: Todo el manejo detallado de errores HTTP
      if (!response.ok) {
        console.error('❌ Response no OK:', response.status, response.statusText);

        // Intentar leer el cuerpo de la respuesta de error
        let errorText = '';
        try {
          errorText = await response.text();
          logger.error('📄 Cuerpo del error:', errorText);
        } catch (e) {
          logger.error('❌ No se pudo leer el cuerpo del error:', e);
        }

        if (response.status === 401) {
          showToast('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return false;
        } else if (response.status === 500) {
          // Error interno del servidor - intentar mostrar mensaje específico
          try {
            const errorData = JSON.parse(errorText);
            showToast(
              errorData.error || 'Error interno del servidor. Revisa la consola para más detalles.',
              'error'
            );
          } catch {
            showToast('Error interno del servidor. Revisa la consola para más detalles.', 'error');
          }
          return false;
        } else if (response.status === 400) {
          try {
            const errorData = JSON.parse(errorText);
            showToast(errorData.error || 'Error de validación', 'error');
          } catch {
            showToast('Error de validación en los datos enviados', 'error');
          }
          return false;
        } else if (response.status === 409) {
          // Conflicto - email ya existe
          try {
            const errorData = JSON.parse(errorText);
            showToast(errorData.error || 'El email ya está registrado', 'error');
          } catch {
            showToast('El email ya está registrado', 'error');
          }
          return false;
        } else {
          // Otros errores (incluyendo límite de licencia)
          try {
            const errorData = JSON.parse(errorText);
            showToast(errorData.error || 'Error en el servidor', 'error');
          } catch {
            showToast('Error en el servidor', 'error');
          }
          return false;
        }
      }

      // PRESERVADO: Lógica completa de procesamiento de respuesta exitosa
      let result;
      try {
        const responseText = await response.text();
        console.log('📄 Respuesta cruda:', responseText);

        if (!responseText) {
          console.log('⚠️ Respuesta vacía, asumiendo éxito para operación PUT');
          result = { success: true };
        } else {
          result = JSON.parse(responseText);
        }
      } catch (e) {
        logger.error('❌ Error al parsear JSON:', e);
        // Si no se puede parsear pero la respuesta fue exitosa, asumir éxito
        if (response.ok) {
          console.log('✅ Respuesta OK pero sin JSON válido, asumiendo éxito');
          result = { success: true };
        } else {
          showToast('Error en la respuesta del servidor', 'error');
          return false;
        }
      }

      console.log('📋 Resultado parseado:', result);

      // Considerar exitoso si:
      // 1. response.ok es true, O
      // 2. result.success es true (para CREATE), O
      // 3. result.user existe (para UPDATE), O
      // 4. result.message existe sin error (para DELETE)
      const isSuccess =
        response.ok || result.success || result.user || (result.message && !result.error);

      if (isSuccess) {
        showToast(
          editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
          'success'
        );
        cargarUsuarios();

        // Si el usuario editado es el actual, actualizar la imagen en el contexto
        // PRESERVADO: Sincronización con contexto de imagen de usuario
        if (editingUser && currentUser?.id === editingUser.id && formData.image) {
          updateUserImage(formData.image);
        }

        return true;
      } else {
        console.error('❌ Error en respuesta:', result);
        const errorMessage = result.error || result.message || 'Error al procesar la solicitud';
        console.error('❌ Mensaje de error:', errorMessage);
        showToast(errorMessage, 'error');
        return false;
      }
    } catch (error) {
      logger.error('💥 Error completo en frontend:', error);
      showToast('Error de conexión', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Función para eliminar usuario
   * PRESERVADO: Confirmación de usuario y manejo de errores
   */
  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;

    try {
      const response = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('📋 Resultado de eliminación:', result);

      // Considerar exitoso si response.ok es true O si result.message existe sin error
      const isSuccess = response.ok || (result.message && !result.error);

      if (isSuccess) {
        showToast('Usuario eliminado correctamente', 'success');
        cargarUsuarios();
      } else {
        showToast(result.error || result.message || 'Error al eliminar', 'error');
      }
    } catch (error) {
      logger.error('Error:', error);
      showToast('Error de conexión', 'error');
    }
  };

  /**
   * Función para preparar edición de usuario
   * PRESERVADO: Inicialización correcta del formulario
   */
  const editarUsuario = useCallback((user: User) => {
    setEditingUser(user);
  }, []);

  /**
   * Función para limpiar estado de edición
   */
  const cancelarEdicion = () => {
    setEditingUser(null);
  };

  // Debug de permisos - PRESERVADO: Logging de debug crítico
  console.log(
    '🔍 [USUARIOS DEBUG] AJUSTES_USUARIOS.EDITAR:',
    tienePermiso('AJUSTES_USUARIOS', 'EDITAR')
  );
  console.log(
    '🔍 [USUARIOS DEBUG] AJUSTES_USUARIOS.ELIMINAR:',
    tienePermiso('AJUSTES_USUARIOS', 'ELIMINAR')
  );
  console.log(
    '🔍 [USUARIOS DEBUG] Usuario actual:',
    currentUser?.email,
    'Roles:',
    currentUser?.roles
  );

  return {
    // Estados
    users,
    loading,
    editingUser,
    isSubmitting,
    isValidatingEmail,

    // Funciones principales
    cargarUsuarios,
    submitUser,
    eliminarUsuario,
    editarUsuario,
    cancelarEdicion,

    // Utilidades
    showToast,

    // Información de permisos
    permisos: {
      crear: tienePermiso('AJUSTES_USUARIOS', 'CREAR'),
      editar: tienePermiso('AJUSTES_USUARIOS', 'EDITAR'),
      eliminar: tienePermiso('AJUSTES_USUARIOS', 'ELIMINAR'),
      leer: tienePermiso('AJUSTES_USUARIOS', 'LEER'),
    },

    // Usuario actual para referencias
    currentUser,
  };
}

/**
 * Utilidades para gestión de usuarios
 * Extraído de: app/dashboard/usuarios/page.tsx
 *
 * Propósito: Centralizar funciones de formateo, validación y utilidades
 * relacionadas con usuarios. Mejora la reutilización y mantiene el código
 * de presentación separado de la lógica de negocio.
 *
 * Funcionalidades:
 * - Formateo de fechas para UI
 * - Formateo de roles dinámicos con colores y etiquetas
 * - Funciones de filtrado y paginación
 * - Cálculo de estadísticas de usuarios
 *
 * MIGRACIÓN RBAC: Sistema actualizado para usar roles dinámicos
 */

import type { User } from '@/hooks/useUsersManagement';

/**
 * Formatea una fecha ISO a formato legible en español
 * PRESERVADO: Formato específico para la UI
 */
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Configuración de roles dinámicos con etiquetas y colores para la UI
 * ACTUALIZADO: Usa nombres de roles en lugar de enum
 * NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
 */
export const formatearRol = (roleName: string) => {
  const roles: Record<string, { label: string; color: string }> = {
    OPERADOR: { label: 'Operador', color: 'bg-blue-100 text-blue-800' },
    ADMINISTRADOR: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
    UNIDADC: { label: 'UNIDADC', color: 'bg-red-100 text-red-800' },
  };
  return roles[roleName] || { label: roleName, color: 'bg-gray-100 text-gray-800' };
};

/**
 * Función de filtrado de usuarios
 * PRESERVADO: Lógica exacta de filtrado basada en búsqueda y showAll
 *
 * OPTIMIZACIÓN BACKEND SUGERIDA:
 * Mover esta lógica a un endpoint con paginación:
 * GET /api/users?page=1&limit=8&search=texto&showAll=true&orderBy=createdAt&order=desc
 *
 * Beneficios:
 * - Reduce transferencia de datos (solo usuarios de la página actual)
 * - Mejora performance con índices DB en name/email
 * - Permite ordenamiento eficiente en backend
 * - Escalabilidad para miles de usuarios
 */
export const filtrarUsuarios = (users: User[], search: string, showAll: boolean): User[] => {
  // Si no está marcado "mostrar todos" y no hay búsqueda, no mostrar nada
  if (!showAll && search.trim() === '') {
    return [];
  }

  // Si está marcado "mostrar todos" y no hay búsqueda, mostrar todos
  if (showAll && search.trim() === '') {
    return users || [];
  }

  // Si hay búsqueda, filtrar independientemente del estado del checkbox
  if (search.trim() !== '') {
    return (users || []).filter((user) => {
      const searchLower = search.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    });
  }

  return [];
};

/**
 * Función de paginación
 * PRESERVADO: Lógica de slicing para paginación local
 *
 * OPTIMIZACIÓN BACKEND SUGERIDA:
 * Implementar en el endpoint mencionado arriba para que la paginación
 * sea manejada directamente por la base de datos usando LIMIT y OFFSET
 */
export const paginarUsuarios = (usuarios: User[], currentPage: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);
  const usuariosParaPagina = usuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    usuarios: usuariosParaPagina,
    totalPages,
    totalItems: usuarios.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, usuarios.length),
  };
};

/**
 * Calcula estadísticas generales de usuarios
 * ACTUALIZADO: Sistema RBAC - Las estadísticas por rol ahora usan roles dinámicos
 */
export const calcularEstadisticas = (users: User[]) => {
  const total = users.length;
  const activos = users.filter((u) => u.activo).length;
  const inactivos = users.filter((u) => !u.activo).length;

  // Estadísticas por rol dinámico
  const rolesCount: Record<string, number> = {};
  users.forEach((user) => {
    if (user.rbac_user_roles && user.rbac_user_roles.length > 0) {
      // Tomar el primer rol (cada usuario debería tener solo uno)
      const userRole = user.rbac_user_roles[0];
      if (userRole?.rbac_roles?.name) {
        const roleName = userRole.rbac_roles.name;
        rolesCount[roleName] = (rolesCount[roleName] || 0) + 1;
      }
    }
  });

  return {
    total,
    activos,
    inactivos,
    porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0,
    porRol: rolesCount,
  };
};

/**
 * DEPRECIADO: Sistema de permisos migrado a RBAC
 * Esta función será reemplazada por verificación de permisos RBAC
 */
export const puedeAsignarRol = (rolDestino: string, rolUsuarioActual?: string): boolean => {
  if (!rolUsuarioActual) return false;

  // Solo UNIDADC puede asignar cualquier rol
  if (rolUsuarioActual === 'UNIDADC') return true;

  // Administradores pueden asignar hasta administrador (no UNIDADC)
  if (rolUsuarioActual === 'ADMINISTRADOR') {
    return rolDestino !== 'UNIDADC';
  }

  // Otros roles no pueden asignar roles superiores
  return false;
};

/**
 * DEPRECIADO: Esta función será reemplazada por el hook useRbacRoles
 * Los roles disponibles ahora se obtienen dinámicamente de la base de datos
 * NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
 */
export const getRolesDisponibles = (
  rolUsuarioActual?: string
): Array<{ value: string; label: string; description: string }> => {
  const todosLosRoles = [
    {
      value: 'OPERADOR',
      label: 'Operador',
      description: 'Acceso básico al sistema para operaciones diarias',
    },
    {
      value: 'ADMINISTRADOR',
      label: 'Administrador',
      description: 'Acceso completo para gestión de usuarios y configuración',
    },
    {
      value: 'UNIDADC',
      label: 'UNIDADC',
      description: 'Acceso total al sistema incluyendo configuración avanzada',
    },
  ];

  return todosLosRoles.filter((rol) => puedeAsignarRol(rol.value, rolUsuarioActual));
};

/**
 * Genera un placeholder de imagen basado en las iniciales del nombre
 * Útil cuando no hay imagen de perfil disponible
 */
export const generarIniciales = (nombre?: string | null): string => {
  if (!nombre) return 'U';

  return nombre
    .split(' ')
    .map((palabra) => palabra.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Valida el formato de archivo de imagen
 * PRESERVADO: Validación de seguridad para subida de archivos
 */
export const validarArchivoImagen = (archivo: File): { valido: boolean; error?: string } => {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const tamañoMaximo = 5 * 1024 * 1024; // 5MB

  if (!tiposPermitidos.includes(archivo.type)) {
    return {
      valido: false,
      error: 'Formato no permitido. Use JPG, PNG o GIF',
    };
  }

  if (archivo.size > tamañoMaximo) {
    return {
      valido: false,
      error: 'El archivo debe ser menor a 5MB',
    };
  }

  return { valido: true };
};

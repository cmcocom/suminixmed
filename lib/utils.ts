// Utility function para manejo seguro de errores
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Error desconocido';
};

// Utility function para validación de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function para formateo de precios
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

// Utility function para formateo de fechas
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

// Utility function para debounce
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility function para validación de archivos de imagen
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'El archivo debe ser una imagen' };
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'La imagen debe ser menor a 5MB' };
  }

  return { isValid: true };
};

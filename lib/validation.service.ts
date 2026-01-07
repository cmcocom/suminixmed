/**
 * Servicio de validaciones centralizadas
 * Elimina lógica duplicada y mejora la consistencia
 */

import { z } from 'zod';

export class ValidationService {
  // Esquemas de validación comunes
  static readonly emailSchema = z.string().email('Email inválido');
  static readonly phoneSchema = z
    .string()
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Teléfono inválido')
    .optional();
  static readonly rfcSchema = z
    .string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido')
    .optional();
  static readonly passwordSchema = z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres');

  // Validación de Usuario
  static readonly userCreateSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: this.emailSchema,
    password: this.passwordSchema,
    image: z.string().optional(),
    activo: z.boolean().optional(),
    rol: z.enum(['ADMINISTRADOR', 'OPERADOR']).optional(),
  });

  static readonly userUpdateSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').optional(),
    email: this.emailSchema.optional(),
    password: this.passwordSchema.optional(),
    image: z.string().optional(),
    activo: z.boolean().optional(),
    rol: z.enum(['ADMINISTRADOR', 'OPERADOR']).optional(),
  });

  // Validación de Cliente
  static readonly clientCreateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    email: this.emailSchema.optional(),
    telefono: this.phoneSchema,
    direccion: z.string().optional(),
    rfc: this.rfcSchema,
    empresa: z.string().optional(),
    contacto: z.string().optional(),
  });

  static readonly clientUpdateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').optional(),
    email: this.emailSchema.optional(),
    telefono: this.phoneSchema,
    direccion: z.string().optional(),
    rfc: this.rfcSchema,
    empresa: z.string().optional(),
    contacto: z.string().optional(),
    activo: z.boolean().optional(),
  });

  // Validación de Inventario
  static readonly inventoryCreateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    descripcion: z.string().optional(),
    categoria: z.string().min(1, 'La categoría es requerida'),
    categoriaId: z.string().optional(),
    cantidad: z.number().int().min(0, 'La cantidad debe ser mayor o igual a 0'),
    precio: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    proveedor: z.string().optional(),
    fechaVencimiento: z.date().optional(),
    estado: z.enum(['disponible', 'agotado', 'vencido']).default('disponible'),
  });

  static readonly inventoryUpdateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').optional(),
    descripcion: z.string().optional(),
    categoria: z.string().optional(),
    categoriaId: z.string().optional(),
    cantidad: z.number().int().min(0, 'La cantidad debe ser mayor o igual a 0').optional(),
    precio: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
    proveedor: z.string().optional(),
    fechaVencimiento: z.date().optional(),
    estado: z.enum(['disponible', 'agotado', 'vencido']).optional(),
  });

  // Validación de Categoría
  static readonly categoryCreateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    descripcion: z.string().optional(),
  });

  static readonly categoryUpdateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').optional(),
    descripcion: z.string().optional(),
    activo: z.boolean().optional(),
  });

  // Validación de Entidad
  static readonly entityCreateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    rfc: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido'),
    logo: z.string().optional(),
    correo: this.emailSchema.optional(),
    telefono: this.phoneSchema,
    contacto: z.string().optional(),
    licencia_usuarios_max: z.number().int().min(1, 'Debe permitir al menos 1 usuario'),
    tiempo_sesion_minutos: z
      .number()
      .int()
      .min(5, 'El tiempo de sesión debe ser al menos 5 minutos'),
  });

  static readonly entityUpdateSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').optional(),
    rfc: z
      .string()
      .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido')
      .optional(),
    logo: z.string().optional(),
    correo: this.emailSchema.optional(),
    telefono: this.phoneSchema,
    contacto: z.string().optional(),
    licencia_usuarios_max: z.number().int().min(1, 'Debe permitir al menos 1 usuario').optional(),
    tiempo_sesion_minutos: z
      .number()
      .int()
      .min(5, 'El tiempo de sesión debe ser al menos 5 minutos')
      .optional(),
    estatus: z.enum(['activo', 'inactivo']).optional(),
  });

  // Validación de Fondo Fijo
  static readonly fondoFijoCreateSchema = z.object({
    id_departamento: z.string().min(1, 'El departamento es requerido'),
    id_producto: z.string().min(1, 'El producto es requerido'),
    cantidad_asignada: z.number().int().min(0, 'La cantidad asignada debe ser mayor o igual a 0'),
    cantidad_disponible: z
      .number()
      .int()
      .min(0, 'La cantidad disponible debe ser mayor o igual a 0'),
    cantidad_minima: z.number().int().min(0, 'La cantidad mínima debe ser mayor o igual a 0'),
  });

  static readonly fondoFijoUpdateSchema = z.object({
    cantidad_asignada: z
      .number()
      .int()
      .min(0, 'La cantidad asignada debe ser mayor o igual a 0')
      .optional(),
    cantidad_disponible: z
      .number()
      .int()
      .min(0, 'La cantidad disponible debe ser mayor o igual a 0')
      .optional(),
    cantidad_minima: z
      .number()
      .int()
      .min(0, 'La cantidad mínima debe ser mayor o igual a 0')
      .optional(),
  });

  // Validación de paginación
  static readonly paginationSchema = z.object({
    page: z.number().int().min(1, 'La página debe ser mayor a 0').default(1),
    limit: z.number().int().min(1).max(100, 'El límite máximo es 100').default(10),
    search: z.string().optional(),
    orderBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  });

  // Métodos de validación
  static validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError('Datos de entrada inválidos', errors);
    }

    return result.data;
  }

  static async validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
    return this.validateAndTransform(schema, data);
  }

  // Validaciones específicas de negocio
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push('Debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Debe contener al menos una letra mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Debe contener al menos una letra minúscula');
    }

    if (!/[0-9]/.test(password)) {
      issues.push('Debe contener al menos un número');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      issues.push('Debe contener al menos un carácter especial (!@#$%^&*)');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static validateBusinessRules = {
    // Validar que la cantidad disponible no exceda la asignada
    fondoFijoQuantities: (asignada: number, disponible: number, minima: number) => {
      const issues: string[] = [];

      if (disponible > asignada) {
        issues.push('La cantidad disponible no puede ser mayor a la asignada');
      }

      if (minima > asignada) {
        issues.push('La cantidad mínima no puede ser mayor a la asignada');
      }

      return issues;
    },

    // Validar fechas de vencimiento
    inventoryExpiration: (fechaVencimiento?: Date) => {
      if (!fechaVencimiento) return [];

      const now = new Date();
      const issues: string[] = [];

      if (fechaVencimiento < now) {
        issues.push('La fecha de vencimiento no puede ser anterior a la fecha actual');
      }

      return issues;
    },

    // Validar límites de usuarios
    userLicenseLimit: (currentUsers: number, maxUsers: number, isIncrement = true) => {
      const futureCount = isIncrement ? currentUsers + 1 : currentUsers;

      if (futureCount > maxUsers) {
        throw new ValidationError(
          `Se ha alcanzado el límite máximo de usuarios activos (${maxUsers})`
        );
      }
    },
  };
}

// Clase de error personalizada para validaciones
export class ValidationError extends Error {
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
    };
  }
}

export default ValidationService;

/**
 * Middleware y utilidades para manejo centralizado de errores
 */

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ValidationError } from './validation.service';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Detectar si es un error de conexión a la base de datos
 */
function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('connection') ||
      message.includes('fatal') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('too many clients') ||
      message.includes('demasiados clientes') ||
      message.includes('pool')
    );
  }
  return false;
}

/**
 * Detectar si es un error de memoria
 */
function isMemoryError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('out of memory') ||
      message.includes('heap') ||
      message.includes('allocation')
    );
  }
  return false;
}

export class ErrorHandler {
  static handle(error: unknown): NextResponse {
    // Log del error para debugging
    console.error('[ERROR_HANDLER]', error);

    // Error de conexión a base de datos
    if (isConnectionError(error)) {
      console.error('[DB_CONNECTION_ERROR] Error de conexión a BD:', error);
      return NextResponse.json(
        {
          error:
            'Error de conexión a la base de datos. Por favor, intente de nuevo en unos segundos.',
          code: 'DB_CONNECTION_ERROR',
          retryable: true,
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Error de memoria
    if (isMemoryError(error)) {
      console.error('[MEMORY_ERROR] Error de memoria:', error);
      return NextResponse.json(
        {
          error: 'El servidor está experimentando alta carga. Por favor, intente de nuevo.',
          code: 'MEMORY_ERROR',
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Error de validación
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Error personalizado de API
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Errores de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    // Error de inicialización de Prisma
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('[PRISMA_INIT_ERROR] Error de inicialización:', error);
      return NextResponse.json(
        {
          error: 'Error de conexión a la base de datos',
          code: 'DB_INIT_ERROR',
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Error de Prisma sin conexión
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      console.error('[PRISMA_PANIC] Error crítico de Prisma:', error);
      return NextResponse.json(
        {
          error: 'Error crítico del servidor. El equipo técnico ha sido notificado.',
          code: 'CRITICAL_ERROR',
        },
        { status: 500 }
      );
    }

    // Error genérico
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    // Error desconocido
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }

  private static handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const field = (error.meta?.target as string[]) || ['campo'];
        return NextResponse.json(
          {
            error: `Ya existe un registro con el mismo ${field.join(', ')}`,
            code: 'DUPLICATE_ENTRY',
          },
          { status: 409 }
        );

      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'Registro no encontrado',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );

      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          {
            error: 'No se puede eliminar el registro porque está siendo usado por otros datos',
            code: 'FOREIGN_KEY_CONSTRAINT',
          },
          { status: 409 }
        );

      case 'P2014': // Required relation violation
        return NextResponse.json(
          {
            error: 'Faltan datos requeridos para completar la operación',
            code: 'REQUIRED_RELATION_VIOLATION',
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV === 'development'
                ? `Database error: ${error.message}`
                : 'Error de base de datos',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
    }
  }
}

// HOC para manejo de errores en API routes
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };
}

// Middleware de validación de sesión
export async function requireAuth() {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');

  const session = await getServerSession(authOptions);

  if (!session) {
    throw new ApiError('No autorizado', 401, 'UNAUTHORIZED');
  }

  return session;
}

// Middleware de validación de roles (para futuro uso)
export async function requireRole(roles: string[]) {
  const session = await requireAuth();

  // Por ahora no hay roles implementados, pero se puede extender
  // const userRole = session.user.role;
  // if (!roles.includes(userRole)) {
  //   throw new ApiError('Acceso denegado', 403, 'FORBIDDEN');
  // }

  // Temporarily suppress unused-variable warning in this scaffold function
  void roles;
  return session;
}

// Utilidades de respuesta
export class ApiResponse {
  static success<T>(data: T, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        ...(message && { message }),
      },
      { status }
    );
  }

  static created<T>(data: T, message = 'Creado exitosamente') {
    return this.success(data, message, 201);
  }

  static updated<T>(data: T, message = 'Actualizado exitosamente') {
    return this.success(data, message, 200);
  }

  static deleted(message = 'Eliminado exitosamente') {
    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 200 }
    );
  }

  static paginated<T>(
    data: T[],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message?: string
  ) {
    return NextResponse.json(
      {
        success: true,
        data,
        pagination,
        ...(message && { message }),
      },
      { status: 200 }
    );
  }
}

export default ErrorHandler;

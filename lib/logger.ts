// Logger centralizado
// Uso: import { logger } from '@/lib/logger'; logger.debug(...), logger.info(...), logger.warn(...), logger.error(...)

const isDev = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV === 'production';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Debug: Solo en desarrollo
   */
  debug(message: string, ...args: any[]): void {
    if (!isDev) return;
    const maybeContext =
      args.length && typeof args[args.length - 1] === 'object' ? args[args.length - 1] : undefined;
    const formatted = this.formatMessage('DEBUG', message, maybeContext);
    if (maybeContext) {
      console.debug(formatted, ...args.slice(0, -1));
    } else {
      console.debug(formatted, ...args);
    }
  }

  /**
   * Info: Solo en desarrollo
   */
  info(message: string, ...args: any[]): void {
    if (!isDev) return;
    const maybeContext =
      args.length && typeof args[args.length - 1] === 'object' ? args[args.length - 1] : undefined;
    const formatted = this.formatMessage('INFO', message, maybeContext);
    if (maybeContext) {
      console.info(formatted, ...args.slice(0, -1));
    } else {
      console.info(formatted, ...args);
    }
  }

  /**
   * Warn: Siempre se muestra
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  /**
   * Error: Siempre se muestra
   */
  error(message: string, error?: Error | unknown, context?: any): void {
    const errorInfo: LogContext = {
      ...(typeof context === 'object' && context ? context : { extra: context }),
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };

    console.error(this.formatMessage('ERROR', message, errorInfo));

    // En producción podemos enviar a un servicio como Sentry
    if (isProd && typeof window !== 'undefined') {
      // Sentry.captureException(error, { extra: context });
    }
  }

  apiError(route: string, method: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error: ${method} ${route}`, error, {
      route,
      method,
      ...context,
    });
  }
}

export const logger = new Logger();

// Exportar tipos para uso en otros archivos
export type { LogContext };

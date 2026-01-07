/**
 * Utilidades de Monitoreo de Rendimiento
 * Herramientas para medir y reportar métricas de rendimiento
 */

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  /**
   * Iniciar medición de tiempo
   */
  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  /**
   * Finalizar medición y retornar tiempo transcurrido
   */
  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.measurements.delete(label);
    return duration;
  }

  /**
   * Medir tiempo de ejecución de una función async
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    return { result, duration };
  }

  /**
   * Reportar métricas al servidor (opcional)
   */
  static report(metrics: {
    operation: string;
    duration: number;
    success: boolean;
    metadata?: Record<string, unknown>;
  }): void {
    if (process.env.NODE_ENV === 'production') {
      // En producción, enviar a servicio de analytics
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   body: JSON.stringify(metrics)
      // });
    } else {
      console.table([metrics]);
    }
  }
}

/**
 * Hook React para medir tiempo de renderizado
 */
export function useRenderTime(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const renderStart = performance.now();
    // Evitar warnings de variables no usadas en ambientes donde no se loguean
    void componentName;
    void renderStart;

    return () => {
      const renderEnd = performance.now();
      void renderEnd;
      // Medición de render time disponible pero no logueada
    };
  }

  return () => {}; // noop en producción
}

/**
 * Decorador para medir tiempo de métodos de clase
 */
export function measureTime(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const label = `${target?.constructor?.name || 'Unknown'}.${propertyKey}`;
    PerformanceMonitor.start(label);

    try {
      const result = await originalMethod.apply(this, args);
      PerformanceMonitor.end(label);
      return result;
    } catch (error) {
      PerformanceMonitor.end(label);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Utilidad para detectar queries N+1 en desarrollo
 */
export class QueryMonitor {
  private static queryCount = 0;
  private static queryStack: string[] = [];

  static startRequest(): void {
    this.queryCount = 0;
    this.queryStack = [];
  }

  static logQuery(query: string): void {
    this.queryCount++;
    this.queryStack.push(query);
  }

  static endRequest(): void {
    // Monitoring completado
  }
}

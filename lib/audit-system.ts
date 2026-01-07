/**
 * Sistema Central de Auditoría
 *
 * Este módulo proporciona funcionalidades completas para el registro
 * de auditoría de todas las operaciones CRUD del sistema.
 */

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Tipos de acciones de auditoría
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT = 'EXPORT',
  BULK_UPDATE = 'BULK_UPDATE',
  RESTORE = 'RESTORE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  STOCK_MOVEMENT = 'STOCK_MOVEMENT',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
}

// Niveles de criticidad
export enum AuditLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Interface para los datos de auditoría
export interface AuditLogData {
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  level?: AuditLevel;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Clase principal del sistema de auditoría
 */
export class AuditSystem {
  /**
   * Registra un evento de auditoría
   */
  static async logEvent(data: AuditLogData): Promise<void> {
    try {
      await prisma.audit_log.create({
        data: {
          table_name: data.table_name,
          record_id: data.record_id,
          action: data.action,
          old_values: data.old_values ? JSON.parse(JSON.stringify(data.old_values)) : undefined,
          new_values: data.new_values ? JSON.parse(JSON.stringify(data.new_values)) : undefined,
          user_id: data.user_id,
          user_name: data.user_name,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          level: data.level || AuditLevel.MEDIUM,
          description: data.description,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
          changed_at: new Date(),
        },
      });
    } catch (error) {
      // No lanzar error para evitar afectar la operación principal
    }
  }

  /**
   * Registra una operación CRUD básica
   */
  static async logCRUD(
    tableName: string,
    recordId: string,
    action: AuditAction.CREATE | AuditAction.UPDATE | AuditAction.DELETE,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    const session = await getServerSession(authOptions);
    const userContext = await this.getUserContext(request, session);

    await this.logEvent({
      table_name: tableName,
      record_id: recordId,
      action,
      old_values: oldValues,
      new_values: newValues,
      ...userContext,
      level: this.determineCriticalityLevel(tableName, action),
      description: this.generateDescription(tableName, action, oldValues, newValues),
    });
  }

  /**
   * Registra movimientos de inventario (entradas/salidas)
   */
  static async logInventoryMovement(
    movementType: 'ENTRADA' | 'SALIDA',
    movementId: string,
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      previousStock?: number;
      newStock?: number;
    }>,
    reason: string,
    request?: Request
  ): Promise<void> {
    const session = await getServerSession(authOptions);
    const userContext = await this.getUserContext(request, session);

    for (const item of items) {
      await this.logEvent({
        table_name: 'inventory_movements',
        record_id: `${movementType.toLowerCase()}_${movementId}_${item.productId}`,
        action: AuditAction.STOCK_MOVEMENT,
        old_values: item.previousStock !== undefined ? { stock: item.previousStock } : undefined,
        new_values: {
          stock: item.newStock,
          movement_type: movementType,
          quantity: item.quantity,
          reason,
        },
        ...userContext,
        level: AuditLevel.HIGH,
        description: `${movementType}: ${item.quantity} unidades de ${item.productName}. Motivo: ${reason}`,
        metadata: {
          movement_id: movementId,
          product_name: item.productName,
          movement_type: movementType,
        },
      });
    }
  }

  /**
   * Registra acceso denegado
   */
  static async logAccessDenied(resource: string, reason: string, request?: Request): Promise<void> {
    const session = await getServerSession(authOptions);
    const userContext = await this.getUserContext(request, session);

    await this.logEvent({
      table_name: 'security',
      record_id: `access_denied_${Date.now()}`,
      action: AuditAction.ACCESS_DENIED,
      new_values: {
        resource,
        reason,
        timestamp: new Date().toISOString(),
      },
      ...userContext,
      level: AuditLevel.HIGH,
      description: `Acceso denegado a ${resource}: ${reason}`,
    });
  }

  /**
   * Registra login/logout
   */
  static async logAuth(
    action: AuditAction.LOGIN | AuditAction.LOGOUT,
    userId: string,
    userName: string,
    success: boolean = true,
    request?: Request
  ): Promise<void> {
    const userContext = await this.getUserContext(request);

    await this.logEvent({
      table_name: 'auth',
      record_id: `${action.toLowerCase()}_${userId}_${Date.now()}`,
      action,
      new_values: {
        success,
        timestamp: new Date().toISOString(),
      },
      user_id: userId,
      user_name: userName,
      ...userContext,
      level: success ? AuditLevel.LOW : AuditLevel.HIGH,
      description: `${action} ${success ? 'exitoso' : 'fallido'} para ${userName}`,
    });
  }

  /**
   * Registra exportación de datos
   */
  static async logExport(
    tableName: string,
    filters: Record<string, unknown>,
    recordCount: number,
    request?: Request
  ): Promise<void> {
    const session = await getServerSession(authOptions);
    const userContext = await this.getUserContext(request, session);

    await this.logEvent({
      table_name: tableName,
      record_id: `export_${Date.now()}`,
      action: AuditAction.EXPORT,
      new_values: {
        filters,
        record_count: recordCount,
        timestamp: new Date().toISOString(),
      },
      ...userContext,
      level: AuditLevel.MEDIUM,
      description: `Exportación de ${recordCount} registros de ${tableName}`,
      metadata: { filters, record_count: recordCount },
    });
  }

  /**
   * Obtiene el contexto del usuario actual
   */
  private static async getUserContext(
    request?: Request,
    session?: { user?: { id: string; name?: string; email?: string } } | null
  ): Promise<{
    user_id?: string;
    user_name?: string;
    ip_address?: string;
    user_agent?: string;
  }> {
    const context: {
      user_id?: string;
      user_name?: string;
      ip_address?: string;
      user_agent?: string;
    } = {};

    // Si no se proporciona sesión, obtenerla
    if (!session) {
      session = await getServerSession(authOptions);
    }

    // Información de sesión
    if (session?.user) {
      context.user_id = session.user.id;
      context.user_name = session.user.name || session.user.email;
    }

    // Información de request
    if (request) {
      // IP Address
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = request.headers.get('x-real-ip') || forwarded?.split(',')[0] || 'unknown';
      context.ip_address = ip;

      // User Agent
      context.user_agent = request.headers.get('user-agent') || 'unknown';
    }

    return context;
  }

  /**
   * Establece el contexto de usuario para los triggers de base de datos
   */
  static async setDatabaseUserContext(userId?: string, userName?: string): Promise<boolean> {
    try {
      if (userId) {
        const result = await prisma.$queryRaw<
          [{ set_audit_user: string }]
        >`SELECT set_audit_user(${userId}, ${userName || 'Usuario Sin Nombre'})`;

        const resultMsg = result[0]?.set_audit_user || '';

        if (resultMsg.startsWith('SUCCESS:')) {
          return true;
        } else {
          return false;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Determina el nivel de criticidad basado en la tabla y acción
   */
  private static determineCriticalityLevel(tableName: string, action: AuditAction): AuditLevel {
    // Tablas críticas
    const criticalTables = ['User', 'rbac_roles', 'rbac_permissions', 'rbac_user_roles'];

    // Tablas importantes
    const importantTables = ['entradas_inventario', 'salidas_inventario', 'Inventario'];

    // Acciones críticas
    const criticalActions = [AuditAction.DELETE, AuditAction.ACCESS_DENIED];

    if (criticalTables.includes(tableName) || criticalActions.includes(action)) {
      return AuditLevel.CRITICAL;
    }

    if (importantTables.includes(tableName)) {
      return AuditLevel.HIGH;
    }

    if (action === AuditAction.CREATE || action === AuditAction.UPDATE) {
      return AuditLevel.MEDIUM;
    }

    return AuditLevel.LOW;
  }

  /**
   * Genera descripción automática del cambio
   */
  private static generateDescription(
    tableName: string,
    action: AuditAction,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): string {
    const tableNames: Record<string, string> = {
      User: 'Usuario',
      Inventario: 'Producto',
      clientes: 'Cliente',
      proveedores: 'Proveedor',
      entradas_inventario: 'Entrada de Inventario',
      salidas_inventario: 'Salida de Inventario',
      categorias: 'Categoría',
      ffijo: 'Fondo Fijo',
    };

    const actionNames: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'Creado',
      [AuditAction.UPDATE]: 'Actualizado',
      [AuditAction.DELETE]: 'Eliminado',
      [AuditAction.READ]: 'Consultado',
      [AuditAction.LOGIN]: 'Inicio de sesión',
      [AuditAction.LOGOUT]: 'Cierre de sesión',
      [AuditAction.ACCESS_DENIED]: 'Acceso denegado',
      [AuditAction.EXPORT]: 'Exportado',
      [AuditAction.BULK_UPDATE]: 'Actualización masiva',
      [AuditAction.RESTORE]: 'Restaurado',
      [AuditAction.ACTIVATE]: 'Activado',
      [AuditAction.DEACTIVATE]: 'Desactivado',
      [AuditAction.STOCK_MOVEMENT]: 'Movimiento de stock',
      [AuditAction.LOW_STOCK_ALERT]: 'Alerta de stock bajo',
    };

    const entityName = tableNames[tableName] || tableName;
    const actionName = actionNames[action] || action;

    let description = `${entityName} ${actionName}`;

    // Agregar detalles específicos para updates
    if (action === AuditAction.UPDATE && oldValues && newValues) {
      const changes = this.getChangedFields(oldValues, newValues);
      if (changes.length > 0) {
        description += `. Campos modificados: ${changes.join(', ')}`;
      }
    }

    return description;
  }

  /**
   * Obtiene los campos que cambiaron entre old_values y new_values
   */
  private static getChangedFields(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): string[] {
    const changes: string[] = [];

    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes.push(key);
      }
    }

    return changes;
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  static async getAuditStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    tableName?: string;
    userId?: string;
  }): Promise<{
    totalRecords: number;
    recordsByAction: Record<string, number>;
    recordsByTable: Record<string, number>;
    recordsByLevel: Record<string, number>;
    recordsByUser: Array<{ userId: string; userName: string; count: number }>;
    recordsToday: number;
    recordsThisWeek: number;
    recordsThisMonth: number;
  }> {
    const where: {
      changed_at?: { gte?: Date; lte?: Date };
      table_name?: string;
      user_id?: string;
    } = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.changed_at = {};
      if (filters.dateFrom) where.changed_at.gte = filters.dateFrom;
      if (filters.dateTo) where.changed_at.lte = filters.dateTo;
    }

    if (filters?.tableName) {
      where.table_name = filters.tableName;
    }

    if (filters?.userId) {
      where.user_id = filters.userId;
    }

    // Total de registros
    const totalRecords = await prisma.audit_log.count({ where });

    // Registros por acción
    const actionStats = await prisma.audit_log.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    const recordsByAction = actionStats.reduce(
      (acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      },
      {} as Record<string, number>
    );

    // Registros por tabla
    const tableStats = await prisma.audit_log.groupBy({
      by: ['table_name'],
      where,
      _count: { table_name: true },
    });

    const recordsByTable = tableStats.reduce(
      (acc, item) => {
        acc[item.table_name] = item._count.table_name;
        return acc;
      },
      {} as Record<string, number>
    );

    // Registros por nivel (si existe el campo)
    const recordsByLevel: Record<string, number> = {};

    // Registros por usuario
    const userStats = await prisma.audit_log.groupBy({
      by: ['user_id'],
      where: { ...where, user_id: { not: null } },
      _count: { id: true },
    });

    // Obtener nombres de usuario para las estadísticas
    const recordsByUser: Array<{ userId: string; userName: string; count: number }> = [];

    for (const stat of userStats) {
      if (stat.user_id) {
        // Obtener el nombre del usuario de un registro reciente
        const recentLog = await prisma.audit_log.findFirst({
          where: { user_id: stat.user_id },
          select: { user_name: true },
          orderBy: { changed_at: 'desc' },
        });

        recordsByUser.push({
          userId: stat.user_id,
          userName: recentLog?.user_name || 'Usuario desconocido',
          count: stat._count.id,
        });
      }
    }

    // Estadísticas temporales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recordsToday = await prisma.audit_log.count({
      where: { ...where, changed_at: { gte: today } },
    });

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recordsThisWeek = await prisma.audit_log.count({
      where: { ...where, changed_at: { gte: weekAgo } },
    });

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const recordsThisMonth = await prisma.audit_log.count({
      where: { ...where, changed_at: { gte: monthAgo } },
    });

    return {
      totalRecords,
      recordsByAction,
      recordsByTable,
      recordsByLevel,
      recordsByUser,
      recordsToday,
      recordsThisWeek,
      recordsThisMonth,
    };
  }
}

/**
 * Middleware para auditoría automática
 * Usar en APIs que necesiten auditoría transparente
 */
export function createAuditMiddleware<T = unknown>(tableName: string) {
  return {
    /**
     * Wrapper para operaciones CREATE
     */
    async onCreate(
      operation: () => Promise<T>,
      getRecordId: (result: T) => string,
      getNewValues: (result: T) => Record<string, unknown>,
      request?: Request
    ): Promise<T> {
      const result = await operation();

      await AuditSystem.logCRUD(
        tableName,
        getRecordId(result),
        AuditAction.CREATE,
        undefined,
        getNewValues(result),
        request
      );

      return result;
    },

    /**
     * Wrapper para operaciones UPDATE
     */
    async onUpdate(
      recordId: string,
      operation: () => Promise<T>,
      getOldValues: () => Promise<Record<string, unknown>>,
      getNewValues: (result: T) => Record<string, unknown>,
      request?: Request
    ): Promise<T> {
      const oldValues = await getOldValues();
      const result = await operation();

      await AuditSystem.logCRUD(
        tableName,
        recordId,
        AuditAction.UPDATE,
        oldValues,
        getNewValues(result),
        request
      );

      return result;
    },

    /**
     * Wrapper para operaciones DELETE
     */
    async onDelete(
      recordId: string,
      operation: () => Promise<T>,
      getOldValues: () => Promise<Record<string, unknown>>,
      request?: Request
    ): Promise<T> {
      const oldValues = await getOldValues();
      const result = await operation();

      await AuditSystem.logCRUD(
        tableName,
        recordId,
        AuditAction.DELETE,
        oldValues,
        undefined,
        request
      );

      return result;
    },
  };
}

export default AuditSystem;

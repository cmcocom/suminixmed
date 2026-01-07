/**
 * Servicio centralizado para operaciones comunes de base de datos
 * Elimina redundancias y mejora la mantenibilidad
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class DatabaseService {
  // Operaciones de Usuario usando stored procedures
  static async getUserStats() {
    // Usar la vista optimizada en lugar de múltiples queries
    const result = await prisma.$queryRaw`SELECT * FROM v_user_stats LIMIT 1`;
    return Array.isArray(result) ? result[0] : result;
  }

  static async getDashboardStats() {
    try {
      // Intentar usar stored procedure para estadísticas del dashboard
      const result = await prisma.$queryRaw`SELECT * FROM get_dashboard_stats()`;
      const data = Array.isArray(result) ? result[0] : result;

      // Convertir BigInt a Number para serialización JSON
      if (data) {
        return {
          total_users: Number(data.total_users || 0),
          active_users: Number(data.active_users || 0),
          total_products: Number(data.total_products || 0),
          low_stock_products: Number(data.low_stock_products || 0),
          total_categories: Number(data.total_categories || 0),
          active_categories: Number(data.active_categories || 0),
          total_clients: Number(data.total_clients || 0),
          active_clients: Number(data.active_clients || 0),
          concurrent_users: Number(data.concurrent_users || 0),
        };
      }

      throw new Error('No data returned from get_dashboard_stats()');
    } catch (error) {
      void error;
      // Fallback: usar cálculo manual

      // Fallback: calcular estadísticas manualmente
      const [
        totalUsers,
        activeUsers,
        totalProducts,
        lowStockProducts,
        totalCategories,
        activeCategories,
        totalClients,
        activeClients,
        concurrentUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { activo: true } }),
        prisma.inventario.count(),
        prisma.inventario.count({ where: { cantidad: { lte: 10 } } }),
        prisma.categorias.count(),
        prisma.categorias.count({ where: { activo: true } }),
        prisma.clientes.count(),
        prisma.clientes.count({ where: { activo: true } }),
        prisma.active_sessions.count({
          where: {
            lastActivity: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Última hora
            },
          },
        }),
      ]);

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        total_categories: totalCategories,
        active_categories: activeCategories,
        total_clients: totalClients,
        active_clients: activeClients,
        concurrent_users: concurrentUsers,
      };
    }
  }

  static async getActiveEntity() {
    return prisma.entidades.findFirst({
      where: { estatus: 'activo' },
      select: {
        id_empresa: true,
        nombre: true,
        licencia_usuarios_max: true,
        tiempo_sesion_minutos: true,
      },
    });
  }

  // Operaciones de Inventario
  static async getInventoryStats() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, lowStock, outOfStock, nearExpiry, expiringSoon] = await Promise.all([
      prisma.inventario.count(),
      prisma.inventario.count({ where: { cantidad: { lte: 10 } } }),
      prisma.inventario.count({ where: { cantidad: 0 } }),
      prisma.inventario.count({
        where: {
          fechaVencimiento: { lte: now },
        },
      }),
      prisma.inventario.count({
        where: {
          fechaVencimiento: {
            gte: now,
            lte: nextWeek,
          },
        },
      }),
    ]);

    return {
      total,
      lowStock,
      outOfStock,
      nearExpiry,
      expiringSoon,
    };
  }

  static async getTopProducts(limit = 10) {
    return prisma.inventario.findMany({
      select: {
        id: true,
        descripcion: true,
        cantidad: true,
        categoria: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  // Operaciones de Categorías
  static async getCategoryStats() {
    const [total, active] = await Promise.all([
      prisma.categorias.count(),
      prisma.categorias.count({ where: { activo: true } }),
    ]);

    return { total, active, inactive: total - active };
  }

  static async getCategoriesWithInventoryCount() {
    return prisma.categorias.findMany({
      include: {
        _count: {
          select: { Inventario: true },
        },
      },
      orderBy: {
        Inventario: {
          _count: 'desc',
        },
      },
    });
  }

  // Operaciones de Clientes
  static async getClientStats() {
    const [total, active] = await Promise.all([
      prisma.clientes.count(),
      prisma.clientes.count({ where: { activo: true } }),
    ]);

    return { total, active, inactive: total - active };
  }

  // Operaciones de Fondos Fijos
  static async getFondoFijoStats() {
    const [total, lowStock] = await Promise.all([
      prisma.ffijo.count(),
      prisma.ffijo.count({
        where: {
          cantidad_disponible: {
            lte: prisma.ffijo.fields.cantidad_minima,
          },
        },
      }),
    ]);

    return { total, lowStock };
  }

  // Operaciones de Sesiones usando stored procedures
  static async updateUserActivity(
    userId: string,
    activityData: {
      lastActivity: Date;
      tabId: string;
      userAgent?: string;
    }
  ) {
    const { lastActivity, tabId } = activityData;

    // Usar stored procedure optimizado para heartbeat
    await prisma.$queryRaw`
      SELECT update_session_heartbeat(${userId}, ${tabId}, ${lastActivity.toISOString()}::timestamptz)
    `;
  }

  static async cleanupExpiredSessions(timeoutMinutes = 35) {
    // Usar stored procedure para limpieza de sesiones
    const result = await prisma.$queryRaw`
      SELECT cleanup_expired_sessions(${timeoutMinutes}) as deleted_count
    `;
    return Array.isArray(result) ? result[0] : result;
  }

  static async cleanupUserSession(userId: string) {
    return await prisma.active_sessions.deleteMany({
      where: { userId },
    });
  }

  static async cleanupSessionByTabId(tabId: string) {
    return await prisma.active_sessions.deleteMany({
      where: {
        tabId,
      },
    });
  }

  static async getUserSessions(userId: string) {
    return await prisma.active_sessions.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
    });
  }

  static async getActiveSessionsCount() {
    return prisma.active_sessions.count();
  }

  static async getUserActiveSessions(userId: string) {
    return prisma.active_sessions.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
    });
  }

  // Operaciones de Auditoría
  static async logAuditEvent(
    tableName: string,
    recordId: string,
    action: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ) {
    return prisma.audit_log.create({
      data: {
        table_name: tableName,
        record_id: recordId,
        action,
        old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
        new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
      },
    });
  }

  static async getAuditLogs(tableName?: string, recordId?: string, limit = 50) {
    const where: Prisma.audit_logWhereInput = {};

    if (tableName) where.table_name = tableName;
    if (recordId) where.record_id = recordId;

    return prisma.audit_log.findMany({
      where,
      orderBy: { changed_at: 'desc' },
      take: limit,
    });
  }

  // Operaciones de paginación
  static createPaginationOptions(page = 1, limit = 10, orderBy?: Record<string, unknown>) {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
      ...(orderBy && { orderBy }),
    };
  }
}

export default DatabaseService;

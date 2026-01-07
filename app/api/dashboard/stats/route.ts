import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DatabaseService } from '@/lib/database.service';
import { withErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { getActiveSessions } from '@/lib/sessionTracker';
import { CachePrefix, CacheTTL, getOrCompute } from '@/lib/cache';
import { logger } from '@/lib/logger';

// GET /api/dashboard/stats - Obtener estadísticas del dashboard optimizado con caché
async function getDashboardStats() {
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Usar caché para estadísticas del dashboard (TTL: 5 minutos)
  // Esto reduce 9 count() queries a 1 lookup de caché
  const dashboardStats = await getOrCompute(
    CachePrefix.DASHBOARD_STATS,
    async () => {
      logger.debug('[DASHBOARD] Calculando estadísticas (caché miss)...');

      // Usar stored procedure optimizado para estadísticas principales (con fallback)
      try {
        return await DatabaseService.getDashboardStats();
      } catch (error) {
        logger.error('[DASHBOARD] Error en stored procedure, usando fallback:', error);

        // Fallback: usar consultas directas con manejo de errores
        try {
          return {
            total_users: await prisma.user.count(),
            active_users: await prisma.user.count({ where: { activo: true } }),
            inactive_users: await prisma.user.count({ where: { activo: false } }),
            total_inventory: await prisma.inventario.count(),
            low_stock_items: await prisma.inventario.count({ where: { cantidad: { lte: 10 } } }),
            total_categories: await prisma.categorias.count(),
            active_categories: await prisma.categorias.count({ where: { activo: true } }),
            total_clients: await prisma.clientes.count({ where: { activo: true } }),
            active_sessions_count: await prisma.active_sessions.count({
              where: { lastActivity: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
            }),
            today_logins: 0, // Temporal
          };
        } catch (fallbackError) {
          logger.error('[DASHBOARD] Error en fallback, usando valores por defecto:', fallbackError);

          // Valores por defecto si las consultas fallan
          return {
            total_users: 0,
            active_users: 0,
            inactive_users: 0,
            total_inventory: 0,
            low_stock_items: 0,
            total_categories: 0,
            active_categories: 0,
            total_clients: 0,
            active_sessions_count: 0,
            today_logins: 0,
          };
        }
      }
    },
    CacheTTL.MEDIUM // 5 minutos
  );

  // Obtener datos complementarios en paralelo
  const [entidadActiva, userSessions, topProducts, categoriesWithCount] = await Promise.all([
    DatabaseService.getActiveEntity(),
    DatabaseService.getUserSessions(session.user.id),
    DatabaseService.getTopProducts(5),
    DatabaseService.getCategoriesWithInventoryCount().catch((err) => {
      logger.error('Error en getCategoriesWithInventoryCount:', err);
      return [];
    }),
  ]);

  // Obtener información de usuarios concurrentes usando la nueva función
  const activeSessions = await getActiveSessions();
  const concurrentUsersMap = new Map();

  activeSessions.forEach((session) => {
    concurrentUsersMap.set(session.userId, session.User);
  });

  const currentConcurrentUsers = concurrentUsersMap.size;

  // Cálculos adicionales optimizados
  const maxConcurrentUsers = entidadActiva?.licencia_usuarios_max || 5;
  const availableSlots = Math.max(0, maxConcurrentUsers - currentConcurrentUsers);
  const licenseUsagePercentage = entidadActiva
    ? Math.round((currentConcurrentUsers / maxConcurrentUsers) * 100)
    : 0;

  // Manejar nombres de campos diferentes entre stored procedure y fallback
  const lowStockItems =
    (dashboardStats as any).low_stock_items || (dashboardStats as any).low_stock_products || 0;
  const totalInventory =
    (dashboardStats as any).total_inventory || (dashboardStats as any).total_products || 0;
  const inactiveUsers =
    (dashboardStats as any).inactive_users ||
    dashboardStats.total_users - dashboardStats.active_users ||
    0;
  const activeClients = (dashboardStats as any).active_clients || dashboardStats.total_clients || 0;
  const activeSessionsCount =
    (dashboardStats as any).active_sessions_count || (dashboardStats as any).active_sessions || 0;
  const todayLogins = (dashboardStats as any).today_logins || 0;

  const stockAlerts = lowStockItems;

  const stats = {
    // Resumen general usando stored procedure o fallback
    overview: {
      totalUsers: dashboardStats.total_users || 0,
      activeUsers: dashboardStats.active_users || 0,
      inactiveUsers,
      totalProducts: totalInventory,
      totalCategories: dashboardStats.total_categories || 0,
      totalClients: dashboardStats.total_clients || 0,
      totalFondosFijos: 0, // Mantener compatibilidad
      concurrentUsers: currentConcurrentUsers, // Usuarios conectados actualmente
    },

    // Licencias y usuarios concurrentes
    licenses: {
      maxUsers: entidadActiva?.licencia_usuarios_max || 0,
      activeUsers: currentConcurrentUsers, // Cambiado a usuarios concurrentes
      availableSlots: availableSlots,
      usagePercentage: licenseUsagePercentage,
      sessionTimeout: entidadActiva?.tiempo_sesion_minutos || 30,
    },

    // Inventario optimizado
    inventory: {
      totalProducts: totalInventory,
      lowStockProducts: lowStockItems,
      outOfStockProducts: 0, // Calculado en las vistas
      stockAlerts,
    },

    // Categorías
    categories: {
      total: dashboardStats.total_categories || 0,
      active: dashboardStats.active_categories || 0,
      topCategories:
        categoriesWithCount?.slice(0, 5).map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
          productCount: 0, // Simplificado por ahora
        })) || [],
    },

    // Clientes
    clients: {
      total: dashboardStats.total_clients || 0,
      active: activeClients,
    },

    // Sesiones activas optimizadas
    sessions: {
      active: activeSessionsCount,
      user: userSessions?.length || 0,
      todayLogins,
    },

    // Entidad
    entity: {
      name: entidadActiva?.nombre || 'Sin configurar',
      isConfigured: !!entidadActiva,
    },

    // Productos destacados
    topProducts:
      topProducts?.map((product) => ({
        id: product.id,
        nombre: product.descripcion,
        cantidad: product.cantidad,
        categoria: product.categoria,
      })) || [],

    // Estado del sistema optimizado
    systemHealth: {
      alertsCount: stockAlerts,
      hasAlerts: stockAlerts > 0,
      licenseStatus:
        licenseUsagePercentage > 90 ? 'critical' : licenseUsagePercentage > 70 ? 'warning' : 'good',
      performance: 'optimized_with_stored_procedures',
    },

    // Metadata de optimización
    meta: {
      dataSource: 'stored_procedures_and_views',
      lastUpdated: new Date().toISOString(),
      optimized: true,
      cached: true,
      cacheTTL: CacheTTL.MEDIUM,
    },
  };

  return NextResponse.json(stats);
}

export const GET = withErrorHandler(getDashboardStats);

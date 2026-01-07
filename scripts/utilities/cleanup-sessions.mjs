import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Script para limpiar sesiones expiradas automáticamente
 * Este script debe ejecutarse periódicamente (cada 5-10 minutos)
 */
async function cleanupExpiredSessions() {
  try {
    console.log('🧹 Iniciando limpieza de sesiones expiradas...');

    // Obtener configuración de timeout de la entidad
    const entidad = await prisma.entidad.findFirst({
      where: { estatus: 'activo' },
      select: {
        tiempo_sesion_minutos: true,
      },
    });

    const sessionTimeoutMinutes = entidad?.tiempo_sesion_minutos || 30;
    const cutoffTime = new Date(Date.now() - sessionTimeoutMinutes * 60 * 1000);

    console.log(`⏰ Timeout configurado: ${sessionTimeoutMinutes} minutos`);
    console.log(`📅 Limpiando sesiones anteriores a: ${cutoffTime.toISOString()}`);

    // Contar sesiones que se van a eliminar
    const sessionsToDelete = await prisma.activeSession.count({
      where: {
        lastActivity: {
          lt: cutoffTime,
        },
      },
    });

    if (sessionsToDelete === 0) {
      console.log('✅ No hay sesiones expiradas que limpiar');
      return;
    }

    // Eliminar sesiones expiradas
    const deleteResult = await prisma.activeSession.deleteMany({
      where: {
        lastActivity: {
          lt: cutoffTime,
        },
      },
    });

    console.log(`🗑️  Sesiones eliminadas: ${deleteResult.count}`);

    // Mostrar estadísticas actuales
    const remainingSessions = await prisma.activeSession.count();
    const activeUsers = await prisma.activeSession.groupBy({
      by: ['userId'],
    });

    console.log('📊 Estadísticas actuales:');
    console.log(`   - Sesiones activas: ${remainingSessions}`);
    console.log(`   - Usuarios únicos conectados: ${activeUsers.length}`);

    // Verificar si hay usuarios que exceden el límite
    const entidadActual = await prisma.entidad.findFirst({
      where: { estatus: 'activo' },
      select: {
        licencia_usuarios_max: true,
      },
    });

    const maxUsers = entidadActual?.licencia_usuarios_max || 0;
    if (activeUsers.length > maxUsers) {
      console.log(`⚠️  ADVERTENCIA: ${activeUsers.length} usuarios conectados superan el límite de ${maxUsers}`);
    }

    console.log('✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar función principal
cleanupExpiredSessions();

export { cleanupExpiredSessions };

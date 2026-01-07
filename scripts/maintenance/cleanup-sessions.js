/**
 * Script para limpiar todas las sesiones activas y hacer pruebas limpias
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAllSessions() {
  console.log('🧹 [CLEANUP] Limpiando todas las sesiones activas...');
  
  try {
    const deleted = await prisma.activeSession.deleteMany({});
    console.log(`✅ [CLEANUP] ${deleted.count} sesiones eliminadas`);
    
    // Verificar que no hay sesiones
    const remaining = await prisma.activeSession.count();
    console.log(`📊 [CLEANUP] Sesiones restantes: ${remaining}`);
    
  } catch (error) {
    console.error('❌ [CLEANUP] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllSessions();
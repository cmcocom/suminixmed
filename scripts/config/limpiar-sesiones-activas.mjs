#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function limpiarSesionesActivas() {
  try {
    console.log('\n🔄 LIMPIANDO TODAS LAS SESIONES ACTIVAS\n');
    console.log('═'.repeat(80));
    
    // 1. Verificar sesiones actuales antes de limpiar
    const sesionesAntes = await prisma.$queryRaw`
      SELECT 
        u.clave,
        u.name,
        u.email,
        COUNT(*) as sesiones_activas
      FROM active_sessions s
      JOIN "User" u ON s."userId" = u.id
      WHERE s."lastActivity" > NOW() - INTERVAL '35 minutes'
      GROUP BY u.clave, u.name, u.email
      ORDER BY sesiones_activas DESC;
    `;

    console.log('\n📊 SESIONES ACTIVAS ANTES DE LIMPIAR:\n');
    if (sesionesAntes.length > 0) {
      sesionesAntes.forEach((sesion, index) => {
        console.log(`${index + 1}. ${sesion.name} (${sesion.clave})`);
        console.log(`   Email: ${sesion.email}`);
        console.log(`   Sesiones activas: ${Number(sesion.sesiones_activas)}`);
        console.log('');
      });
      
      const totalSesiones = sesionesAntes.reduce((sum, s) => sum + Number(s.sesiones_activas), 0);
      console.log(`Total de sesiones activas: ${totalSesiones}`);
    } else {
      console.log('No hay sesiones activas');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n🧹 ELIMINANDO TODAS LAS SESIONES...\n');

    // 2. Eliminar TODAS las sesiones activas
    const resultado = await prisma.active_sessions.deleteMany({});
    
    console.log(`✅ ${resultado.count} sesiones eliminadas exitosamente`);

    // 3. Verificar que no queden sesiones
    const sesionesRestantes = await prisma.active_sessions.count();
    
    console.log(`\n📊 Sesiones restantes: ${sesionesRestantes}`);

    // 4. También limpiar sesiones de NextAuth que puedan estar obsoletas
    const sesionesNextAuthAntiguas = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });

    console.log(`✅ ${sesionesNextAuthAntiguas.count} sesiones de NextAuth expiradas eliminadas`);

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ LIMPIEZA COMPLETADA\n');
    console.log('Todos los usuarios pueden iniciar sesión nuevamente');
    console.log('El contador de sesiones concurrentes se ha reiniciado a 0');
    console.log('\n🎯 LÍMITES CONFIGURADOS:');
    console.log('   - Usuario 888963: 3 sesiones concurrentes');
    console.log('   - Otros usuarios: 1 sesión concurrente (límite global)');
    console.log('   - Límite máximo del sistema: 25 usuarios concurrentes');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarSesionesActivas();

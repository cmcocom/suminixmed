/**
 * Script para actualizar el tiempo de sesión a 45 minutos
 * Este script actualiza la entidad activa con el nuevo valor de tiempo de sesión
 */

import { prisma } from '../lib/prisma';

async function updateSessionTimeout() {
  try {
    console.log('🔍 Buscando entidad activa...');
    
    // Obtener entidad activa
    const entidadActiva = await prisma.entidades.findFirst({
      where: {
        estatus: 'activo'
      }
    });

    if (!entidadActiva) {
      console.error('❌ No se encontró una entidad activa');
      process.exit(1);
    }

    console.log(`📊 Entidad encontrada: ${entidadActiva.nombre}`);
    console.log(`⏱️  Tiempo de sesión actual: ${entidadActiva.tiempo_sesion_minutos} minutos`);

    // Actualizar a 45 minutos
    const updated = await prisma.entidades.update({
      where: {
        id_empresa: entidadActiva.id_empresa
      },
      data: {
        tiempo_sesion_minutos: 45
      }
    });

    console.log(`✅ Tiempo de sesión actualizado a: ${updated.tiempo_sesion_minutos} minutos`);
    console.log('✨ Actualización completada exitosamente');

  } catch (error) {
    console.error('❌ Error actualizando el tiempo de sesión:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateSessionTimeout();

#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function removeDesarrolladorRole() {
  try {
    console.log('🗑️ ELIMINACIÓN SEGURA DEL ROL DESARROLLADOR');
    console.log('=' * 60);
    
    // 1. Verificar estado actual
    console.log('\n1️⃣ VERIFICACIÓN PREVIA:');
    
    const desarrolladorRole = await prisma.rbac_roles.findUnique({
      where: { name: 'DESARROLLADOR' }
    });
    
    if (!desarrolladorRole) {
      console.log('❌ El rol DESARROLLADOR no existe');
      return;
    }
    
    console.log('✅ Rol DESARROLLADOR encontrado:');
    console.log(`   • ID: ${desarrolladorRole.id}`);
    console.log(`   • Descripción: ${desarrolladorRole.description}`);
    
    // 2. Verificar usuarios asignados
    console.log('\n2️⃣ VERIFICANDO USUARIOS ASIGNADOS:');
    
    const usuariosDesarrollador = await prisma.$queryRaw`
      SELECT u.clave, u.name, u.activo
      FROM "User" u
      JOIN rbac_user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ${desarrolladorRole.id};
    `;
    
    if (Array.isArray(usuariosDesarrollador) && usuariosDesarrollador.length > 0) {
      console.log(`⚠️ ATENCIÓN: ${usuariosDesarrollador.length} usuarios tienen rol DESARROLLADOR:`);
      usuariosDesarrollador.forEach(u => {
        console.log(`   • ${u.clave} (${u.name}) - Activo: ${u.activo}`);
      });
      
      console.log('\n❌ NO SE PUEDE ELIMINAR: Hay usuarios asignados');
      console.log('   Opciones:');
      console.log('   1. Reasignar usuarios a rol UNIDADC');
      console.log('   2. Eliminar asignaciones de usuarios');
      console.log('   3. Cancelar operación');
      return;
    } else {
      console.log('✅ No hay usuarios asignados al rol DESARROLLADOR');
    }
    
    // 3. Verificar permisos asignados
    console.log('\n3️⃣ VERIFICANDO PERMISOS ASIGNADOS:');
    
    const permisosCount = await prisma.rbac_role_permissions.count({
      where: { role_id: desarrolladorRole.id }
    });
    
    console.log(`📊 ${permisosCount} permisos asignados al rol DESARROLLADOR`);
    
    // 4. Verificar configuración de visibilidad
    console.log('\n4️⃣ VERIFICANDO CONFIGURACIÓN DE VISIBILIDAD:');
    
    const visibilidadCount = await prisma.rbac_module_visibility.count({
      where: { role_id: desarrolladorRole.id }
    });
    
    console.log(`👁️ ${visibilidadCount} configuraciones de visibilidad`);
    
    // 5. PROCEDER CON ELIMINACIÓN
    console.log('\n5️⃣ PROCEDIENDO CON ELIMINACIÓN SEGURA...');
    
    // Eliminar permisos del rol
    console.log('🔄 Eliminando permisos asignados...');
    const permisosEliminados = await prisma.rbac_role_permissions.deleteMany({
      where: { role_id: desarrolladorRole.id }
    });
    console.log(`   ✅ ${permisosEliminados.count} permisos eliminados`);
    
    // Eliminar configuración de visibilidad
    console.log('🔄 Eliminando configuración de visibilidad...');
    const visibilidadEliminada = await prisma.rbac_module_visibility.deleteMany({
      where: { role_id: desarrolladorRole.id }
    });
    console.log(`   ✅ ${visibilidadEliminada.count} configuraciones eliminadas`);
    
    // Eliminar el rol
    console.log('🔄 Eliminando rol DESARROLLADOR...');
    await prisma.rbac_roles.delete({
      where: { id: desarrolladorRole.id }
    });
    console.log('   ✅ Rol DESARROLLADOR eliminado exitosamente');
    
    // 6. Verificación final
    console.log('\n6️⃣ VERIFICACIÓN FINAL:');
    
    const rolesRestantes = await prisma.rbac_roles.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('📋 ROLES RESTANTES EN EL SISTEMA:');
    rolesRestantes.forEach(role => {
      const tipoRol = role.is_system_role ? '🔧 SISTEMA' : '👤 NORMAL';
      console.log(`   • ${role.name} - ${tipoRol} - ${role.description}`);
    });
    
    // Verificar que UNIDADC sigue existiendo
    const unidacdExists = rolesRestantes.some(r => r.name === 'UNIDADC');
    if (unidacdExists) {
      console.log('\n✅ PERFECTO: Rol UNIDADC mantiene funcionalidad completa');
    } else {
      console.log('\n❌ ERROR: Rol UNIDADC no encontrado - PROBLEMA CRÍTICO');
    }
    
    console.log('\n🎉 ELIMINACIÓN COMPLETADA EXITOSAMENTE');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('  1. Actualizar referencias en código');
    console.log('  2. Verificar funciones que mencionan DESARROLLADOR');
    console.log('  3. Probar sistema completo');
    
  } catch (error) {
    console.error('❌ Error en eliminación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDesarrolladorRole();
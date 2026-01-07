#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado actual de la base de datos...\n');
    
    // Verificar roles
    const roles = await prisma.rbac_roles.findMany();
    console.log(`📊 Roles encontrados: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.is_system_role ? 'SISTEMA' : 'NORMAL'})`);
    });
    
    // Verificar permisos
    const permissions = await prisma.rbac_permissions.findMany();
    console.log(`\n📊 Permisos encontrados: ${permissions.length}`);
    
    // Verificar relaciones rol-permiso
    const rolePermissions = await prisma.rbac_role_permissions.findMany();
    console.log(`📊 Asignaciones rol-permiso: ${rolePermissions.length}`);
    
    // Verificar nueva tabla de visibilidad
    const visibility = await prisma.rbac_module_visibility.findMany();
    console.log(`📊 Configuraciones de visibilidad: ${visibility.length}`);
    
    // Verificar usuarios (usando campos correctos del schema)
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    console.log(`\n👥 Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name || 'Sin nombre'} (${user.email})`);
    });
    
    if (roles.length === 0) {
      console.log('\n⚠️  BASE DE DATOS VACÍA - Necesita poblarse con datos iniciales');
    } else {
      console.log('\n✅ Base de datos tiene datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
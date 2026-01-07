#!/usr/bin/env node

import pkg from '@prisma/client';
import { randomUUID } from 'crypto';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Módulos del sistema (sincronizado con rbac-modules.ts)
const ALL_MODULES = [
  // Principales (10)
  'DASHBOARD', 'SOLICITUDES', 'SURTIDO', 'ENTRADAS', 'SALIDAS', 
  'REPORTES', 'STOCK_FIJO', 'INVENTARIOS_FISICOS', 'CATALOGOS', 'AJUSTES',
  
  // Reportes (3)
  'REPORTES_INVENTARIO', 'REPORTES_ENTRADAS_CLIENTE', 'REPORTES_SALIDAS_CLIENTE',
  
  // Catálogos (8)
  'CATALOGOS_PRODUCTOS', 'CATALOGOS_CATEGORIAS', 'CATALOGOS_CLIENTES',
  'CATALOGOS_PROVEEDORES', 'CATALOGOS_EMPLEADOS', 'CATALOGOS_TIPOS_ENTRADA',
  'CATALOGOS_TIPOS_SALIDA', 'CATALOGOS_ALMACENES',
  
  // Ajustes (7)
  'AJUSTES_USUARIOS', 'AJUSTES_RBAC', 'AJUSTES_AUDITORIA',
  'GESTION_CATALOGOS', 'GESTION_REPORTES', 'AJUSTES_ENTIDAD', 'GESTION_RESPALDOS',
  
  // Backend (1)
  'INVENTARIO'
];

const ACCIONES = ['LEER', 'CREAR', 'EDITAR', 'ELIMINAR', 'ADMINISTRAR'];

async function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('es-MX');
  const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function seedRoles() {
  await log('👑 Creando roles del sistema...');
  
  const roles = [
    {
      id: randomUUID(),
      name: 'ADMINISTRADOR',
      description: 'Acceso completo al sistema excepto configuración de sistema',
      is_system_role: false,
      created_by: 'SEED_SCRIPT'
    },
    {
      id: randomUUID(), 
      name: 'OPERADOR',
      description: 'Acceso a operaciones básicas y consultas',
      is_system_role: false,
      created_by: 'SEED_SCRIPT'
    },
    {
      id: randomUUID(),
      name: 'DESARROLLADOR',
      description: 'Acceso total del sistema (rol de sistema)',
      is_system_role: true,
      created_by: 'SEED_SCRIPT'
    }
  ];
  
  for (const role of roles) {
    await prisma.rbac_roles.create({ data: role });
    await log(`   - Rol creado: ${role.name}`);
  }
  
  await log(`✅ ${roles.length} roles creados`, 'SUCCESS');
  return roles;
}

async function seedPermissions() {
  await log('🔑 Creando permisos del sistema...');
  
  const permissions = [];
  
  for (const moduleKey of ALL_MODULES) {
    for (const action of ACCIONES) {
      const permission = {
        id: randomUUID(),
        name: `${moduleKey}.${action}`,
        description: `${action} en módulo ${moduleKey}`,
        module: moduleKey,
        action: action,
        is_active: true,
        created_by: 'SEED_SCRIPT'
      };
      
      permissions.push(permission);
      await prisma.rbac_permissions.create({ data: permission });
    }
  }
  
  await log(`✅ ${permissions.length} permisos creados (${ALL_MODULES.length} módulos × ${ACCIONES.length} acciones)`, 'SUCCESS');
  return permissions;
}

async function seedRolePermissions(roles, permissions) {
  await log('🔗 Asignando permisos a roles...');
  
  let assignmentCount = 0;
  
  // DESARROLLADOR: Todos los permisos (por ser rol de sistema)
  const devRole = roles.find(r => r.name === 'DESARROLLADOR');
  
  // ADMINISTRADOR: Todos los permisos excepto algunos de sistema
  const adminRole = roles.find(r => r.name === 'ADMINISTRADOR');
  
  // OPERADOR: Solo permisos básicos
  const operRole = roles.find(r => r.name === 'OPERADOR');
  
  for (const permission of permissions) {
    // ✅ NUEVA ARQUITECTURA: TODOS los roles tienen TODOS los permisos (granted=true)
    const roleAssignments = [
      { roleId: devRole.id, roleName: 'DESARROLLADOR' },
      { roleId: adminRole.id, roleName: 'ADMINISTRADOR' },
      { roleId: operRole.id, roleName: 'OPERADOR' }
    ];
    
    for (const assignment of roleAssignments) {
      await prisma.rbac_role_permissions.create({
        data: {
          id: randomUUID(),
          role_id: assignment.roleId,
          permission_id: permission.id,
          granted: true,  // ✅ SIEMPRE TRUE en nueva arquitectura
          granted_by: 'SEED_SCRIPT',
          granted_at: new Date()
        }
      });
      
      assignmentCount++;
    }
  }
  
  await log(`✅ ${assignmentCount} asignaciones de permisos creadas (TODOS granted=true)`, 'SUCCESS');
}

async function seedModuleVisibility(roles) {
  await log('👁️ Configurando visibilidad de módulos...');
  
  let visibilityCount = 0;
  
  const devRole = roles.find(r => r.name === 'DESARROLLADOR');
  const adminRole = roles.find(r => r.name === 'ADMINISTRADOR');
  const operRole = roles.find(r => r.name === 'OPERADOR');
  
  // Configuración de visibilidad por rol
  const visibilityConfig = {
    [devRole.id]: ALL_MODULES, // DESARROLLADOR ve TODO
    [adminRole.id]: ALL_MODULES, // ADMINISTRADOR ve TODO
    [operRole.id]: [
      // OPERADOR ve solo módulos básicos por defecto
      'DASHBOARD', 'ENTRADAS', 'SALIDAS', 'INVENTARIOS_FISICOS',
      'CATALOGOS_PRODUCTOS', 'CATALOGOS_CLIENTES', 'REPORTES_INVENTARIO'
    ]
  };
  
  for (const [roleId, visibleModules] of Object.entries(visibilityConfig)) {
    const role = roles.find(r => r.id === roleId);
    
    for (const moduleKey of ALL_MODULES) {
      const isVisible = visibleModules.includes(moduleKey);
      
      await prisma.rbac_module_visibility.create({
        data: {
          id: randomUUID(),
          role_id: roleId,
          module_key: moduleKey,
          is_visible: isVisible,
          created_by: 'SEED_SCRIPT'
        }
      });
      
      visibilityCount++;
    }
    
    await log(`   - ${role.name}: ${visibleModules.length}/${ALL_MODULES.length} módulos visibles`);
  }
  
  await log(`✅ ${visibilityCount} configuraciones de visibilidad creadas`, 'SUCCESS');
}

async function createTestUser() {
  await log('👤 Creando usuario de prueba...');
  
  const testUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: 'Admin Test',
      email: 'admin@test.com',
      clave: 'admin001',
      password: null, // Se configurará después
      activo: true,
      is_system_user: false
    }
  });
  
  // Asignar rol ADMINISTRADOR al usuario de prueba
  const adminRole = await prisma.rbac_roles.findUnique({
    where: { name: 'ADMINISTRADOR' }
  });
  
  await prisma.rbac_user_roles.create({
    data: {
      id: randomUUID(),
      user_id: testUser.id,
      role_id: adminRole.id,
      assigned_by: 'SEED_SCRIPT',
      assigned_at: new Date()
    }
  });
  
  await log(`✅ Usuario de prueba creado: ${testUser.email} (rol: ADMINISTRADOR)`, 'SUCCESS');
  return testUser;
}

async function main() {
  try {
    await log('🚀 INICIANDO POBLADO INICIAL DE BASE DE DATOS RBAC V2');
    await log('=' * 60);
    
    // Verificar si ya hay datos
    const existingRoles = await prisma.rbac_roles.count();
    if (existingRoles > 0) {
      await log('⚠️ La base de datos ya tiene datos. Abortando...', 'ERROR');
      return;
    }
    
    // Crear datos iniciales
    const roles = await seedRoles();
    const permissions = await seedPermissions();
    await seedRolePermissions(roles, permissions);
    await seedModuleVisibility(roles);
    await createTestUser();
    
    // Verificación final
    await log('\n🔍 VERIFICACIÓN FINAL:');
    const finalStats = {
      roles: await prisma.rbac_roles.count(),
      permissions: await prisma.rbac_permissions.count(),
      rolePermissions: await prisma.rbac_role_permissions.count(),
      moduleVisibility: await prisma.rbac_module_visibility.count(),
      users: await prisma.user.count()
    };
    
    await log(`   - Roles: ${finalStats.roles}`);
    await log(`   - Permisos: ${finalStats.permissions}`);
    await log(`   - Asignaciones rol-permiso: ${finalStats.rolePermissions}`);
    await log(`   - Configuraciones visibilidad: ${finalStats.moduleVisibility}`);
    await log(`   - Usuarios: ${finalStats.users}`);
    
    await log('\n🎉 POBLADO INICIAL COMPLETADO EXITOSAMENTE', 'SUCCESS');
    await log('\n📋 PRÓXIMOS PASOS:');
    await log('  1. Actualizar frontend para usar nuevas APIs');
    await log('  2. Probar toggles de visibilidad');
    await log('  3. Validar que dependencias NO se rompan');
    
  } catch (error) {
    await log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
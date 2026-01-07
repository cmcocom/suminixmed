#!/usr/bin/env node

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUNIDACDRoleAndUser() {
  try {
    console.log('🚀 CREANDO ROL UNIDADC Y USUARIO 888963');
    console.log('=' * 60);
    
    // 1. Crear rol UNIDADC
    console.log('\n1️⃣ CREANDO ROL UNIDADC:');
    
    let unidacdRole;
    const existingRole = await prisma.rbac_roles.findUnique({
      where: { name: 'UNIDADC' }
    });
    
    if (existingRole) {
      console.log('⚠️ El rol UNIDADC ya existe');
      unidacdRole = existingRole;
    } else {
      unidacdRole = await prisma.rbac_roles.create({
        data: {
          id: randomUUID(),
          name: 'UNIDADC',
          description: 'Rol de sistema UNIDADC con acceso completo',
          is_system_role: true, // ROL DE SISTEMA
          created_by: 'UNIDADC_CREATION_SCRIPT'
        }
      });
      console.log('✅ Rol UNIDADC creado exitosamente');
    }
    
    console.log(`   • ID: ${unidacdRole.id}`);
    console.log(`   • Nombre: ${unidacdRole.name}`);
    console.log(`   • Es rol de sistema: ${unidacdRole.is_system_role}`);
    
    // 2. Asignar 100% de permisos al rol UNIDADC
    console.log('\n2️⃣ ASIGNANDO 100% DE PERMISOS AL ROL UNIDADC:');
    
    const allPermissions = await prisma.rbac_permissions.findMany();
    console.log(`   📊 Total permisos en sistema: ${allPermissions.length}`);
    
    let assignedCount = 0;
    for (const permission of allPermissions) {
      // Verificar si ya tiene el permiso
      const existingAssignment = await prisma.rbac_role_permissions.findFirst({
        where: {
          role_id: unidacdRole.id,
          permission_id: permission.id
        }
      });
      
      if (!existingAssignment) {
        await prisma.rbac_role_permissions.create({
          data: {
            id: randomUUID(),
            role_id: unidacdRole.id,
            permission_id: permission.id,
            granted: true, // ✅ SIEMPRE TRUE en nueva arquitectura
            granted_by: 'UNIDADC_CREATION_SCRIPT',
            granted_at: new Date()
          }
        });
        assignedCount++;
      }
    }
    
    console.log(`   ✅ ${assignedCount} nuevos permisos asignados`);
    console.log(`   🎯 UNIDADC tiene 100% de permisos (granted=true)`);
    
    // 3. Configurar 100% visibilidad en sidebar
    console.log('\n3️⃣ CONFIGURANDO 100% VISIBILIDAD EN SIDEBAR:');
    
    const ALL_MODULES = [
      'DASHBOARD', 'SOLICITUDES', 'SURTIDO', 'ENTRADAS', 'SALIDAS', 
      'REPORTES', 'STOCK_FIJO', 'INVENTARIOS_FISICOS', 'CATALOGOS', 'AJUSTES',
      'REPORTES_INVENTARIO', 'REPORTES_SALIDAS_CLIENTE',
      'CATALOGOS_PRODUCTOS', 'CATALOGOS_CATEGORIAS', 'CATALOGOS_CLIENTES',
      'CATALOGOS_PROVEEDORES', 'CATALOGOS_EMPLEADOS', 'CATALOGOS_TIPOS_ENTRADA',
      'CATALOGOS_TIPOS_SALIDA', 'CATALOGOS_ALMACENES',
      'AJUSTES_USUARIOS', 'AJUSTES_RBAC', 'AJUSTES_AUDITORIA',
      'GESTION_CATALOGOS', 'GESTION_REPORTES', 'AJUSTES_ENTIDAD', 'GESTION_RESPALDOS',
      'INVENTARIO'
    ];
    
    let visibilityCount = 0;
    for (const moduleKey of ALL_MODULES) {
      const existingVisibility = await prisma.rbac_module_visibility.findFirst({
        where: {
          role_id: unidacdRole.id,
          module_key: moduleKey
        }
      });
      
      if (!existingVisibility) {
        await prisma.rbac_module_visibility.create({
          data: {
            id: randomUUID(),
            role_id: unidacdRole.id,
            module_key: moduleKey,
            is_visible: true, // ✅ TODO VISIBLE
            created_by: 'UNIDADC_CREATION_SCRIPT'
          }
        });
        visibilityCount++;
      }
    }
    
    console.log(`   ✅ ${visibilityCount} módulos configurados como visibles`);
    console.log(`   👁️ UNIDADC ve 100% de módulos (${ALL_MODULES.length}/${ALL_MODULES.length})`);
    
    // 4. Crear usuario 888963
    console.log('\n4️⃣ CREANDO USUARIO 888963:');
    
    let user888963;
    const existingUser = await prisma.user.findUnique({
      where: { clave: '888963' }
    });
    
    if (existingUser) {
      console.log('⚠️ El usuario 888963 ya existe');
      user888963 = existingUser;
    } else {
      const hashedPassword = await bcrypt.hash('unidadc2024', 10);
      
      user888963 = await prisma.user.create({
        data: {
          id: randomUUID(),
          clave: '888963',
          name: 'Usuario UNIDADC',
          email: 'admin@unidadc.com',
          password: hashedPassword,
          activo: true,
          is_system_user: true // USUARIO DE SISTEMA
        }
      });
      console.log('✅ Usuario 888963 creado exitosamente');
    }
    
    console.log(`   • Clave: ${user888963.clave}`);
    console.log(`   • Nombre: ${user888963.name}`);
    console.log(`   • Email: ${user888963.email}`);
    console.log(`   • Password: unidadc2024`);
    
    // 5. Asignar rol UNIDADC al usuario 888963
    console.log('\n5️⃣ ASIGNANDO ROL UNIDADC AL USUARIO 888963:');
    
    const existingUserRole = await prisma.rbac_user_roles.findFirst({
      where: {
        user_id: user888963.id,
        role_id: unidacdRole.id
      }
    });
    
    if (!existingUserRole) {
      await prisma.rbac_user_roles.create({
        data: {
          id: randomUUID(),
          user_id: user888963.id,
          role_id: unidacdRole.id,
          assigned_by: 'UNIDADC_CREATION_SCRIPT',
          assigned_at: new Date()
        }
      });
      console.log('✅ Rol UNIDADC asignado al usuario 888963');
    } else {
      console.log('⚠️ El usuario 888963 ya tiene el rol UNIDADC');
    }
    
    // 6. Verificación final
    console.log('\n6️⃣ VERIFICACIÓN FINAL:');
    
    const finalVerification = await prisma.user.findUnique({
      where: { clave: '888963' },
      include: {
        rbac_user_roles: {
          include: { rbac_roles: true }
        }
      }
    });
    
    console.log('✅ USUARIO 888963 CONFIGURADO:');
    console.log(`   • Clave: ${finalVerification.clave}`);
    console.log(`   • Activo: ${finalVerification.activo}`);
    console.log(`   • Rol: ${finalVerification.rbac_user_roles[0]?.rbac_roles.name || 'Sin rol'}`);
    
    // Verificar permisos
    const permissionsCount = await prisma.rbac_role_permissions.count({
      where: { 
        role_id: unidacdRole.id,
        granted: true
      }
    });
    
    const visibilityConfigCount = await prisma.rbac_module_visibility.count({
      where: {
        role_id: unidacdRole.id,
        is_visible: true
      }
    });
    
    console.log('\n🎉 RESUMEN FINAL:');
    console.log(`   🔐 Permisos: ${permissionsCount}/${allPermissions.length} (100%)`);
    console.log(`   👁️ Visibilidad: ${visibilityConfigCount}/${ALL_MODULES.length} módulos`);
    console.log(`   🎯 Usuario 888963 listo con acceso completo`);
    
    console.log('\n🔑 CREDENCIALES FINALES:');
    console.log(`   • Clave: 888963`);
    console.log(`   • Password: unidadc2024`);
    console.log(`   • Email: admin@unidadc.com`);
    console.log(`   • Acceso: 100% completo (rol UNIDADC)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUNIDACDRoleAndUser();
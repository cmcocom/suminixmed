#!/usr/bin/env node

/**
 * Script de verificación completa del rol administrador
 * Verifica que el rol funcione correctamente después de las correcciones
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificación completa del rol ADMINISTRADOR...\n');

    try {
        // 1. Verificar estado del rol
        const adminRole = await prisma.rbac_roles.findFirst({
            where: { name: 'ADMINISTRADOR' },
            include: {
                _count: {
                    select: {
                        rbac_role_permissions: true,
                        rbac_user_roles: true,
                        module_visibility: true
                    }
                }
            }
        });

        if (!adminRole) {
            console.log('❌ No se encontró el rol ADMINISTRADOR');
            return;
        }

        console.log('📋 Estado del rol ADMINISTRADOR:');
        console.log(`  - ID: ${adminRole.id}`);
        console.log(`  - Nombre: ${adminRole.name}`);
        console.log(`  - Activo: ${adminRole.is_active ? '✅' : '❌'}`);
        console.log(`  - Permisos: ${adminRole._count.rbac_role_permissions}`);
        console.log(`  - Usuarios: ${adminRole._count.rbac_user_roles}`);
        console.log(`  - Módulos de visibilidad: ${adminRole._count.module_visibility}`);

        // 2. Verificar permisos críticos
        console.log('\n🔑 Verificando permisos críticos:');
        const criticalPermissions = [
            'perm_usuarios_leer',
            'perm_usuarios_crear',
            'perm_usuarios_editar',
            'perm_rbac_leer',
            'perm_rbac_crear',
            'perm_rbac_editar',
            'perm_entradas_leer',
            'perm_entradas_crear',
            'perm_salidas_leer',
            'perm_salidas_crear'
        ];

        const assignedCritical = await prisma.rbac_role_permissions.findMany({
            where: {
                role_id: adminRole.id,
                rbac_permissions: {
                    id: { in: criticalPermissions }
                }
            },
            include: {
                rbac_permissions: {
                    select: { id: true, name: true, action: true, module: true }
                }
            }
        });

        criticalPermissions.forEach(permId => {
            const hasPermission = assignedCritical.some(ap => ap.permission_id === permId);
            const status = hasPermission ? '✅' : '❌';
            console.log(`  ${status} ${permId}`);
        });

        // 3. Verificar visibilidad de módulos críticos
        console.log('\n👁️ Verificando visibilidad de módulos críticos:');
        const criticalModules = [
            'DASHBOARD', 'ENTRADAS', 'SALIDAS', 'USUARIOS', 'RBAC', 'INVENTARIO'
        ];

        const moduleVisibility = await prisma.module_visibility.findMany({
            where: {
                role_id: adminRole.id,
                user_id: null,
                module_key: { in: criticalModules }
            }
        });

        criticalModules.forEach(moduleKey => {
            const visibility = moduleVisibility.find(mv => mv.module_key === moduleKey);
            if (visibility) {
                const status = visibility.visible ? '✅ Visible' : '❌ Oculto';
                console.log(`  ${status} ${moduleKey}`);
            } else {
                console.log(`  ⚠️ No configurado ${moduleKey}`);
            }
        });

        // 4. Verificar usuarios asignados
        console.log('\n👥 Usuarios con rol ADMINISTRADOR:');
        const users = await prisma.rbac_user_roles.findMany({
            where: { role_id: adminRole.id },
            include: {
                User: {
                    select: { 
                        name: true, 
                        email: true, 
                        activo: true 
                    }
                }
            }
        });

        users.forEach(userRole => {
            const status = userRole.User.activo ? '✅' : '❌';
            console.log(`  ${status} ${userRole.User.name} (${userRole.User.email})`);
        });

        // 5. Verificar integridad de relaciones
        console.log('\n🔗 Verificando integridad de relaciones:');
        
        // Verificar que no haya permisos huérfanos
        const orphanedPerms = await prisma.rbac_role_permissions.findMany({
            where: {
                role_id: adminRole.id,
                rbac_permissions: null
            }
        });
        console.log(`  - Permisos huérfanos: ${orphanedPerms.length === 0 ? '✅ Ninguno' : '❌ ' + orphanedPerms.length}`);

        // Verificar que no haya módulos huérfanos
        const orphanedModules = await prisma.module_visibility.findMany({
            where: {
                role_id: adminRole.id,
                rbac_roles: null
            }
        });
        console.log(`  - Módulos huérfanos: ${orphanedModules.length === 0 ? '✅ Ninguno' : '❌ ' + orphanedModules.length}`);

        // 6. Resumen final
        console.log('\n📊 Resumen de verificación:');
        const totalPermissions = await prisma.rbac_permissions.count({
            where: { is_active: true }
        });
        
        const permissionPercentage = Math.round((adminRole._count.rbac_role_permissions / totalPermissions) * 100);
        
        console.log(`  - Cobertura de permisos: ${permissionPercentage}% (${adminRole._count.rbac_role_permissions}/${totalPermissions})`);
        console.log(`  - Usuarios activos: ${users.filter(u => u.User.activo).length}`);
        console.log(`  - Módulos visibles: ${moduleVisibility.filter(mv => mv.visible).length}`);

        // 7. Diagnóstico final
        console.log('\n🎯 Diagnóstico final:');
        
        const issues = [];
        if (adminRole._count.rbac_role_permissions === 0) issues.push('Sin permisos asignados');
        if (adminRole._count.rbac_user_roles === 0) issues.push('Sin usuarios asignados');
        if (!adminRole.is_active) issues.push('Rol inactivo');
        if (moduleVisibility.filter(mv => mv.visible && mv.module_key === 'ENTRADAS').length === 0) issues.push('Módulo ENTRADAS no visible');
        
        if (issues.length === 0) {
            console.log('✅ El rol ADMINISTRADOR está funcionando correctamente');
            console.log('✅ Todos los problemas reportados han sido solucionados');
        } else {
            console.log('❌ Problemas encontrados:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
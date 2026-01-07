#!/usr/bin/env node

/**
 * Script para limpiar configuraciones residuales del rol administrador
 * que podrían estar causando problemas al eliminar y recrear el rol.
 * 
 * Este script:
 * 1. Busca y elimina configuraciones huérfanas de module_visibility
 * 2. Busca y elimina permisos huérfanos en rbac_role_permissions
 * 3. Verifica la integridad de las relaciones
 * 4. Muestra el estado actual de los roles y configuraciones
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Iniciando limpieza de configuraciones del rol administrador...\n');

    try {
        // 1. Verificar estado actual de roles
        console.log('📊 Estado actual de roles:');
        const roles = await prisma.rbac_roles.findMany({
            where: {
                name: {
                    in: ['administrador', 'ADMINISTRADOR']
                }
            },
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

        roles.forEach(role => {
            console.log(`  - ${role.name} (ID: ${role.id})`);
            console.log(`    Permisos: ${role._count.rbac_role_permissions}`);
            console.log(`    Usuarios: ${role._count.rbac_user_roles}`);
            console.log(`    Módulos de visibilidad: ${role._count.module_visibility}`);
            console.log(`    Activo: ${role.is_active}`);
        });

        // 2. Buscar configuraciones huérfanas de module_visibility
        console.log('\n🔍 Buscando configuraciones huérfanas de module_visibility...');
        const orphanedModuleVisibility = await prisma.$queryRaw`
            SELECT mv.* 
            FROM module_visibility mv
            LEFT JOIN rbac_roles r ON mv.role_id = r.id
            WHERE mv.role_id IS NOT NULL 
            AND r.id IS NULL
        `;
        
        console.log(`Encontradas ${orphanedModuleVisibility.length} configuraciones huérfanas de module_visibility`);
        
        if (orphanedModuleVisibility.length > 0) {
            console.log('🧹 Eliminando configuraciones huérfanas de module_visibility...');
            const deletedMV = await prisma.$executeRaw`
                DELETE FROM module_visibility 
                WHERE role_id IS NOT NULL 
                AND role_id NOT IN (SELECT id FROM rbac_roles)
            `;
            console.log(`✅ Eliminadas ${deletedMV} configuraciones huérfanas de module_visibility`);
        }

        // 3. Buscar permisos huérfanos en rbac_role_permissions
        console.log('\n🔍 Buscando permisos huérfanos en rbac_role_permissions...');
        const orphanedPermissions = await prisma.$queryRaw`
            SELECT rp.* 
            FROM rbac_role_permissions rp
            LEFT JOIN rbac_roles r ON rp.role_id = r.id
            WHERE r.id IS NULL
        `;
        
        console.log(`Encontrados ${orphanedPermissions.length} permisos huérfanos`);
        
        if (orphanedPermissions.length > 0) {
            console.log('🧹 Eliminando permisos huérfanos...');
            const deletedRP = await prisma.$executeRaw`
                DELETE FROM rbac_role_permissions 
                WHERE role_id NOT IN (SELECT id FROM rbac_roles)
            `;
            console.log(`✅ Eliminados ${deletedRP} permisos huérfanos`);
        }

        // 4. Buscar asignaciones de usuario huérfanas
        console.log('\n🔍 Buscando asignaciones de usuario huérfanas...');
        const orphanedUserRoles = await prisma.$queryRaw`
            SELECT ur.* 
            FROM rbac_user_roles ur
            LEFT JOIN rbac_roles r ON ur.role_id = r.id
            WHERE r.id IS NULL
        `;
        
        console.log(`Encontradas ${orphanedUserRoles.length} asignaciones de usuario huérfanas`);
        
        if (orphanedUserRoles.length > 0) {
            console.log('🧹 Eliminando asignaciones de usuario huérfanas...');
            const deletedUR = await prisma.$executeRaw`
                DELETE FROM rbac_user_roles 
                WHERE role_id NOT IN (SELECT id FROM rbac_roles)
            `;
            console.log(`✅ Eliminadas ${deletedUR} asignaciones de usuario huérfanas`);
        }

        // 5. Verificar configuraciones de module_visibility para roles existentes
        console.log('\n📋 Configuraciones de module_visibility por rol:');
        const mvByRole = await prisma.$queryRaw`
            SELECT 
                r.name as role_name,
                r.id as role_id,
                COUNT(mv.id) as module_count,
                COUNT(CASE WHEN mv.visible = true THEN 1 END) as visible_count,
                COUNT(CASE WHEN mv.visible = false THEN 1 END) as hidden_count
            FROM rbac_roles r
            LEFT JOIN module_visibility mv ON r.id = mv.role_id
            WHERE r.name IN ('administrador', 'ADMINISTRADOR', 'operador', 'OPERADOR')
            GROUP BY r.id, r.name
            ORDER BY r.name
        `;

        mvByRole.forEach(role => {
            console.log(`  - ${role.role_name}:`);
            console.log(`    Total módulos configurados: ${role.module_count}`);
            console.log(`    Visibles: ${role.visible_count}`);
            console.log(`    Ocultos: ${role.hidden_count}`);
        });

        // 6. Mostrar módulos específicos para administrador si existe
        const adminRole = roles.find(r => r.name.toLowerCase() === 'administrador');
        if (adminRole) {
            console.log('\n🔍 Configuración detallada del rol administrador:');
            const adminModules = await prisma.module_visibility.findMany({
                where: { role_id: adminRole.id },
                orderBy: { module_key: 'asc' }
            });

            adminModules.forEach(module => {
                const status = module.visible ? '✅' : '❌';
                console.log(`  ${status} ${module.module_key}`);
            });
        }

        console.log('\n✅ Limpieza completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
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
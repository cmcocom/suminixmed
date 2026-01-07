#!/usr/bin/env node

/**
 * Script para reparar el rol administrador:
 * 1. Asignar todos los permisos al rol ADMINISTRADOR
 * 2. Configurar visibilidad de módulos apropiada
 * 3. Verificar que el rol funcione correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Iniciando reparación del rol ADMINISTRADOR...\n');

    try {
        // 1. Encontrar el rol administrador
        const adminRole = await prisma.rbac_roles.findFirst({
            where: {
                name: {
                    in: ['ADMINISTRADOR', 'administrador']
                }
            }
        });

        if (!adminRole) {
            console.log('❌ No se encontró el rol administrador');
            return;
        }

        console.log(`📋 Reparando rol: ${adminRole.name} (ID: ${adminRole.id})`);

        // 2. Obtener todos los permisos del sistema
        const allPermissions = await prisma.rbac_permissions.findMany({
            where: { is_active: true }
        });

        console.log(`📊 Total de permisos en el sistema: ${allPermissions.length}`);

        // 3. Verificar permisos actualmente asignados
        const currentPermissions = await prisma.rbac_role_permissions.findMany({
            where: { role_id: adminRole.id }
        });

        console.log(`📊 Permisos actualmente asignados: ${currentPermissions.length}`);

        // 4. Asignar todos los permisos si faltan
        if (currentPermissions.length < allPermissions.length) {
            console.log('🔧 Asignando todos los permisos al rol ADMINISTRADOR...');
            
            // Eliminar asignaciones existentes para evitar duplicados
            await prisma.rbac_role_permissions.deleteMany({
                where: { role_id: adminRole.id }
            });

            // Crear todas las asignaciones
            const permissionAssignments = allPermissions.map(permission => ({
                id: `rp_${adminRole.id}_${permission.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role_id: adminRole.id,
                permission_id: permission.id,
                granted: true,
                granted_by: 'system',
                granted_at: new Date()
            }));

            await prisma.rbac_role_permissions.createMany({
                data: permissionAssignments,
                skipDuplicates: true
            });

            console.log(`✅ Asignados ${allPermissions.length} permisos al rol ADMINISTRADOR`);
        } else {
            console.log('✅ El rol ya tiene todos los permisos asignados');
        }

        // 5. Configurar visibilidad de módulos (mostrar todos los importantes)
        console.log('🔧 Configurando visibilidad de módulos...');
        
        const importantModules = [
            'DASHBOARD', 'ENTRADAS', 'SALIDAS', 'SURTIDO', 'INVENTARIO', 'PRODUCTOS',
            'CATEGORIAS', 'CLIENTES', 'PROVEEDORES', 'USUARIOS', 'RBAC', 'REPORTES', 'AJUSTES'
        ];

        for (const moduleKey of importantModules) {
            // Buscar si ya existe
            const existing = await prisma.module_visibility.findFirst({
                where: {
                    role_id: adminRole.id,
                    user_id: null,
                    module_key: moduleKey
                }
            });

            if (existing) {
                // Actualizar existente
                await prisma.module_visibility.update({
                    where: { id: existing.id },
                    data: {
                        visible: true,
                        updated_at: new Date()
                    }
                });
            } else {
                // Crear nuevo
                await prisma.module_visibility.create({
                    data: {
                        id: `mv_${adminRole.id}_${moduleKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        module_key: moduleKey,
                        visible: true,
                        role_id: adminRole.id,
                        user_id: null,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
            }
        }

        console.log(`✅ Configurada visibilidad para ${importantModules.length} módulos principales`);

        // 6. Verificar usuarios asignados al rol
        const usersWithRole = await prisma.rbac_user_roles.findMany({
            where: { role_id: adminRole.id },
            include: {
                User: {
                    select: { name: true, email: true }
                }
            }
        });

        console.log(`\n👥 Usuarios con rol ADMINISTRADOR (${usersWithRole.length}):`);
        usersWithRole.forEach(userRole => {
            console.log(`  - ${userRole.User.name} (${userRole.User.email})`);
        });

        // 7. Verificación final
        const finalCheck = await prisma.rbac_roles.findUnique({
            where: { id: adminRole.id },
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

        console.log('\n📊 Estado final del rol ADMINISTRADOR:');
        console.log(`  - Permisos: ${finalCheck._count.rbac_role_permissions}`);
        console.log(`  - Usuarios: ${finalCheck._count.rbac_user_roles}`);
        console.log(`  - Módulos de visibilidad: ${finalCheck._count.module_visibility}`);
        console.log(`  - Estado: ${finalCheck.is_active ? 'Activo' : 'Inactivo'}`);

        console.log('\n✅ Reparación del rol ADMINISTRADOR completada exitosamente');
        console.log('📝 El rol ahora debería funcionar correctamente en la interfaz');
        
    } catch (error) {
        console.error('❌ Error durante la reparación:', error);
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
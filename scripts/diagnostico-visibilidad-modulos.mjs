#!/usr/bin/env node

/**
 * Script de diagnóstico completo para visibilidad de módulos
 * Simula exactamente lo que hace el frontend para identificar dónde está el problema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simular la lógica del API
async function simulateAPIResponse(userId) {
    // Defaults base (igual que en el API)
    const defaultVisibility = {
        'DASHBOARD': true,
        'ENTRADAS': true,
        'SALIDAS': true,
        'SURTIDO': true,
        'INVENTARIO': true,
        'PRODUCTOS': true,
        'STOCK_FIJO': true,
        'CATEGORIAS': true,
        'CLIENTES': true,
        'PROVEEDORES': true,
        'EMPLEADOS': true,
        'SOLICITUDES': true,
        'REPORTES': true,
        'REPORTES_INVENTARIO': true,
        'AJUSTES': true,
        'USUARIOS': true,
        'RBAC': true,
        'AUDITORIA': true,
        'FONDOS_FIJOS': true,
        'INVENTARIOS_FISICOS': true,
        'ORDENES_COMPRA': true,
        'UBICACIONES': true,
        'ALMACENES': true,
        'PERMISOS_INDICADORES': true,
        'GESTION_CATALOGOS': true,
        'GESTION_REPORTES': true,
        'GESTION_INDICADORES': true,
        'ENTIDADES': true,
        'SISTEMA': true,
        'RESPALDOS': true,
        'PERFIL_PROPIO': true
    };

    // Obtener roles del usuario
    const userRoleRecords = await prisma.rbac_user_roles.findMany({
        where: { user_id: userId },
        select: { role_id: true }
    });
    const userRoles = userRoleRecords.map(ur => ur.role_id);

    console.log('👤 Usuario ID:', userId);
    console.log('🎭 Roles del usuario:', userRoles);
    console.log('📋 Defaults iniciales:', Object.keys(defaultVisibility).length, 'módulos');

    // 1. Cargar configuraciones globales
    const globals = await prisma.module_visibility.findMany({ 
        where: { user_id: null, role_id: null } 
    });
    console.log('\n🌍 Configuraciones globales encontradas:', globals.length);
    globals.forEach(g => {
        defaultVisibility[g.module_key] = g.visible;
        console.log(`  - ${g.module_key}: ${g.visible}`);
    });

    // 2. Configuraciones por defecto de roles (role_default_visibility)
    if (userRoles.length > 0) {
        const roleDefaults = await prisma.role_default_visibility.findMany({
            where: { role_id: { in: userRoles } }
        });
        console.log('\n🏷️ Configuraciones por defecto de roles:', roleDefaults.length);
        roleDefaults.forEach(rd => {
            defaultVisibility[rd.module_key] = rd.visible;
            console.log(`  - ${rd.module_key}: ${rd.visible}`);
        });
    }

    // 3. Configuraciones específicas del rol
    if (userRoles.length > 0) {
        const roleSpecific = await prisma.module_visibility.findMany({
            where: { 
                role_id: { in: userRoles },
                user_id: null
            }
        });
        console.log('\n🎭 Configuraciones específicas de roles:', roleSpecific.length);
        roleSpecific.forEach(r => {
            defaultVisibility[r.module_key] = r.visible;
            console.log(`  - ${r.module_key}: ${r.visible} (rol: ${r.role_id})`);
        });
    }

    // 4. Configuraciones específicas del usuario
    const userSpecific = await prisma.module_visibility.findMany({ 
        where: { user_id: userId, role_id: null } 
    });
    console.log('\n👤 Configuraciones específicas del usuario:', userSpecific.length);
    userSpecific.forEach(u => {
        defaultVisibility[u.module_key] = u.visible;
        console.log(`  - ${u.module_key}: ${u.visible}`);
    });

    return defaultVisibility;
}

// Simular deriveEffectiveVisibility
function simulateEffectiveVisibility(raw) {
    const MODULE_VISIBILITY_MAP = {
        DASHBOARD: ['DASHBOARD'],
        ORDENES_COMPRA: ['ORDENES_COMPRA'],
        ENTRADAS: ['ENTRADAS'],
        SALIDAS: ['SALIDAS'],
        SOLICITUDES: ['SOLICITUDES'],
        SURTIDO: ['SURTIDO'],
        INVENTARIO: ['INVENTARIO'],
        INVENTARIOS_FISICOS: ['INVENTARIOS_FISICOS'],
        PRODUCTOS: ['PRODUCTOS'],
        STOCK_FIJO: ['STOCK_FIJO'],
        CATEGORIAS: ['CATEGORIAS'],
        CLIENTES: ['CLIENTES'],
        PROVEEDORES: ['PROVEEDORES'],
        EMPLEADOS: ['EMPLEADOS'],
        REPORTES: ['REPORTES'],
        AJUSTES: ['AJUSTES'],
        USUARIOS: ['USUARIOS'],
        RBAC: ['RBAC'],
        AUDITORIA: ['AUDITORIA'],
        PERMISOS_INDICADORES: ['PERMISOS_INDICADORES'],
        GESTION_CATALOGOS: ['GESTION_CATALOGOS'],
        GESTION_REPORTES: ['GESTION_REPORTES'],
        ENTIDADES: ['ENTIDADES'],
        ALMACENES: ['ALMACENES'],
        FONDOS_FIJOS: ['FONDOS_FIJOS'],
        UBICACIONES: ['UBICACIONES'],
        RESPALDOS: ['RESPALDOS'],
        PERFIL_PROPIO: ['PERFIL_PROPIO'],
        GESTION_INDICADORES: ['GESTION_INDICADORES'],
        REPORTES_INVENTARIO: ['REPORTES'],
        SISTEMA: ['SISTEMA'],
    };

    const effective = {};
    
    // PASO 1: Procesar TRUE primero
    for (const [key, visible] of Object.entries(raw)) {
        if (visible === true) {
            const targets = MODULE_VISIBILITY_MAP[key] || [key];
            for (const target of targets) {
                if (effective[target] === undefined) {
                    effective[target] = true;
                }
            }
        }
    }
    
    // PASO 2: Sobrescribir con FALSE
    for (const [key, visible] of Object.entries(raw)) {
        if (visible === false) {
            const targets = MODULE_VISIBILITY_MAP[key] || [key];
            for (const target of targets) {
                if (key === target || MODULE_VISIBILITY_MAP[key]?.length === 1) {
                    effective[target] = false;
                }
            }
        }
    }
    
    return effective;
}

async function main() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE VISIBILIDAD DE MÓDULOS\n');

    try {
        // Buscar usuario administrador
        const adminUser = await prisma.rbac_user_roles.findFirst({
            where: {
                rbac_roles: {
                    name: 'ADMINISTRADOR'
                }
            },
            include: {
                User: {
                    select: { id: true, name: true, email: true }
                },
                rbac_roles: {
                    select: { name: true }
                }
            }
        });

        if (!adminUser) {
            console.log('❌ No se encontró usuario con rol ADMINISTRADOR');
            return;
        }

        console.log('✅ Usuario administrador encontrado:');
        console.log(`  - Nombre: ${adminUser.User.name}`);
        console.log(`  - Email: ${adminUser.User.email}`);
        console.log(`  - Rol: ${adminUser.rbac_roles.name}`);

        // Simular respuesta del API
        console.log('\n' + '='.repeat(80));
        console.log('📡 SIMULANDO RESPUESTA DEL API');
        console.log('='.repeat(80));

        const apiResponse = await simulateAPIResponse(adminUser.User.id);

        console.log('\n📊 RESULTADO FINAL DEL API:');
        const visibleModules = Object.entries(apiResponse).filter(([, v]) => v === true);
        const hiddenModules = Object.entries(apiResponse).filter(([, v]) => v === false);

        console.log(`\n✅ Módulos VISIBLES (${visibleModules.length}):`);
        visibleModules.forEach(([key, value]) => {
            console.log(`  ✅ ${key}`);
        });

        console.log(`\n❌ Módulos OCULTOS (${hiddenModules.length}):`);
        hiddenModules.forEach(([key, value]) => {
            console.log(`  ❌ ${key}`);
        });

        // Simular effectiveVisibility
        console.log('\n' + '='.repeat(80));
        console.log('🔄 SIMULANDO EFFECTIVE VISIBILITY');
        console.log('='.repeat(80));

        const effectiveVisibility = simulateEffectiveVisibility(apiResponse);
        
        const effectiveVisible = Object.entries(effectiveVisibility).filter(([, v]) => v === true);
        const effectiveHidden = Object.entries(effectiveVisibility).filter(([, v]) => v === false);

        console.log(`\n✅ Effective VISIBLES (${effectiveVisible.length}):`);
        effectiveVisible.forEach(([key]) => {
            console.log(`  ✅ ${key}`);
        });

        console.log(`\n❌ Effective OCULTOS (${effectiveHidden.length}):`);
        effectiveHidden.forEach(([key]) => {
            console.log(`  ❌ ${key}`);
        });

        // Análisis de discrepancias
        console.log('\n' + '='.repeat(80));
        console.log('🔍 ANÁLISIS DE DISCREPANCIAS');
        console.log('='.repeat(80));

        console.log(`📊 Total módulos configurados en BD: 31`);
        console.log(`📊 Total módulos visibles en API: ${visibleModules.length}`);
        console.log(`📊 Total módulos effective visibles: ${effectiveVisible.length}`);

        if (effectiveVisible.length < 29) {
            console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
            console.log(`Se esperaban 29 módulos visibles, pero solo hay ${effectiveVisible.length}`);
            
            // Buscar módulos que deberían estar visibles pero no están
            const expectedVisible = [
                'DASHBOARD', 'ENTRADAS', 'SALIDAS', 'USUARIOS', 'RBAC', 'INVENTARIO',
                'PRODUCTOS', 'CATEGORIAS', 'CLIENTES', 'PROVEEDORES', 'EMPLEADOS',
                'SOLICITUDES', 'REPORTES', 'AJUSTES', 'AUDITORIA', 'FONDOS_FIJOS'
            ];

            const missing = expectedVisible.filter(mod => !effectiveVisibility[mod]);
            if (missing.length > 0) {
                console.log('\n❌ Módulos ESPERADOS pero FALTANTES:');
                missing.forEach(mod => console.log(`  ❌ ${mod}`));
            }
        }

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
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
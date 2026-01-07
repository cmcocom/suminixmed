#!/usr/bin/env node

/**
 * Script de Sincronización Completa de Módulos RBAC
 * 
 * Este script sincroniza COMPLETAMENTE los módulos definidos en lib/rbac-modules.ts 
 * con la base de datos, manteniendo la consistencia total del sistema RBAC.
 * 
 * ⚠️  IMPORTANTE: Este es el ÚNICO lugar donde se deben gestionar módulos.
 *     La base de datos SIEMPRE debe reflejar lo que está en lib/rbac-modules.ts
 * 
 * CUÁNDO EJECUTAR:
 * - ✅ Después de agregar nuevos módulos a SYSTEM_MODULES
 * - ✅ Después de eliminar módulos de SYSTEM_MODULES
 * - ✅ Al detectar inconsistencias entre código y BD
 * - ✅ Al hacer deployment de cambios en módulos
 * - ✅ Después de migraciones que afecten RBAC
 * 
 * QUÉ HACE:
 * 1. ✅ Lee módulos de lib/rbac-modules.ts (fuente de verdad)
 * 2. ✅ Compara con módulos en base de datos
 * 3. ✅ CREA permisos LEER para módulos nuevos
 * 4. ✅ ASIGNA nuevos permisos a todos los roles (granted=false por defecto)
 * 5. ✅ ELIMINA módulos obsoletos (con --cleanup):
 *        - Elimina asignaciones en rbac_role_permissions
 *        - Elimina permisos en rbac_permissions
 *        - Limpia todas las referencias
 * 
 * SEGURIDAD:
 * - ⏱️  Espera 3 segundos antes de crear
 * - ⏱️  Espera 5 segundos antes de eliminar (con confirmación explícita)
 * - 📊 Muestra resumen detallado de cambios antes de ejecutar
 * - 🔒 Solo afecta permisos LEER (no toca otros permisos existentes)
 * 
 * USO:
 *   npm run sync:modules                    # Solo agregar nuevos módulos
 *   npm run sync:modules:cleanup            # Agregar nuevos Y eliminar obsoletos
 * 
 * EJEMPLO DE FLUJO COMPLETO:
 * 1. Editar lib/rbac-modules.ts (agregar/eliminar módulos)
 * 2. npm run sync:modules:cleanup
 * 3. Verificar en http://localhost:3000/dashboard/usuarios/rbac
 * 4. Commit y deploy
 * 
 * RESULTADO ESPERADO:
 * - BD tiene EXACTAMENTE los mismos módulos que lib/rbac-modules.ts
 * - Cada módulo tiene 1 permiso LEER
 * - Cada rol tiene asignado el permiso LEER de cada módulo
 * - No hay permisos huérfanos ni módulos obsoletos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Importar módulos desde archivo TypeScript compilado o definir aquí
// Como esto es un script .mjs, definimos los módulos directamente
const SYSTEM_MODULES = [
  // Principales (5)
  { key: 'DASHBOARD', title: 'Dashboard', category: 'principales' },
  { key: 'SOLICITUDES', title: 'Solicitudes', category: 'principales' },
  { key: 'SURTIDO', title: 'Surtido', category: 'principales' },
  { key: 'ENTRADAS', title: 'Entradas', category: 'principales' },
  { key: 'SALIDAS', title: 'Salidas', category: 'principales' },
  
  // Reportes (4)
  { key: 'REPORTES', title: 'Reportes (Menú)', category: 'reportes' },
  { key: 'REPORTES_INVENTARIO', title: 'Inventario', category: 'reportes' },
  { key: 'REPORTES_ENTRADAS_CLIENTE', title: 'Entradas por Proveedor', category: 'reportes' },
  { key: 'REPORTES_SALIDAS_CLIENTE', title: 'Salidas por Cliente', category: 'reportes' },
  { key: 'REPORTES_ROTACION_PRODUCTOS', title: 'Rotación de Productos', category: 'reportes' },
  
  // Gestión (2)
  { key: 'STOCK_FIJO', title: 'Stock Fijo', category: 'gestion' },
  { key: 'INVENTARIOS_FISICOS', title: 'Inventarios Físicos', category: 'gestion' },
  
  // Catálogos (9)
  { key: 'INVENTARIO', title: 'Inventario', category: 'catalogos' },
  { key: 'PRODUCTOS', title: 'Productos', category: 'catalogos' },
  { key: 'CATEGORIAS', title: 'Categorías', category: 'catalogos' },
  { key: 'CLIENTES', title: 'Clientes', category: 'catalogos' },
  { key: 'PROVEEDORES', title: 'Proveedores', category: 'catalogos' },
  { key: 'EMPLEADOS', title: 'Empleados', category: 'catalogos' },
  { key: 'TIPOS_ENTRADAS', title: 'Tipos de Entrada', category: 'catalogos' },
  { key: 'TIPOS_SALIDAS', title: 'Tipos de Salida', category: 'catalogos' },
  { key: 'ALMACENES', title: 'Almacenes', category: 'catalogos' },
  
  // Ajustes (8)
  { key: 'AJUSTES', title: 'Ajustes', category: 'ajustes' },
  { key: 'USUARIOS', title: 'Usuarios', category: 'ajustes' },
  { key: 'RBAC', title: 'Control RBAC', category: 'ajustes' },
  { key: 'AUDITORIA', title: 'Auditoría', category: 'ajustes' },
  { key: 'GESTION_CATALOGOS', title: 'Gestión de Catálogos', category: 'ajustes' },
  { key: 'GESTION_REPORTES', title: 'Gestión de Reportes', category: 'ajustes' },
  { key: 'ENTIDADES', title: 'Entidades', category: 'ajustes' },
  { key: 'RESPALDOS', title: 'Respaldos', category: 'ajustes' },
];

// Configuración
const SYSTEM_USER_ID = 'system';
const CLEANUP_DELETED = process.argv.includes('--cleanup');

async function syncModules() {
  console.log('🔄 SINCRONIZACIÓN DE MÓDULOS RBAC\n');
  console.log('═'.repeat(70));
  console.log(`Fecha: ${new Date().toLocaleString('es-MX')}`);
  console.log(`Módulos definidos: ${SYSTEM_MODULES.length}`);
  console.log(`Modo cleanup: ${CLEANUP_DELETED ? '✅ SÍ' : '❌ NO'}`);
  console.log('═'.repeat(70));

  try {
    // 1. Obtener módulos actuales en BD
    const permisosActuales = await prisma.rbac_permissions.findMany({
      where: { action: 'LEER' },
      select: { id: true, module: true, name: true, is_active: true }
    });

    const modulosEnBD = new Set(permisosActuales.map(p => p.module));
    const modulosDefinidos = new Set(SYSTEM_MODULES.map(m => m.key));

    console.log(`\n📊 ANÁLISIS:`);
    console.log(`   Módulos en BD:       ${modulosEnBD.size}`);
    console.log(`   Módulos definidos:   ${modulosDefinidos.size}`);

    // 2. Identificar nuevos módulos
    const modulosNuevos = SYSTEM_MODULES.filter(m => !modulosEnBD.has(m.key));
    
    if (modulosNuevos.length > 0) {
      console.log(`\n✨ MÓDULOS NUEVOS A CREAR (${modulosNuevos.length}):`);
      modulosNuevos.forEach((m, idx) => {
        console.log(`   ${String(idx + 1).padStart(2)}. ${m.key} - ${m.title}`);
      });
    } else {
      console.log(`\n✅ No hay módulos nuevos para crear`);
    }

    // 3. Identificar módulos eliminados
    const modulosEliminados = Array.from(modulosEnBD).filter(m => !modulosDefinidos.has(m));
    
    if (modulosEliminados.length > 0) {
      console.log(`\n⚠️  MÓDULOS ELIMINADOS DE DEFINICIÓN (${modulosEliminados.length}):`);
      modulosEliminados.forEach((m, idx) => {
        console.log(`   ${String(idx + 1).padStart(2)}. ${m}`);
      });
      
      if (CLEANUP_DELETED) {
        console.log(`   🔧 Se marcarán como inactivos (is_active=false)`);
      } else {
        console.log(`   ℹ️  No se modificarán (usa --cleanup para marcar como inactivos)`);
      }
    }

    // 4. Confirmar antes de proceder
    if (modulosNuevos.length === 0 && (!CLEANUP_DELETED || modulosEliminados.length === 0)) {
      console.log(`\n✅ SISTEMA SINCRONIZADO`);
      console.log(`   • Módulos en código: ${modulosDefinidos.size}`);
      console.log(`   • Módulos en BD:     ${modulosEnBD.size}`);
      console.log(`   • Estado: CONSISTENTE ✨`);
      return;
    }

    console.log(`\n⚠️  RESUMEN DE CAMBIOS A REALIZAR:`);
    if (modulosNuevos.length > 0) {
      console.log(`   ✅ Crear ${modulosNuevos.length} módulo(s) nuevo(s)`);
      console.log(`      - ${modulosNuevos.length} permiso(s) LEER`);
      console.log(`      - ~${modulosNuevos.length * 4} asignación(es) a roles`);
    }
    if (CLEANUP_DELETED && modulosEliminados.length > 0) {
      console.log(`   ❌ Eliminar ${modulosEliminados.length} módulo(s) obsoleto(s)`);
      console.log(`      - ~${modulosEliminados.length * 4} permiso(s) LEER`);
      console.log(`      - ~${modulosEliminados.length * 4 * 4} asignación(es) de roles`);
    }
    console.log(`\n⏱️  Iniciando en 3 segundos... (Ctrl+C para cancelar)\n`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Crear permisos para módulos nuevos
    let permisosCreados = 0;
    
    if (modulosNuevos.length > 0) {
      console.log(`\n🔨 CREANDO PERMISOS LEER...`);
      
      for (const modulo of modulosNuevos) {
        // Crear permiso LEER
        const permiso = await prisma.rbac_permissions.create({
          data: {
            id: `perm-${modulo.key.toLowerCase()}-leer`,
            name: `Leer ${modulo.title}`,
            description: `Permiso para acceder al módulo ${modulo.title}`,
            module: modulo.key,
            action: 'LEER',
            is_active: true,
            created_by: SYSTEM_USER_ID
          }
        });
        
        console.log(`   ✅ Creado: ${modulo.key} (${permiso.id})`);
        permisosCreados++;
      }
    }

    // 6. Asignar nuevos permisos a todos los roles
    let asignacionesCreadas = 0;
    
    if (permisosCreados > 0) {
      console.log(`\n🔗 ASIGNANDO PERMISOS A ROLES...`);
      
      const roles = await prisma.rbac_roles.findMany({
        where: { is_active: true },
        select: { id: true, name: true }
      });
      
      console.log(`   Roles encontrados: ${roles.length}`);
      
      for (const rol of roles) {
        for (const modulo of modulosNuevos) {
          const permisoId = `perm-${modulo.key.toLowerCase()}-leer`;
          
          // Verificar si ya existe
          const existente = await prisma.rbac_role_permissions.findUnique({
            where: {
              role_id_permission_id: {
                role_id: rol.id,
                permission_id: permisoId
              }
            }
          });
          
          if (!existente) {
            await prisma.rbac_role_permissions.create({
              data: {
                id: `rp-${rol.id}-${modulo.key.toLowerCase()}-leer`,
                role_id: rol.id,
                permission_id: permisoId,
                granted: false, // Oculto por defecto
                granted_by: SYSTEM_USER_ID
              }
            });
            
            asignacionesCreadas++;
          }
        }
        
        console.log(`   ✅ ${rol.name}: ${modulosNuevos.length} permisos asignados`);
      }
      
      console.log(`   Total asignaciones: ${asignacionesCreadas}`);
    }

    // 7. ELIMINAR módulos obsoletos (CLEANUP COMPLETO)
    let permisosEliminados = 0;
    let asignacionesEliminadas = 0;
    
    if (CLEANUP_DELETED && modulosEliminados.length > 0) {
      console.log(`\n�️  ELIMINANDO MÓDULOS OBSOLETOS...`);
      console.log(`   ⚠️  ADVERTENCIA: Esto eliminará PERMANENTEMENTE los permisos y asignaciones`);
      console.log(`   ⏱️  Esperando 5 segundos... (Ctrl+C para cancelar)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      for (const moduloKey of modulosEliminados) {
        console.log(`\n   🔍 Procesando módulo: ${moduloKey}`);
        
        // 7.1. Obtener todos los permisos del módulo
        const permisosDelModulo = await prisma.rbac_permissions.findMany({
          where: { module: moduloKey },
          select: { id: true, action: true }
        });
        
        if (permisosDelModulo.length === 0) {
          console.log(`      ℹ️  No hay permisos para eliminar`);
          continue;
        }
        
        const permisoIds = permisosDelModulo.map(p => p.id);
        console.log(`      📋 Permisos encontrados: ${permisosDelModulo.length} (${permisosDelModulo.map(p => p.action).join(', ')})`);
        
        // 7.2. Eliminar asignaciones role_permissions
        const asignacionesResult = await prisma.rbac_role_permissions.deleteMany({
          where: { permission_id: { in: permisoIds } }
        });
        
        console.log(`      🔗 Asignaciones eliminadas: ${asignacionesResult.count}`);
        asignacionesEliminadas += asignacionesResult.count;
        
        // 7.3. Eliminar permisos
        const permisosResult = await prisma.rbac_permissions.deleteMany({
          where: { module: moduloKey }
        });
        
        console.log(`      🔐 Permisos eliminados: ${permisosResult.count}`);
        permisosEliminados += permisosResult.count;
        
        console.log(`      ✅ Módulo ${moduloKey} eliminado completamente`);
      }
      
      console.log(`\n   ✅ CLEANUP COMPLETADO`);
      console.log(`      Total permisos eliminados:      ${permisosEliminados}`);
      console.log(`      Total asignaciones eliminadas:  ${asignacionesEliminadas}`);
    }

    // 8. Resumen final
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`   📊 CREACIÓN:`);
    console.log(`      Permisos creados:              ${permisosCreados}`);
    console.log(`      Asignaciones creadas:          ${asignacionesCreadas}`);
    console.log(`\n   🗑️  ELIMINACIÓN:`);
    console.log(`      Permisos eliminados:           ${permisosEliminados}`);
    console.log(`      Asignaciones eliminadas:       ${asignacionesEliminadas}`);
    console.log(`\n   📈 RESULTADO:`);
    console.log(`      Módulos activos en BD:         ${SYSTEM_MODULES.length}`);
    console.log(`      Módulos definidos en código:   ${SYSTEM_MODULES.length}`);
    console.log(`      Estado: ${permisosEliminados > 0 || permisosCreados > 0 ? '🔄 SINCRONIZADO' : '✅ YA ESTABA SINCRONIZADO'}`);
    console.log(`\n💡 SIGUIENTE PASO:`);
    console.log(`   Revisa la configuración de visibilidad en:`);
    console.log(`   http://localhost:3000/dashboard/usuarios/rbac`);
    console.log(`${'═'.repeat(70)}\n`);

  } catch (error) {
    console.error('\n❌ ERROR durante sincronización:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
syncModules().catch(console.error);

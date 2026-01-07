-- ============================================================
-- ELIMINACIÓN DE PERMISOS RBAC - MÓDULO ORDENES_COMPRA
-- ============================================================
-- Fecha: 22 octubre 2025
-- Descripción: Limpia todos los permisos y configuraciones RBAC
--              relacionadas con el módulo ORDENES_COMPRA eliminado
-- ============================================================

\echo '🗑️  Iniciando eliminación de permisos de ORDENES_COMPRA...'
\echo ''

-- 1️⃣ ELIMINAR VISIBILIDAD DE MÓDULO
\echo '1. Eliminando configuraciones de visibilidad del módulo...'
DELETE FROM module_visibility 
WHERE module_key = 'ORDENES_COMPRA';

\echo '   ✅ Visibilidad de módulo eliminada'
\echo ''

-- 2️⃣ ELIMINAR VISIBILIDAD POR DEFECTO DE ROLES
\echo '2. Eliminando visibilidad por defecto en roles...'
DELETE FROM role_default_visibility 
WHERE module_key = 'ORDENES_COMPRA';

\echo '   ✅ Visibilidad por defecto eliminada'
\echo ''

-- 3️⃣ ELIMINAR ASIGNACIONES DE PERMISOS A ROLES
\echo '3. Eliminando asignaciones de permisos a roles...'
DELETE FROM rbac_role_permissions 
WHERE permission_id IN (
  SELECT id FROM rbac_permissions WHERE module = 'ORDENES_COMPRA'
);

\echo '   ✅ Asignaciones de permisos eliminadas'
\echo ''

-- 4️⃣ ELIMINAR PERMISOS DEL MÓDULO
\echo '4. Eliminando permisos del módulo ORDENES_COMPRA...'
DELETE FROM rbac_permissions 
WHERE module = 'ORDENES_COMPRA';

\echo '   ✅ Permisos del módulo eliminados'
\echo ''

-- 5️⃣ VERIFICACIÓN FINAL
\echo '📊 Verificación final:'
\echo ''

\echo '   Permisos restantes de ORDENES_COMPRA:'
SELECT COUNT(*) as permisos_restantes 
FROM rbac_permissions 
WHERE module = 'ORDENES_COMPRA';

\echo ''
\echo '   Visibilidad restante de ORDENES_COMPRA:'
SELECT COUNT(*) as visibilidad_restante 
FROM module_visibility 
WHERE module_key = 'ORDENES_COMPRA';

\echo ''
\echo '✅ Limpieza completada!'
\echo ''
\echo '📝 Resumen de lo eliminado:'
\echo '   - Configuraciones de visibilidad del módulo'
\echo '   - Visibilidad por defecto en roles'
\echo '   - Asignaciones de permisos a roles'
\echo '   - Permisos del módulo ORDENES_COMPRA'
\echo ''
\echo '⚠️  NOTA: Las tablas ordenes_compra y detalle_orden_compra'
\echo '   NO fueron eliminadas del schema. Si deseas eliminarlas,'
\echo '   debes crear una migración de Prisma.'
\echo ''

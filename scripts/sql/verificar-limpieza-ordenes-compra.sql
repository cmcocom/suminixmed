-- ============================================================
-- VERIFICACIÓN DE LIMPIEZA - MÓDULO ORDENES_COMPRA
-- ============================================================
-- Fecha: 22 octubre 2025
-- Descripción: Verifica que no queden referencias al módulo
--              ORDENES_COMPRA en ninguna tabla del sistema
-- ============================================================

\echo '🔍 Verificando limpieza completa de ORDENES_COMPRA...'
\echo ''

-- 1. Verificar en rbac_permissions
\echo '1️⃣  Tabla: rbac_permissions'
SELECT COUNT(*) as total, 'rbac_permissions' as tabla
FROM rbac_permissions 
WHERE module = 'ORDENES_COMPRA';

-- 2. Verificar en module_visibility
\echo '2️⃣  Tabla: module_visibility'
SELECT COUNT(*) as total, 'module_visibility' as tabla
FROM module_visibility 
WHERE module_key = 'ORDENES_COMPRA';

-- 3. Verificar en role_default_visibility
\echo '3️⃣  Tabla: role_default_visibility'
SELECT COUNT(*) as total, 'role_default_visibility' as tabla
FROM role_default_visibility 
WHERE module_key = 'ORDENES_COMPRA';

-- 4. Verificar en rbac_role_permissions (uniones huérfanas)
\echo '4️⃣  Verificando asignaciones huérfanas en rbac_role_permissions'
SELECT COUNT(*) as asignaciones_huerfanas
FROM rbac_role_permissions rp
WHERE NOT EXISTS (
  SELECT 1 FROM rbac_permissions p WHERE p.id = rp.permission_id
);

\echo ''
\echo '✅ Verificación completada!'
\echo ''
\echo '📊 Si todos los contadores son 0, la limpieza fue exitosa.'
\echo ''

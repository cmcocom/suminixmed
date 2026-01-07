-- ============================================
-- DIAGNÓSTICO COMPLETO ROL OPERADOR
-- ============================================

\echo '=== 1. PERMISOS LEER OTORGADOS (granted=true) ==='
SELECT 
  p.module AS modulo,
  p.name AS nombre_permiso,
  rp.granted AS otorgado
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.action = 'LEER'
  AND p.is_active = true
  AND rp.granted = true
ORDER BY p.module;

\echo ''
\echo '=== 2. TOTAL DE MÓDULOS CON GRANTED=TRUE Y ACTION=LEER ==='
SELECT COUNT(DISTINCT p.module) as total_modulos_visibles
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.action = 'LEER'
  AND rp.granted = true
  AND p.is_active = true;

\echo ''
\echo '=== 3. VERIFICAR MÓDULOS ESPECÍFICOS ==='
SELECT 
  p.module,
  p.action,
  rp.granted,
  p.name
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.module IN ('INVENTARIO', 'GESTION_CATALOGOS', 'GESTION_REPORTES', 'REPORTES_SALIDAS')
  AND p.action = 'LEER'
  AND p.is_active = true;

\echo ''
\echo '=== 4. TODOS LOS PERMISOS LEER (GRANTED Y NO GRANTED) ==='
SELECT 
  p.module,
  rp.granted,
  p.name
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.action = 'LEER'
  AND p.is_active = true
ORDER BY rp.granted DESC, p.module;

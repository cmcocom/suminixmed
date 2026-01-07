-- ============================================
-- VERIFICACIÓN DE PERMISOS ROL OPERADOR
-- ============================================

\echo '=== 1. INFORMACIÓN DEL ROL OPERADOR ==='
SELECT 
  id,
  name,
  description,
  is_active,
  is_system_role
FROM rbac_roles
WHERE name = 'OPERADOR';

\echo ''
\echo '=== 2. PERMISOS ASIGNADOS AL ROL OPERADOR ==='
SELECT 
  p.module AS modulo,
  p.action AS accion,
  p.name AS permiso,
  rp.granted AS otorgado,
  p.is_active AS activo
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.is_active = true
ORDER BY p.module, p.action;

\echo ''
\echo '=== 3. RESUMEN DE PERMISOS OTORGADOS ==='
SELECT 
  p.module AS modulo,
  COUNT(*) FILTER (WHERE rp.granted = true) AS permisos_otorgados,
  COUNT(*) FILTER (WHERE rp.granted = false) AS permisos_denegados,
  COUNT(*) AS total_permisos
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.is_active = true
GROUP BY p.module
ORDER BY p.module;

\echo ''
\echo '=== 4. MÓDULOS CON PERMISO LEER OTORGADO (VISIBLES EN SIDEBAR) ==='
SELECT 
  p.module AS modulo,
  rp.granted AS visible_en_sidebar
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'OPERADOR'
  AND p.action = 'LEER'
  AND p.is_active = true
  AND rp.granted = true
ORDER BY p.module;

\echo ''
\echo '=== 5. USUARIOS CON ROL OPERADOR ==='
SELECT 
  u.email,
  u.name,
  u.activo,
  ur.assigned_at
FROM "User" u
JOIN rbac_user_roles ur ON u.id = ur.user_id
JOIN rbac_roles r ON ur.role_id = r.id
WHERE r.name = 'OPERADOR'
ORDER BY u.email;

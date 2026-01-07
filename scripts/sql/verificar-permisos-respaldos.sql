-- Script de verificación de permisos de GESTION_RESPALDOS
-- Ejecutar: psql -U postgres -d suminix -f verificar-permisos-respaldos.sql

\echo '========================================='
\echo 'VERIFICACIÓN DE PERMISOS - GESTION_RESPALDOS'
\echo '========================================='
\echo ''

\echo '1. Permisos del módulo GESTION_RESPALDOS por rol:'
\echo '-------------------------------------------------'
SELECT 
  rr.name as rol,
  rp.action as accion,
  rp.module as modulo
FROM rbac_permissions rp
JOIN rbac_role_permissions rrp ON rp.id = rrp.permission_id
JOIN rbac_roles rr ON rrp.role_id = rr.id
WHERE rp.module = 'GESTION_RESPALDOS'
ORDER BY rr.name, rp.action;

\echo ''
\echo '2. Visibilidad del módulo por rol:'
\echo '-----------------------------------'
SELECT 
  r.name as rol,
  mv.module_key as modulo,
  mv.is_visible as visible,
  mv.updated_at as actualizado
FROM rbac_module_visibility mv
JOIN rbac_roles r ON mv.role_id = r.id
WHERE mv.module_key = 'GESTION_RESPALDOS'
ORDER BY r.name;

\echo ''
\echo '3. Usuarios actuales y sus roles:'
\echo '----------------------------------'
SELECT 
  u.clave,
  u.nombre,
  r.name as rol,
  ur.assigned_at as asignado
FROM users u
JOIN rbac_user_roles ur ON u.id = ur.user_id
JOIN rbac_roles r ON ur.role_id = r.id
WHERE u.estatus = 'activo'
ORDER BY u.clave, r.name;

\echo ''
\echo '========================================='
\echo 'VERIFICACIÓN COMPLETADA'
\echo '========================================='

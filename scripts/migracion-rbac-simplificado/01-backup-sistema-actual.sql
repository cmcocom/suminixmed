-- ============================================================
-- BACKUP COMPLETO DEL SISTEMA RBAC ACTUAL
-- Fecha: 16 octubre 2025
-- Propósito: Respaldar antes de simplificar a modelo puro de roles
-- ============================================================

-- BACKUP DE TABLAS A ELIMINAR
-- ============================================================

-- 1. Backup rbac_permissions (130 permisos)
CREATE TABLE IF NOT EXISTS backup_rbac_permissions_20251016 AS
SELECT * FROM rbac_permissions;

-- 2. Backup rbac_role_permissions (asignaciones de permisos a roles)
CREATE TABLE IF NOT EXISTS backup_rbac_role_permissions_20251016 AS
SELECT * FROM rbac_role_permissions;

-- BACKUP DE TABLAS A MANTENER (por seguridad)
-- ============================================================

-- 3. Backup rbac_roles
CREATE TABLE IF NOT EXISTS backup_rbac_roles_20251016 AS
SELECT * FROM rbac_roles;

-- 4. Backup rbac_user_roles
CREATE TABLE IF NOT EXISTS backup_rbac_user_roles_20251016 AS
SELECT * FROM rbac_user_roles;

-- 5. Backup module_visibility
CREATE TABLE IF NOT EXISTS backup_module_visibility_20251016 AS
SELECT * FROM module_visibility;

-- ANÁLISIS DEL SISTEMA ACTUAL
-- ============================================================

-- Estadísticas de permisos
SELECT 
  'Total de permisos activos' AS descripcion,
  COUNT(*) AS cantidad
FROM rbac_permissions
WHERE is_active = true

UNION ALL

SELECT 
  'Módulos únicos',
  COUNT(DISTINCT module)
FROM rbac_permissions
WHERE is_active = true

UNION ALL

SELECT 
  'Acciones únicas',
  COUNT(DISTINCT action)
FROM rbac_permissions
WHERE is_active = true;

-- Permisos por módulo
SELECT 
  module,
  COUNT(*) as total_permisos,
  string_agg(DISTINCT action, ', ' ORDER BY action) as acciones
FROM rbac_permissions
WHERE is_active = true
GROUP BY module
ORDER BY module;

-- Roles y sus asignaciones
SELECT 
  r.name as rol,
  r.is_system_role,
  COUNT(DISTINCT rp.permission_id) as total_permisos_asignados,
  COUNT(DISTINCT ur.user_id) as total_usuarios
FROM rbac_roles r
LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id AND rp.granted = true
LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.is_system_role
ORDER BY r.name;

-- Usuarios y sus roles
SELECT 
  u.name as usuario,
  u.email,
  string_agg(r.name, ', ' ORDER BY r.name) as roles
FROM "User" u
LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
LEFT JOIN rbac_roles r ON ur.role_id = r.id
WHERE u.activo = true
GROUP BY u.id, u.name, u.email
ORDER BY u.name;

-- Visibilidad de módulos por rol
SELECT 
  r.name as rol,
  COUNT(mv.module_key) FILTER (WHERE mv.visible = true) as modulos_visibles,
  COUNT(mv.module_key) FILTER (WHERE mv.visible = false) as modulos_ocultos
FROM rbac_roles r
LEFT JOIN module_visibility mv ON r.id = mv.role_id
WHERE r.is_active = true
GROUP BY r.id, r.name
ORDER BY r.name;

-- ============================================
-- Script: Verificar visibilidad de menú para roles
-- Descripción: Muestra qué opciones de menú tiene cada rol
-- ============================================

-- 1. Ver todos los roles existentes
SELECT 
  id,
  name as rol,
  description as descripcion,
  is_active as activo,
  is_system_role as sistema
FROM rbac_roles
ORDER BY name;

-- 2. Ver qué opciones de menú tiene asignadas el rol ADMINISTRADOR
SELECT 
  r.name as rol,
  mv.module_key as opcion_menu,
  mv.visible as visible,
  mv.created_at as creado
FROM module_visibility mv
JOIN rbac_roles r ON r.id = mv.role_id
WHERE r.name = 'ADMINISTRADOR'
ORDER BY mv.module_key;

-- 3. Contar cuántas opciones tiene cada rol
SELECT 
  r.name as rol,
  COUNT(mv.id) as total_opciones,
  SUM(CASE WHEN mv.visible = true THEN 1 ELSE 0 END) as visibles,
  SUM(CASE WHEN mv.visible = false THEN 1 ELSE 0 END) as ocultas
FROM rbac_roles r
LEFT JOIN module_visibility mv ON mv.role_id = r.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- 4. Ver usuarios con rol ADMINISTRADOR
SELECT 
  u.id,
  u.nombre,
  u.email,
  ur.assigned_at as rol_asignado
FROM rbac_user_roles ur
JOIN rbac_roles r ON r.id = ur.role_id
JOIN "User" u ON u.id = ur.user_id
WHERE r.name = 'ADMINISTRADOR';

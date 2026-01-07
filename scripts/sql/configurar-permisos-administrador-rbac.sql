-- =====================================================
-- CONFIGURAR PERMISOS DEL ROL ADMINISTRADOR
-- Para acceder a gestión de usuarios y roles
-- =====================================================

-- ✅ PASO 1: Dar permisos de AJUSTES_USUARIOS al ADMINISTRADOR
UPDATE rbac_role_permissions
SET 
  assigned = true,
  granted = true
WHERE role_id = (SELECT id FROM rbac_roles WHERE name = 'Administrador' LIMIT 1)
  AND permission_id IN (
    SELECT id FROM rbac_permissions 
    WHERE module = 'AJUSTES_USUARIOS'
      AND action IN ('LEER', 'CREAR', 'EDITAR', 'ELIMINAR')
  );

-- ✅ PASO 2: Dar permisos de AJUSTES_RBAC al ADMINISTRADOR  
UPDATE rbac_role_permissions
SET 
  assigned = true,
  granted = true
WHERE role_id = (SELECT id FROM rbac_roles WHERE name = 'Administrador' LIMIT 1)
  AND permission_id IN (
    SELECT id FROM rbac_permissions 
    WHERE module = 'AJUSTES_RBAC'
      AND action IN ('LEER', 'CREAR', 'EDITAR', 'ELIMINAR')
  );

-- ✅ PASO 3: Verificar que los permisos se asignaron correctamente
SELECT 
  r.name as rol,
  p.module,
  p.action,
  rp.assigned,
  rp.granted
FROM rbac_roles r
INNER JOIN rbac_role_permissions rp ON rp.role_id = r.id
INNER JOIN rbac_permissions p ON p.id = rp.permission_id
WHERE r.name = 'Administrador'
  AND p.module IN ('AJUSTES_USUARIOS', 'AJUSTES_RBAC')
ORDER BY p.module, p.action;

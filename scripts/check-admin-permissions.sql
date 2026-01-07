-- Script SQL para verificar permisos del rol ADMINISTRADOR en sistema RBAC

-- 1. Verificar que existe el rol ADMINISTRADOR
\echo '========== ROL ADMINISTRADOR =========='
SELECT id, name, description, is_active, is_system_role 
FROM rbac_roles 
WHERE name = 'ADMINISTRADOR';

-- 2. Contar permisos del ADMINISTRADOR
\echo '========== TOTAL DE PERMISOS ASIGNADOS =========='
SELECT COUNT(*) as total_permisos
FROM rbac_role_permissions rp
INNER JOIN rbac_roles r ON rp.role_id = r.id
WHERE r.name = 'ADMINISTRADOR' AND rp.granted = true;

-- 3. Listar permisos detallados por módulo
\echo '========== PERMISOS DETALLADOS POR MÓDULO =========='
SELECT 
    p.module as modulo,
    p.action as accion,
    p.name as nombre_permiso,
    p.is_active as permiso_activo,
    rp.granted as otorgado
FROM rbac_role_permissions rp
INNER JOIN rbac_roles r ON rp.role_id = r.id
INNER JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'ADMINISTRADOR'
ORDER BY p.module, p.action;

-- 4. Contar módulos con permisos
\echo '========== MÓDULOS CON PERMISOS =========='
SELECT 
    p.module,
    COUNT(*) as total_permisos
FROM rbac_role_permissions rp
INNER JOIN rbac_roles r ON rp.role_id = r.id
INNER JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'ADMINISTRADOR' AND rp.granted = true AND p.is_active = true
GROUP BY p.module
ORDER BY p.module;

-- 5. Usuarios con rol ADMINISTRADOR
\echo '========== USUARIOS CON ROL ADMINISTRADOR =========='
SELECT 
    u.id,
    u.name,
    u.email,
    ur.assigned_at
FROM rbac_user_roles ur
INNER JOIN rbac_roles r ON ur.role_id = r.id
INNER JOIN "User" u ON ur.user_id = u.id
WHERE r.name = 'ADMINISTRADOR';

-- 6. Verificar module_visibility para ADMINISTRADOR
\echo '========== MODULE VISIBILITY PARA ADMINISTRADOR =========='
SELECT 
    mv.module_key,
    mv.is_visible
FROM module_visibility mv
INNER JOIN rbac_roles r ON mv.role_id = r.id
WHERE r.name = 'ADMINISTRADOR'
ORDER BY mv.module_key;

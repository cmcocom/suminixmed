-- Verificar permisos del rol UNIDADC para REPORTES_ENTRADAS_CLIENTE

-- 1. Verificar si existe el permiso para el módulo
SELECT 
    id,
    module,
    action,
    description
FROM rbac_permissions 
WHERE module = 'REPORTES_ENTRADAS_CLIENTE';

-- 2. Verificar permisos asignados al rol UNIDADC para REPORTES_ENTRADAS_CLIENTE
SELECT 
    r.name as rol_nombre,
    p.module as modulo,
    p.action as accion,
    rp.granted as tiene_permiso,
    p.created_at as fecha_creacion_permiso
FROM rbac_role_permissions rp
JOIN rbac_roles r ON rp.role_id = r.id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'UNIDADC' 
  AND p.module = 'REPORTES_ENTRADAS_CLIENTE'
ORDER BY p.action;

-- 3. Comparar con REPORTES_SALIDAS_CLIENTE (que sí funciona)
SELECT 
    r.name as rol_nombre,
    p.module as modulo,
    p.action as accion,
    rp.granted as tiene_permiso
FROM rbac_roles r
LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'UNIDADC'
  AND p.module IN ('REPORTES_SALIDAS_CLIENTE', 'REPORTES_ENTRADAS_CLIENTE')
ORDER BY p.module, p.action;

-- 4. Ver TODOS los permisos de REPORTES que tiene UNIDADC
SELECT 
    p.module as modulo,
    p.action as accion,
    rp.granted as tiene_permiso
FROM rbac_role_permissions rp
JOIN rbac_roles r ON rp.role_id = r.id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'UNIDADC' 
  AND p.module LIKE 'REPORTES%'
ORDER BY p.module, p.action;

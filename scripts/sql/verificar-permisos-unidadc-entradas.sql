-- Verificar permisos del rol UNIDADC para el módulo REPORTES_ENTRADAS_CLIENTE

-- 1. Verificar si el módulo existe
SELECT * FROM rbac_modules WHERE key = 'REPORTES_ENTRADAS_CLIENTE';

-- 2. Verificar si existe el permiso LEER para el módulo
SELECT * FROM rbac_permissions WHERE module = 'REPORTES_ENTRADAS_CLIENTE';

-- 3. Obtener el rol UNIDADC
SELECT * FROM rbac_roles WHERE name = 'UNIDADC';

-- 4. Verificar permisos asignados al rol UNIDADC para REPORTES_ENTRADAS_CLIENTE
SELECT 
    r.name as rol_nombre,
    p.module as modulo,
    p.action as accion,
    rp.granted as tiene_permiso,
    rp.created_at as fecha_asignacion
FROM rbac_role_permissions rp
JOIN rbac_roles r ON rp.role_id = r.id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'UNIDADC' 
  AND p.module = 'REPORTES_ENTRADAS_CLIENTE'
ORDER BY p.action;

-- 5. Verificar visibilidad del módulo para el rol UNIDADC
SELECT 
    r.name as rol_nombre,
    m.key as modulo_key,
    m.title as modulo_titulo,
    mv.visible as es_visible,
    mv.updated_at as ultima_actualizacion
FROM rbac_module_visibility mv
JOIN rbac_roles r ON mv.role_id = r.id
JOIN rbac_modules m ON mv.module_id = m.id
WHERE r.name = 'UNIDADC'
  AND m.key = 'REPORTES_ENTRADAS_CLIENTE';

-- 6. Comparar con el módulo de salidas (que sí funciona)
SELECT 
    r.name as rol_nombre,
    m.key as modulo_key,
    m.title as modulo_titulo,
    mv.visible as es_visible,
    rp.granted as tiene_permiso
FROM rbac_roles r
LEFT JOIN rbac_module_visibility mv ON r.id = mv.role_id
LEFT JOIN rbac_modules m ON mv.module_id = m.id
LEFT JOIN rbac_permissions p ON p.module = m.key AND p.action = 'LEER'
LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
WHERE r.name = 'UNIDADC'
  AND m.key IN ('REPORTES_SALIDAS_CLIENTE', 'REPORTES_ENTRADAS_CLIENTE')
ORDER BY m.key;

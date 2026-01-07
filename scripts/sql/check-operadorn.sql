-- Buscar el rol OPERADORN
SELECT 
    r.id,
    r.nombre,
    r.descripcion,
    r.tipo_rol,
    r.activo,
    COUNT(pr.permiso_id) as total_permisos
FROM roles r
LEFT JOIN permisos_rol pr ON pr.rol_id = r.id
WHERE r.nombre = 'OPERADORN'
GROUP BY r.id, r.nombre, r.descripcion, r.tipo_rol, r.activo;

-- Listar todos los roles
\echo '\n📊 TODOS LOS ROLES EN EL SISTEMA:'
SELECT 
    nombre,
    tipo_rol,
    activo,
    descripcion
FROM roles
ORDER BY nombre;

-- Buscar usuarios con el rol OPERADORN
\echo '\n👥 USUARIOS CON ROL OPERADORN:'
SELECT 
    u.clave,
    u.name,
    u.activo,
    r.nombre as rol
FROM user_roles ur
JOIN "User" u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.rol_id
WHERE r.nombre = 'OPERADORN';

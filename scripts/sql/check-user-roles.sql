-- Buscar usuario cristian cocom y sus roles
SELECT 
  u.id as user_id,
  u.clave,
  u.name,
  u.email,
  u.activo,
  r.id as role_id,
  r.name as role_name,
  ur.assigned_at
FROM "User" u
LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
LEFT JOIN rbac_roles r ON ur.role_id = r.id
WHERE LOWER(u.name) LIKE '%cristian%cocom%'
   OR LOWER(u.email) LIKE '%cristian%cocom%'
ORDER BY u.name, r.name;

-- Contar cuántos roles tiene cada usuario
SELECT 
  u.id,
  u.clave,
  u.name,
  u.email,
  COUNT(ur.role_id) as total_roles,
  STRING_AGG(r.name, ', ') as roles_asignados
FROM "User" u
LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
LEFT JOIN rbac_roles r ON ur.role_id = r.id
WHERE u.activo = true
GROUP BY u.id, u.clave, u.name, u.email
HAVING COUNT(ur.role_id) > 1
ORDER BY total_roles DESC, u.name;

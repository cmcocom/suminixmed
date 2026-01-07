-- Verificación de datos en suminix_evolucionado
SELECT 'Inventario' as tabla, count(*) as registros FROM "Inventario"
UNION ALL
SELECT 'Usuarios', count(*) FROM "User"
UNION ALL
SELECT 'Clientes', count(*) FROM clientes
UNION ALL
SELECT 'Proveedores', count(*) FROM proveedores
UNION ALL
SELECT 'Entradas', count(*) FROM entradas_inventario
UNION ALL
SELECT 'Salidas', count(*) FROM salidas_inventario
UNION ALL
SELECT 'RBAC Roles', count(*) FROM rbac_roles
UNION ALL
SELECT 'RBAC Permisos', count(*) FROM rbac_permissions;
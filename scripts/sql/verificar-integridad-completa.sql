-- Verificacion de integridad completa de todas las tablas principales
-- Antes de crear respaldo

-- Tablas de inventario (CRITICAS)
SELECT 'Inventario' as tabla, COUNT(*) as registros FROM "Inventario"
UNION ALL
SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario
UNION ALL
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
UNION ALL
SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario
UNION ALL
SELECT 'partidas_salida_inventario', COUNT(*) FROM partidas_salida_inventario

UNION ALL

-- Tablas de entidades (CRITICAS)
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'empleados', COUNT(*) FROM empleados

UNION ALL

-- Tablas de usuarios y sesiones
SELECT 'User', COUNT(*) FROM "User"
UNION ALL
SELECT 'active_sessions', COUNT(*) FROM active_sessions

UNION ALL

-- Tablas RBAC
SELECT 'rbac_permissions', COUNT(*) FROM rbac_permissions
UNION ALL
SELECT 'rbac_roles', COUNT(*) FROM rbac_roles
UNION ALL
SELECT 'rbac_role_permissions', COUNT(*) FROM rbac_role_permissions
UNION ALL
SELECT 'rbac_module_visibility', COUNT(*) FROM rbac_module_visibility

UNION ALL

-- Auditoria
SELECT 'audit_log', COUNT(*) FROM audit_log

ORDER BY tabla;

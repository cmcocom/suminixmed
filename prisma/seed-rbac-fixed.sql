-- Seed inicial para el sistema RBAC dinámico
-- Este script llena las tablas con datos básicos para comenzar

-- Primero limpiamos datos existentes (solo RBAC dinámico)
DELETE FROM rbac_role_permissions;
DELETE FROM rbac_user_roles;
DELETE FROM rbac_permissions WHERE id > 0;
DELETE FROM rbac_roles WHERE id > 0;

-- Reiniciar secuencias
ALTER SEQUENCE rbac_roles_id_seq RESTART WITH 1;
ALTER SEQUENCE rbac_permissions_id_seq RESTART WITH 1;

-- Insertar roles dinámicos básicos
INSERT INTO rbac_roles (name, description, is_active, created_by) VALUES
('Super Admin', 'Acceso completo al sistema incluyendo RBAC', true, 'system'),
('Admin RBAC', 'Gestión completa de roles y permisos', true, 'system'),
('Gestor Usuarios', 'Gestión de usuarios sin modificar RBAC', true, 'system'),
('Auditor', 'Solo lectura de logs y auditoría', true, 'system');

-- Insertar permisos dinámicos por módulo
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
-- Dashboard
('Leer Dashboard', 'Ver estadísticas del dashboard', 'DASHBOARD', 'LEER', true, 'system'),

-- RBAC - Roles
('Leer Roles', 'Ver lista de roles', 'RBAC', 'ROLES_LEER', true, 'system'),
('Crear Roles', 'Crear nuevos roles', 'RBAC', 'ROLES_CREAR', true, 'system'),
('Editar Roles', 'Modificar roles existentes', 'RBAC', 'ROLES_EDITAR', true, 'system'),
('Eliminar Roles', 'Eliminar roles del sistema', 'RBAC', 'ROLES_ELIMINAR', true, 'system'),

-- RBAC - Permisos
('Leer Permisos', 'Ver lista de permisos', 'RBAC', 'PERMISOS_LEER', true, 'system'),
('Crear Permisos', 'Crear nuevos permisos', 'RBAC', 'PERMISOS_CREAR', true, 'system'),
('Editar Permisos', 'Modificar permisos existentes', 'RBAC', 'PERMISOS_EDITAR', true, 'system'),
('Eliminar Permisos', 'Eliminar permisos del sistema', 'RBAC', 'PERMISOS_ELIMINAR', true, 'system'),

-- RBAC - Asignaciones
('Asignar Permisos a Roles', 'Asignar/revocar permisos a roles', 'RBAC', 'ASIGNAR_PERMISOS', true, 'system'),
('Asignar Roles a Usuarios', 'Asignar/revocar roles a usuarios', 'RBAC', 'ASIGNAR_ROLES', true, 'system'),

-- Auditoría
('Leer Auditoría', 'Ver logs de auditoría', 'AUDITORIA', 'LEER', true, 'system'),
('Exportar Auditoría', 'Exportar logs de auditoría', 'AUDITORIA', 'EXPORTAR', true, 'system'),

-- Usuarios (complementa permisos estáticos)
('Gestión Avanzada Usuarios', 'Operaciones avanzadas en usuarios', 'USUARIOS', 'GESTION_AVANZADA', true, 'system'),

-- Inventario (complementa permisos estáticos)
('Reportes Inventario', 'Generar reportes de inventario', 'INVENTARIO', 'REPORTES', true, 'system'),
('Auditoría Inventario', 'Auditar cambios en inventario', 'INVENTARIO', 'AUDITORIA', true, 'system');

-- Asignar permisos al rol "Super Admin" (todos los permisos)
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT 1, id, true, 'system', NOW()
FROM rbac_permissions
WHERE is_active = true;

-- Asignar permisos al rol "Admin RBAC" (solo RBAC y auditoría)
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT 2, id, true, 'system', NOW()
FROM rbac_permissions
WHERE module IN ('RBAC', 'AUDITORIA') AND is_active = true;

-- Asignar permisos al rol "Gestor Usuarios" (usuarios sin RBAC)
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT 3, id, true, 'system', NOW()
FROM rbac_permissions
WHERE module IN ('USUARIOS', 'DASHBOARD') AND is_active = true;

-- Asignar permisos al rol "Auditor" (solo lectura)
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT 4, id, true, 'system', NOW()
FROM rbac_permissions
WHERE action LIKE '%LEER%' OR action = 'LEER' AND is_active = true;

-- Verificar la inserción
SELECT 
  'Datos iniciales insertados correctamente:' as mensaje,
  (SELECT COUNT(*) FROM rbac_roles WHERE is_active = true) as roles_activos,
  (SELECT COUNT(*) FROM rbac_permissions WHERE is_active = true) as permisos_activos,
  (SELECT COUNT(*) FROM rbac_role_permissions WHERE granted = true) as asignaciones_permisos;
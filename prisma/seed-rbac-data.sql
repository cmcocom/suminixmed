-- Poblar datos iniciales para el sistema RBAC

-- Insertar roles básicos
INSERT INTO rbac_roles (name, description, is_active, created_by) VALUES
('Administrador Sistema', 'Acceso completo al sistema de gestión de roles y permisos', true, 'sistema'),
('Gestor Usuarios', 'Gestión de usuarios y asignación de roles básicos', true, 'sistema'),
('Operador Avanzado', 'Operaciones avanzadas con permisos limitados', true, 'sistema'),
('Consultor', 'Solo consulta de información del sistema', true, 'sistema');

-- Insertar permisos básicos por módulo
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
-- Módulo USUARIOS
('Listar Usuarios', 'Permite ver la lista de usuarios del sistema', 'USUARIOS', 'LEER', true, 'sistema'),
('Crear Usuarios', 'Permite crear nuevos usuarios en el sistema', 'USUARIOS', 'CREAR', true, 'sistema'),
('Editar Usuarios', 'Permite modificar información de usuarios existentes', 'USUARIOS', 'EDITAR', true, 'sistema'),
('Eliminar Usuarios', 'Permite eliminar usuarios del sistema', 'USUARIOS', 'ELIMINAR', true, 'sistema'),
('Gestionar Roles', 'Permite administrar roles y permisos', 'USUARIOS', 'ADMINISTRAR_PERMISOS', true, 'sistema'),

-- Módulo INVENTARIO
('Ver Inventario', 'Permite consultar el inventario de productos', 'INVENTARIO', 'LEER', true, 'sistema'),
('Crear Productos', 'Permite agregar nuevos productos al inventario', 'INVENTARIO', 'CREAR', true, 'sistema'),
('Editar Inventario', 'Permite modificar información de productos', 'INVENTARIO', 'EDITAR', true, 'sistema'),
('Eliminar Productos', 'Permite eliminar productos del inventario', 'INVENTARIO', 'ELIMINAR', true, 'sistema'),
('Gestionar Salidas', 'Permite procesar salidas de inventario', 'INVENTARIO', 'SALIDA', true, 'sistema'),

-- Módulo REPORTES
('Ver Reportes', 'Permite acceder a los reportes del sistema', 'REPORTES', 'LEER', true, 'sistema'),
('Crear Reportes', 'Permite generar nuevos reportes', 'REPORTES', 'CREAR', true, 'sistema'),
('Configurar Reportes', 'Permite configurar el generador de reportes', 'REPORTES', 'CONFIGURAR', true, 'sistema'),

-- Módulo CLIENTES
('Ver Clientes', 'Permite consultar información de clientes', 'CLIENTES', 'LEER', true, 'sistema'),
('Crear Clientes', 'Permite registrar nuevos clientes', 'CLIENTES', 'CREAR', true, 'sistema'),
('Editar Clientes', 'Permite modificar información de clientes', 'CLIENTES', 'EDITAR', true, 'sistema'),
('Eliminar Clientes', 'Permite eliminar clientes del sistema', 'CLIENTES', 'ELIMINAR', true, 'sistema'),

-- Módulo AJUSTES
('Ver Configuración', 'Permite acceder a la configuración del sistema', 'AJUSTES', 'LEER', true, 'sistema'),
('Modificar Configuración', 'Permite cambiar configuraciones del sistema', 'AJUSTES', 'EDITAR', true, 'sistema');

-- Asignar permisos a roles
-- Administrador Sistema (todos los permisos)
INSERT INTO rbac_role_permissions (role_id, permission_id, created_by)
SELECT 1, p.id, 'sistema'
FROM rbac_permissions p
WHERE p.is_active = true;

-- Gestor Usuarios (permisos de usuarios y reportes básicos)
INSERT INTO rbac_role_permissions (role_id, permission_id, created_by)
SELECT 2, p.id, 'sistema'
FROM rbac_permissions p
WHERE p.module IN ('USUARIOS', 'REPORTES') 
AND p.action IN ('LEER', 'CREAR', 'EDITAR', 'ADMINISTRAR_PERMISOS')
AND p.is_active = true;

-- Operador Avanzado (inventario completo, clientes, reportes básicos)
INSERT INTO rbac_role_permissions (role_id, permission_id, created_by)
SELECT 3, p.id, 'sistema'
FROM rbac_permissions p
WHERE (
    (p.module = 'INVENTARIO' AND p.action IN ('LEER', 'CREAR', 'EDITAR', 'SALIDA')) OR
    (p.module = 'CLIENTES' AND p.action IN ('LEER', 'CREAR', 'EDITAR')) OR
    (p.module = 'REPORTES' AND p.action = 'LEER')
) AND p.is_active = true;

-- Consultor (solo lectura)
INSERT INTO rbac_role_permissions (role_id, permission_id, created_by)
SELECT 4, p.id, 'sistema'
FROM rbac_permissions p
WHERE p.action = 'LEER'
AND p.is_active = true;

-- Mensaje de confirmación
SELECT 
    'Datos iniciales insertados correctamente:' as mensaje,
    (SELECT COUNT(*) FROM rbac_roles WHERE is_active = true) as roles_activos,
    (SELECT COUNT(*) FROM rbac_permissions WHERE is_active = true) as permisos_activos,
    (SELECT COUNT(*) FROM rbac_role_permissions) as asignaciones_permisos;
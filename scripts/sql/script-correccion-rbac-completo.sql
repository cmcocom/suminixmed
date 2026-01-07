-- Script completo de corrección RBAC
-- Completa todos los módulos y permisos faltantes y configura roles apropiados
-- Generado: 2025-09-17

BEGIN;

-- 1. Limpiar permisos duplicados o inconsistentes
DELETE FROM rbac_role_permissions WHERE permission_id IN (
    SELECT id FROM rbac_permissions WHERE module IN ('dashboard', 'inventario', 'rbac', 'usuarios')
);

DELETE FROM rbac_permissions WHERE module IN ('dashboard', 'inventario', 'rbac', 'usuarios');

-- 2. Insertar todos los permisos nuevos con nombres y descripciones mejoradas

-- DASHBOARD - Panel principal
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Dashboard', 'Acceso al panel principal del sistema', 'DASHBOARD', 'LEER', true, 'sistema'),
('Configurar Indicadores', 'Configurar y personalizar indicadores del dashboard', 'DASHBOARD', 'CONFIGURAR_INDICADORES', true, 'sistema');

-- USUARIOS - Gestión de usuarios
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Usuarios', 'Consultar listado y detalles de usuarios', 'USUARIOS', 'LEER', true, 'sistema'),
('Crear Usuarios', 'Registrar nuevos usuarios en el sistema', 'USUARIOS', 'CREAR', true, 'sistema'),
('Editar Usuarios', 'Modificar información de usuarios existentes', 'USUARIOS', 'EDITAR', true, 'sistema'),
('Eliminar Usuarios', 'Eliminar usuarios del sistema', 'USUARIOS', 'ELIMINAR', true, 'sistema'),
('Activar/Desactivar Usuarios', 'Habilitar o deshabilitar acceso de usuarios', 'USUARIOS', 'ACTIVAR_DESACTIVAR', true, 'sistema'),
('Cambiar Rol de Usuario', 'Modificar el rol asignado a un usuario', 'USUARIOS', 'CAMBIAR_ROL', true, 'sistema');

-- RBAC - Control de acceso basado en roles
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Roles', 'Consultar roles del sistema', 'RBAC', 'ROLES_LEER', true, 'sistema'),
('Crear Roles', 'Crear nuevos roles en el sistema', 'RBAC', 'ROLES_CREAR', true, 'sistema'),
('Editar Roles', 'Modificar roles existentes', 'RBAC', 'ROLES_EDITAR', true, 'sistema'),
('Eliminar Roles', 'Eliminar roles del sistema', 'RBAC', 'ROLES_ELIMINAR', true, 'sistema'),
('Ver Permisos', 'Consultar permisos del sistema', 'RBAC', 'PERMISOS_LEER', true, 'sistema'),
('Crear Permisos', 'Crear nuevos permisos', 'RBAC', 'PERMISOS_CREAR', true, 'sistema'),
('Editar Permisos', 'Modificar permisos existentes', 'RBAC', 'PERMISOS_EDITAR', true, 'sistema'),
('Eliminar Permisos', 'Eliminar permisos del sistema', 'RBAC', 'PERMISOS_ELIMINAR', true, 'sistema'),
('Asignar Roles', 'Asignar y revocar roles a usuarios', 'RBAC', 'ASIGNAR_ROLES', true, 'sistema'),
('Asignar Permisos', 'Asignar y revocar permisos a roles', 'RBAC', 'ASIGNAR_PERMISOS', true, 'sistema');

-- INVENTARIO - Gestión de productos
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Inventario', 'Consultar productos y stock', 'INVENTARIO', 'LEER', true, 'sistema'),
('Crear Productos', 'Agregar nuevos productos al inventario', 'INVENTARIO', 'CREAR', true, 'sistema'),
('Editar Productos', 'Modificar información de productos', 'INVENTARIO', 'EDITAR', true, 'sistema'),
('Eliminar Productos', 'Eliminar productos del inventario', 'INVENTARIO', 'ELIMINAR', true, 'sistema'),
('Registrar Entradas', 'Procesar entradas de inventario', 'INVENTARIO', 'ENTRADA', true, 'sistema'),
('Procesar Salidas', 'Procesar salidas de inventario', 'INVENTARIO', 'SALIDA', true, 'sistema'),
('Ajustar Stock', 'Realizar ajustes de inventario', 'INVENTARIO', 'AJUSTAR_STOCK', true, 'sistema');

-- CATEGORIAS - Gestión de categorías
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Categorías', 'Consultar categorías de productos', 'CATEGORIAS', 'LEER', true, 'sistema'),
('Crear Categorías', 'Crear nuevas categorías', 'CATEGORIAS', 'CREAR', true, 'sistema'),
('Editar Categorías', 'Modificar categorías existentes', 'CATEGORIAS', 'EDITAR', true, 'sistema'),
('Eliminar Categorías', 'Eliminar categorías del sistema', 'CATEGORIAS', 'ELIMINAR', true, 'sistema');

-- CLIENTES - Gestión de clientes
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Clientes', 'Consultar información de clientes', 'CLIENTES', 'LEER', true, 'sistema'),
('Crear Clientes', 'Registrar nuevos clientes', 'CLIENTES', 'CREAR', true, 'sistema'),
('Editar Clientes', 'Modificar información de clientes', 'CLIENTES', 'EDITAR', true, 'sistema'),
('Eliminar Clientes', 'Eliminar clientes del sistema', 'CLIENTES', 'ELIMINAR', true, 'sistema');

-- PROVEEDORES - Gestión de proveedores
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Proveedores', 'Consultar información de proveedores', 'PROVEEDORES', 'LEER', true, 'sistema'),
('Crear Proveedores', 'Registrar nuevos proveedores', 'PROVEEDORES', 'CREAR', true, 'sistema'),
('Editar Proveedores', 'Modificar información de proveedores', 'PROVEEDORES', 'EDITAR', true, 'sistema'),
('Eliminar Proveedores', 'Eliminar proveedores del sistema', 'PROVEEDORES', 'ELIMINAR', true, 'sistema');

-- ENTIDADES - Gestión de entidades
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Entidades', 'Consultar entidades del sistema', 'ENTIDADES', 'LEER', true, 'sistema'),
('Crear Entidades', 'Registrar nuevas entidades', 'ENTIDADES', 'CREAR', true, 'sistema'),
('Editar Entidades', 'Modificar información de entidades', 'ENTIDADES', 'EDITAR', true, 'sistema'),
('Eliminar Entidades', 'Eliminar entidades del sistema', 'ENTIDADES', 'ELIMINAR', true, 'sistema'),
('Activar/Desactivar Entidades', 'Cambiar estado de entidades', 'ENTIDADES', 'ACTIVAR_DESACTIVAR', true, 'sistema');

-- STOCK_FIJO - Gestión de fondos fijos
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Stock Fijo', 'Consultar fondos fijos y asignaciones', 'STOCK_FIJO', 'LEER', true, 'sistema'),
('Crear Stock Fijo', 'Crear nuevos fondos fijos', 'STOCK_FIJO', 'CREAR', true, 'sistema'),
('Editar Stock Fijo', 'Modificar configuración de fondos fijos', 'STOCK_FIJO', 'EDITAR', true, 'sistema'),
('Eliminar Stock Fijo', 'Eliminar fondos fijos', 'STOCK_FIJO', 'ELIMINAR', true, 'sistema'),
('Restablecer Stock Fijo', 'Ejecutar restablecimiento de fondos fijos', 'STOCK_FIJO', 'RESTABLECER', true, 'sistema');

-- REPORTES - Generación de reportes
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Reportes', 'Acceder al módulo de reportes', 'REPORTES', 'LEER', true, 'sistema'),
('Crear Reportes', 'Diseñar nuevos reportes', 'REPORTES', 'CREAR', true, 'sistema'),
('Editar Reportes', 'Modificar reportes existentes', 'REPORTES', 'EDITAR', true, 'sistema'),
('Eliminar Reportes', 'Eliminar reportes del sistema', 'REPORTES', 'ELIMINAR', true, 'sistema'),
('Ejecutar Reportes', 'Generar y ejecutar reportes', 'REPORTES', 'EJECUTAR', true, 'sistema'),
('Exportar Reportes', 'Exportar reportes a diferentes formatos', 'REPORTES', 'EXPORTAR', true, 'sistema');

-- INDICADORES - Gestión de indicadores
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Indicadores', 'Consultar indicadores del sistema', 'INDICADORES', 'LEER', true, 'sistema'),
('Crear Indicadores', 'Crear nuevos indicadores', 'INDICADORES', 'CREAR', true, 'sistema'),
('Editar Indicadores', 'Modificar indicadores existentes', 'INDICADORES', 'EDITAR', true, 'sistema'),
('Eliminar Indicadores', 'Eliminar indicadores del sistema', 'INDICADORES', 'ELIMINAR', true, 'sistema'),
('Configurar Indicadores', 'Configurar parámetros de indicadores', 'INDICADORES', 'CONFIGURAR', true, 'sistema');

-- SESIONES - Gestión de sesiones
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Sesiones', 'Consultar sesiones activas', 'SESIONES', 'LEER', true, 'sistema'),
('Administrar Sesiones', 'Gestionar sesiones de usuarios', 'SESIONES', 'ADMINISTRAR', true, 'sistema'),
('Limpiar Sesiones', 'Ejecutar limpieza de sesiones', 'SESIONES', 'LIMPIAR', true, 'sistema');

-- AUDITORIA - Auditoría del sistema
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Auditoría', 'Consultar logs de auditoría', 'AUDITORIA', 'LEER', true, 'sistema'),
('Exportar Auditoría', 'Exportar logs de auditoría', 'AUDITORIA', 'EXPORTAR', true, 'sistema');

-- CONFIGURACION - Configuración del sistema
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Ver Configuración', 'Acceder a configuraciones del sistema', 'CONFIGURACION', 'LEER', true, 'sistema'),
('Editar Configuración', 'Modificar configuraciones del sistema', 'CONFIGURACION', 'EDITAR', true, 'sistema');

-- UPLOAD - Gestión de archivos
INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by) VALUES
('Subir Archivos', 'Cargar archivos al sistema', 'UPLOAD', 'SUBIR', true, 'sistema'),
('Eliminar Archivos', 'Eliminar archivos del sistema', 'UPLOAD', 'ELIMINAR', true, 'sistema');

-- 3. Asignar permisos a roles existentes de forma inteligente

-- REMOVED: DESARROLLADOR role allocation (removed per request)
-- (Original logic to grant ALL permissions to DESARROLLADOR has been disabled)
-- NOTE: If needed, consult git history to restore this behavior.

-- ADMINISTRADOR: Todos los permisos excepto algunos críticos de RBAC
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT r.id, p.id, true, 'sistema', NOW()
FROM rbac_roles r 
CROSS JOIN rbac_permissions p 
WHERE r.name = 'ADMINISTRADOR' 
    AND p.is_active = true
    AND NOT (p.module = 'RBAC' AND p.action IN ('ROLES_ELIMINAR', 'PERMISOS_ELIMINAR'))
    AND NOT (p.module = 'ENTIDADES' AND p.action IN ('CREAR', 'ELIMINAR'))
ON CONFLICT (role_id, permission_id) DO UPDATE SET 
    granted = true, 
    granted_by = 'sistema', 
    granted_at = NOW();

-- REMOVED: COLABORADOR role allocation (removed per request)
-- (Original logic to grant operational permissions to COLABORADOR has been disabled)
-- NOTE: If needed, consult git history to restore this behavior.

-- OPERADOR: Solo permisos de lectura y operaciones básicas
INSERT INTO rbac_role_permissions (role_id, permission_id, granted, granted_by, granted_at)
SELECT r.id, p.id, true, 'sistema', NOW()
FROM rbac_roles r 
CROSS JOIN rbac_permissions p 
WHERE r.name = 'OPERADOR' 
    AND p.is_active = true
    AND (
        p.action = 'LEER' 
        OR (p.module = 'INVENTARIO' AND p.action IN ('ENTRADA', 'SALIDA'))
        OR (p.module = 'UPLOAD' AND p.action = 'SUBIR')
        OR (p.module = 'REPORTES' AND p.action = 'EJECUTAR')
    )
ON CONFLICT (role_id, permission_id) DO UPDATE SET 
    granted = true, 
    granted_by = 'sistema', 
    granted_at = NOW();

-- 4. Registrar en auditoría
INSERT INTO rbac_audit_log (table_name, operation, record_id, old_values, new_values, user_id, created_at)
VALUES (
    'rbac_permissions',
    'BULK_UPDATE_COMPLETE_MODULES',
    'SYSTEM',
    NULL,
    jsonb_build_object(
        'modules_added', ARRAY['DASHBOARD', 'USUARIOS', 'RBAC', 'INVENTARIO', 'CATEGORIAS', 'CLIENTES', 'PROVEEDORES', 'ENTIDADES', 'STOCK_FIJO', 'REPORTES', 'INDICADORES', 'SESIONES', 'AUDITORIA', 'CONFIGURACION', 'UPLOAD'],
        'total_permissions', (SELECT COUNT(*) FROM rbac_permissions WHERE is_active = true),
        'correction_date', NOW()
    ),
    'sistema',
    NOW()
);

COMMIT;

-- Verificar resultados
SELECT 
    'Módulos configurados:' as tipo,
    COUNT(DISTINCT module) as cantidad
FROM rbac_permissions 
WHERE is_active = true

UNION ALL

SELECT 
    'Total permisos:' as tipo,
    COUNT(*) as cantidad
FROM rbac_permissions 
WHERE is_active = true

UNION ALL

SELECT 
    'Permisos por rol:' as tipo,
    NULL as cantidad
FROM rbac_permissions 
LIMIT 1;

-- Mostrar permisos por rol
SELECT 
    r.name as rol,
    COUNT(rp.permission_id) as total_permisos,
    string_agg(DISTINCT p.module, ', ' ORDER BY p.module) as modulos
FROM rbac_roles r
LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id AND rp.granted = true
LEFT JOIN rbac_permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.name
ORDER BY r.name;
-- Crear tabla module_visibility para control de visibilidad del sidebar
-- Ejecutar: psql -d suminix -f crear-tabla-module-visibility.sql

-- Crear la tabla module_visibility
CREATE TABLE IF NOT EXISTS module_visibility (
    id VARCHAR(255) PRIMARY KEY,
    module_key VARCHAR(100) NOT NULL,
    visible BOOLEAN NOT NULL DEFAULT true,
    user_id VARCHAR(255) NULL,
    role_id VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_module_visibility_user 
        FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_module_visibility_role 
        FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_module_visibility_user_id ON module_visibility(user_id);
CREATE INDEX IF NOT EXISTS idx_module_visibility_role_id ON module_visibility(role_id);
CREATE INDEX IF NOT EXISTS idx_module_visibility_module_key ON module_visibility(module_key);
CREATE INDEX IF NOT EXISTS idx_module_visibility_user_role_module ON module_visibility(user_id, role_id, module_key);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_module_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_module_visibility_updated_at
    BEFORE UPDATE ON module_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_module_visibility_updated_at();

-- Insertar configuraciones por defecto para roles existentes
-- Configuración para rol 'operador' - solo solicitudes y reportes
INSERT INTO module_visibility (id, module_key, visible, role_id, user_id) 
SELECT 
    'mv_op_' || module_key || '_default',
    module_key,
    CASE 
        WHEN module_key IN ('SOLICITUDES', 'REPORTES') THEN true
        ELSE false
    END as visible,
    r.id as role_id,
    NULL as user_id
FROM (
    VALUES 
        ('DASHBOARD'),
        ('ENTRADAS'),
        ('SALIDAS'),
        ('SURTIDO'),
        ('INVENTARIO'),
        ('PRODUCTOS'),
        ('STOCK_FIJO'),
        ('CATEGORIAS'),
        ('CLIENTES'),
        ('PROVEEDORES'),
        ('SOLICITUDES'),
        ('REPORTES'),
        ('AJUSTES'),
        ('USUARIOS'),
        ('RBAC'),
        ('PERMISOS_INDICADORES'),
        ('GESTION_CATALOGOS'),
        ('GESTION_REPORTES'),
        ('ENTIDADES')
) AS modules(module_key)
CROSS JOIN rbac_roles r
WHERE r.name = 'operador'
ON CONFLICT (id) DO NOTHING;

-- Configuración para rol 'administrador' - todo excepto RBAC, indicadores, gestión reportes
INSERT INTO module_visibility (id, module_key, visible, role_id, user_id) 
SELECT 
    'mv_admin_' || module_key || '_default',
    module_key,
    CASE 
        WHEN module_key IN ('RBAC', 'PERMISOS_INDICADORES', 'GESTION_REPORTES') THEN false
        ELSE true
    END as visible,
    r.id as role_id,
    NULL as user_id
FROM (
    VALUES 
        ('DASHBOARD'),
        ('ENTRADAS'),
        ('SALIDAS'),
        ('SURTIDO'),
        ('INVENTARIO'),
        ('PRODUCTOS'),
        ('STOCK_FIJO'),
        ('CATEGORIAS'),
        ('CLIENTES'),
        ('PROVEEDORES'),
        ('SOLICITUDES'),
        ('REPORTES'),
        ('AJUSTES'),
        ('USUARIOS'),
        ('RBAC'),
        ('PERMISOS_INDICADORES'),
        ('GESTION_CATALOGOS'),
        ('GESTION_REPORTES'),
        ('ENTIDADES')
) AS modules(module_key)
CROSS JOIN rbac_roles r
WHERE r.name = 'administrador'
ON CONFLICT (id) DO NOTHING;

-- Configuración para rol 'desarrollador' - acceso completo
-- REMOVED: default module visibility for role 'desarrollador'
-- This block was removed per project decision to eliminate the DESARROLLADOR role.
-- If restoration is required, consult git history and backups.

-- Verificar que la tabla se creó correctamente
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT role_id) as roles_configured,
    COUNT(DISTINCT module_key) as modules_configured
FROM module_visibility;

SELECT 'Tabla module_visibility creada exitosamente' as resultado;
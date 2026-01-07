-- ============================================================================
-- FASE 2: MIGRACIÓN RBAC V2 - CREAR TABLA rbac_module_visibility 
-- ============================================================================
-- Crear la tabla que falta en suminix_evolucionado pero existe en producción

\echo '🚀 INICIANDO FASE 2: MIGRACIÓN RBAC V2'
\echo '============================================'

-- Conectar a la base evolucionada
\c suminix_evolucionado

-- Verificar estado inicial
\echo '\n📊 VERIFICACIÓN INICIAL:'
SELECT 'rbac_roles' as tabla, count(*) as registros FROM rbac_roles
UNION ALL
SELECT 'rbac_permissions', count(*) FROM rbac_permissions
UNION ALL  
SELECT 'rbac_role_permissions', count(*) FROM rbac_role_permissions
ORDER BY tabla;

\echo '\n🔧 CREANDO TABLA rbac_module_visibility...'

-- Crear la tabla rbac_module_visibility
CREATE TABLE IF NOT EXISTS rbac_module_visibility (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    module_key VARCHAR(100) NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT rbac_module_visibility_role_id_module_key_key 
        UNIQUE (role_id, module_key),
    
    -- Foreign key
    CONSTRAINT rbac_module_visibility_role_id_fkey 
        FOREIGN KEY (role_id) 
        REFERENCES rbac_roles(id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

\echo '\n🔍 CREANDO ÍNDICES...'

-- Crear índices
CREATE INDEX IF NOT EXISTS rbac_module_visibility_module_key_idx 
    ON rbac_module_visibility (module_key);

CREATE INDEX IF NOT EXISTS rbac_module_visibility_role_id_idx 
    ON rbac_module_visibility (role_id);

CREATE INDEX IF NOT EXISTS rbac_module_visibility_role_id_is_visible_idx 
    ON rbac_module_visibility (role_id, is_visible);

\echo '\n✅ TABLA Y ÍNDICES CREADOS'

\echo '\n📋 CONFIGURACIÓN INICIAL DE VISIBILIDAD DE MÓDULOS:'
\echo 'Insertando configuración básica para todos los roles...'

-- Insertar configuración básica de visibilidad para todos los roles existentes
INSERT INTO rbac_module_visibility (
    id, role_id, module_key, is_visible, created_by, created_at, updated_at
) 
SELECT 
    gen_random_uuid()::text as id,
    r.id as role_id,
    modulo.key as module_key,
    CASE 
        WHEN r.name = 'DESARROLLADOR' THEN true
        WHEN r.name = 'ADMINISTRADOR' THEN true  
        WHEN r.name = 'COLABORADOR' THEN modulo.key NOT IN ('AJUSTES_RBAC', 'AJUSTES_USUARIOS')
        WHEN r.name = 'OPERADOR' THEN modulo.key IN ('INVENTARIO', 'CATALOGOS', 'REPORTES')
        ELSE false
    END as is_visible,
    'SISTEMA_MIGRACION' as created_by,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM rbac_roles r
CROSS JOIN (
    VALUES 
    ('INVENTARIO'),
    ('CATALOGOS'),
    ('CATALOGOS_ALMACENES'),
    ('CATALOGOS_CATEGORIAS'), 
    ('CATALOGOS_CLIENTES'),
    ('CATALOGOS_EMPLEADOS'),
    ('CATALOGOS_PROVEEDORES'),
    ('CATALOGOS_UNIDADES'),
    ('MOVIMIENTOS'),
    ('MOVIMIENTOS_ENTRADAS'),
    ('MOVIMIENTOS_SALIDAS'),
    ('MOVIMIENTOS_AJUSTES'),
    ('REPORTES'),
    ('REPORTES_INVENTARIO'),
    ('REPORTES_MOVIMIENTOS'),
    ('REPORTES_OPERATIVOS'),
    ('AJUSTES'),
    ('AJUSTES_ENTIDAD'),
    ('AJUSTES_USUARIOS'),
    ('AJUSTES_RBAC'),
    ('AJUSTES_AUDITORIA'),
    ('DASHBOARD')
) AS modulo(key)
ON CONFLICT (role_id, module_key) DO NOTHING;

\echo '\n📊 VERIFICACIÓN FINAL:'

-- Verificar los registros insertados
SELECT 
    r.name as rol,
    count(mv.id) as modulos_configurados,
    count(CASE WHEN mv.is_visible = true THEN 1 END) as visibles,
    count(CASE WHEN mv.is_visible = false THEN 1 END) as ocultos
FROM rbac_roles r
LEFT JOIN rbac_module_visibility mv ON r.id = mv.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

\echo '\n✅ FASE 2 COMPLETADA - RBAC V2 MIGRADO'
\echo 'La tabla rbac_module_visibility fue creada e inicializada con éxito'

-- Mostrar algunas configuraciones de ejemplo
\echo '\n🔍 CONFIGURACIONES DE EJEMPLO:'
SELECT 
    r.name as rol,
    mv.module_key as modulo,
    mv.is_visible as visible
FROM rbac_module_visibility mv
JOIN rbac_roles r ON r.id = mv.role_id 
WHERE mv.module_key IN ('INVENTARIO', 'AJUSTES_RBAC', 'CATALOGOS')
ORDER BY r.name, mv.module_key;

\echo '\n🎉 ¡FASE 2 FINALIZADA CON ÉXITO!'
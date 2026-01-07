-- Script para habilitar visibilidad de GESTION_RESPALDOS para todos los roles
-- Ejecutar: psql -U postgres -d suminix -f habilitar-modulo-respaldos.sql

BEGIN;

\echo '========================================='
\echo 'HABILITANDO MODULO GESTION_RESPALDOS'
\echo '========================================='
\echo ''

-- Insertar visibilidad para todos los roles si no existe
INSERT INTO rbac_module_visibility (id, role_id, module_key, is_visible, created_by, created_at, updated_at)
SELECT 
  'modvis_' || r.id || '_respaldos',
  r.id,
  'GESTION_RESPALDOS',
  true,
  'SYSTEM',
  NOW(),
  NOW()
FROM rbac_roles r
WHERE NOT EXISTS (
  SELECT 1 
  FROM rbac_module_visibility mv 
  WHERE mv.role_id = r.id 
  AND mv.module_key = 'GESTION_RESPALDOS'
)
ON CONFLICT (role_id, module_key) DO UPDATE
SET 
  is_visible = true,
  updated_at = NOW();

\echo ''
\echo 'Verificando visibilidad creada:'
\echo '--------------------------------'
SELECT 
  r.name as rol,
  mv.module_key as modulo,
  mv.is_visible as visible
FROM rbac_module_visibility mv
JOIN rbac_roles r ON mv.role_id = r.id
WHERE mv.module_key = 'GESTION_RESPALDOS'
ORDER BY r.name;

\echo ''
\echo '========================================='
\echo 'MODULO HABILITADO CORRECTAMENTE'
\echo '========================================='
\echo ''
\echo 'Ahora todos los roles pueden ver el modulo GESTION_RESPALDOS'
\echo 'en el menu Ajustes -> Respaldos de Base de Datos'
\echo ''

COMMIT;

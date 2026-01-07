-- ============================================================================
-- VERIFICACIÓN COMPLETA DEL USUARIO UNIDADC
-- ============================================================================
-- Este script verifica que el usuario cmcocom@unidadc.com tenga:
-- 1. Rol UNIDADC asignado
-- 2. Flags de sistema correctos (is_system_user, is_system_role)
-- 3. Sin configuración restrictiva en module_visibility (para acceso 100%)
-- ============================================================================

\echo '============================================================================'
\echo '1. VERIFICAR USUARIO Y ROL UNIDADC'
\echo '============================================================================'

SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.is_system_user,
  u.activo,
  r.id as role_id,
  r.name as role_name,
  r.is_system_role
FROM "User" u
JOIN rbac_user_roles ur ON u.id = ur.user_id
JOIN rbac_roles r ON ur.role_id = r.id
WHERE u.email = 'cmcocom@unidadc.com';

\echo ''
\echo '============================================================================'
\echo '2. VERIFICAR CONFIGURACIÓN DE MODULE_VISIBILITY'
\echo '============================================================================'
\echo 'Si devuelve 0, el usuario tiene acceso COMPLETO a todas las opciones del sidebar'
\echo ''

SELECT COUNT(*) as total_configuraciones_visibilidad FROM module_visibility;

\echo ''
\echo '============================================================================'
\echo '3. VERIFICAR SI HAY RESTRICCIONES ESPECÍFICAS PARA UNIDADC'
\echo '============================================================================'
\echo 'Debe devolver 0 filas (sin restricciones específicas)'
\echo ''

SELECT 
  mv.*,
  r.name as role_name,
  u.email as user_email
FROM module_visibility mv
LEFT JOIN rbac_roles r ON mv.role_id = r.id
LEFT JOIN "User" u ON mv.user_id = u.id
WHERE mv.role_id IN (
  SELECT r.id FROM rbac_roles r WHERE r.name = 'UNIDADC'
) OR mv.user_id IN (
  SELECT u.id FROM "User" u WHERE u.email = 'cmcocom@unidadc.com'
);

\echo ''
\echo '============================================================================'
\echo '4. TODOS LOS ROLES DEL SISTEMA'
\echo '============================================================================'

SELECT 
  id,
  name,
  is_system_role,
  description,
  created_at
FROM rbac_roles
ORDER BY is_system_role DESC, name ASC;

\echo ''
\echo '============================================================================'
\echo 'RESULTADO ESPERADO:'
\echo '============================================================================'
\echo '✅ Usuario cmcocom@unidadc.com debe tener:'
\echo '   - is_system_user = true'
\echo '   - rol UNIDADC asignado'
\echo ''  
\echo '✅ Rol UNIDADC debe tener:'
\echo '   - is_system_role = true'
\echo ''
\echo '✅ Module_visibility debe estar:'
\echo '   - Total configuraciones = 0 (sin restricciones)'
\echo '   - Sin entradas específicas para UNIDADC'
\echo ''
\echo 'Si todo cumple lo anterior, el usuario UNIDADC tiene 100% visibilidad del sidebar'
\echo '============================================================================'

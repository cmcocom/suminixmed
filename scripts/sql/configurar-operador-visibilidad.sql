-- Script para configurar visibilidad de módulos para rol OPERADOR
-- El sistema usa rbac_role_permissions con granted=true/false para controlar visibilidad
-- Solo los permisos LEER con granted=true hacen el módulo visible

-- ================================================
-- PASO 1: Marcar TODOS los permisos LEER como granted=false (ocultar)
-- ================================================
UPDATE rbac_role_permissions 
SET granted = false 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE action = 'LEER'
  );

-- ================================================
-- PASO 2: Marcar como granted=true solo los módulos permitidos
-- ================================================

-- ✅ DASHBOARD
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'DASHBOARD' AND action = 'LEER'
  );

-- ✅ ENTRADAS - Gestión de entradas de inventario
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'ENTRADAS' AND action = 'LEER'
  );

-- ✅ SALIDAS - Gestión de salidas de inventario  
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'SALIDAS' AND action = 'LEER'
  );

-- ✅ REPORTES - Padre de reportes
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'REPORTES' AND action = 'LEER'
  );

-- ✅ GESTION_REPORTES - Contenedor de reportes
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'GESTION_REPORTES' AND action = 'LEER'
  );

-- ✅ REPORTES_INVENTARIO - Reporte de inventario
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'REPORTES_INVENTARIO' AND action = 'LEER'
  );

-- ✅ REPORTES_SALIDAS_CLIENTE - Reporte de salidas por cliente
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'REPORTES_SALIDAS_CLIENTE' AND action = 'LEER'
  );

-- ✅ REPORTES_SALIDAS - Reporte de salidas general
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'REPORTES_SALIDAS' AND action = 'LEER'
  );

-- ✅ STOCK_FIJO - Gestión de stock fijo
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'STOCK_FIJO' AND action = 'LEER'
  );

-- ✅ CATALOGOS - Contenedor padre de catálogos
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'CATALOGOS' AND action = 'LEER'
  );

-- ✅ GESTION_CATALOGOS - Contenedor de gestión de catálogos
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'GESTION_CATALOGOS' AND action = 'LEER'
  );

-- ✅ CATALOGOS_PRODUCTOS - Gestión de productos
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'CATALOGOS_PRODUCTOS' AND action = 'LEER'
  );

-- ✅ INVENTARIO - Ver inventario de productos
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'INVENTARIO' AND action = 'LEER'
  );

-- ✅ CATALOGOS_CATEGORIAS - Gestión de categorías
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'CATALOGOS_CATEGORIAS' AND action = 'LEER'
  );

-- ✅ CATALOGOS_CLIENTES - Gestión de clientes
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'CATALOGOS_CLIENTES' AND action = 'LEER'
  );

-- ✅ CATALOGOS_PROVEEDORES - Gestión de proveedores
UPDATE rbac_role_permissions 
SET granted = true 
WHERE role_id = 'role_operador' 
  AND permission_id IN (
    SELECT id FROM rbac_permissions WHERE module = 'CATALOGOS_PROVEEDORES' AND action = 'LEER'
  );

-- ================================================
-- PASO 3: Verificar que existan los permisos LEER
-- ================================================
SELECT 
  p.module,
  p.action,
  CASE WHEN rp.granted THEN '✅ VISIBLE' ELSE '❌ OCULTO' END as estado,
  rp.granted
FROM rbac_role_permissions rp
JOIN rbac_permissions p ON p.id = rp.permission_id
WHERE rp.role_id = 'role_operador' 
  AND p.action = 'LEER'
ORDER BY p.module;

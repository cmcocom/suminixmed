-- Paso 1: Crear permisos (si no existen)
INSERT INTO rbac_permissions (id, name, description, module, action, is_active, created_by, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'REPORTES_ROTACION_PRODUCTOS:LEER', 'Leer reporte rotación', 'REPORTES_ROTACION_PRODUCTOS', 'LEER', true, 'MIGRATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'REPORTES_ROTACION_PRODUCTOS:EXPORTAR', 'Exportar reporte rotación', 'REPORTES_ROTACION_PRODUCTOS', 'EXPORTAR', true, 'MIGRATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'REPORTES_ROTACION_PRODUCTOS:EJECUTAR', 'Ejecutar reporte rotación', 'REPORTES_ROTACION_PRODUCTOS', 'EJECUTAR', true, 'MIGRATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (module, action) DO NOTHING;

-- Paso 2: Asignar permisos a roles (DESARROLLADOR, ADMINISTRADOR, COLABORADOR, UNIDADC)
INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by, granted_at)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  true,
  'MIGRATION',
  CURRENT_TIMESTAMP
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name IN ('DESARROLLADOR', 'ADMINISTRADOR', 'COLABORADOR', 'UNIDADC')
AND p.module = 'REPORTES_ROTACION_PRODUCTOS'
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- Paso 3: Asignar solo LEER y EJECUTAR a OPERADOR (sin EXPORTAR)
INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by, granted_at)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  true,
  'MIGRATION',
  CURRENT_TIMESTAMP
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'OPERADOR'
AND p.module = 'REPORTES_ROTACION_PRODUCTOS'
AND p.action IN ('LEER', 'EJECUTAR')
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- Paso 4: Configurar visibilidad para todos los roles
INSERT INTO rbac_module_visibility (id, role_id, module_key, is_visible, created_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  'REPORTES_ROTACION_PRODUCTOS',
  true,
  'MIGRATION',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM rbac_roles
WHERE name IN ('DESARROLLADOR', 'ADMINISTRADOR', 'COLABORADOR', 'OPERADOR', 'UNIDADC')
ON CONFLICT (role_id, module_key) DO UPDATE SET is_visible = true, updated_at = CURRENT_TIMESTAMP;

-- Verificar
SELECT 'Permisos creados' as tipo, COUNT(*) as total FROM rbac_permissions WHERE module = 'REPORTES_ROTACION_PRODUCTOS';
SELECT 'Asignaciones creadas' as tipo, COUNT(*) as total FROM rbac_role_permissions rp JOIN rbac_permissions p ON p.id = rp.permission_id WHERE p.module = 'REPORTES_ROTACION_PRODUCTOS';
SELECT 'Visibilidad configurada' as tipo, COUNT(*) as total FROM rbac_module_visibility WHERE module_key = 'REPORTES_ROTACION_PRODUCTOS';

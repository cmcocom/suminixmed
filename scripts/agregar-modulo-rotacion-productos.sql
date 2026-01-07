-- Script para agregar módulo REPORTES_ROTACION_PRODUCTOS al sistema RBAC
-- Autor: Sistema
-- Fecha: 2025-11-23
-- Descripción: Registra el módulo de rotación de productos con sus permisos y asignaciones

BEGIN;

-- Crear permisos para el módulo REPORTES_ROTACION_PRODUCTOS
DO $$
DECLARE
  v_module_key TEXT := 'REPORTES_ROTACION_PRODUCTOS';
  v_perm_leer UUID;
  v_perm_exportar UUID;
  v_perm_ejecutar UUID;
  v_role_desarrollador UUID;
  v_role_administrador UUID;
  v_role_colaborador UUID;
  v_role_operador UUID;
  v_role_unidadc UUID;
BEGIN
  -- Crear permiso LEER
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':LEER',
    'Permiso para leer el reporte de rotación de productos',
    v_module_key,
    'LEER',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_leer;

  -- Crear permiso EXPORTAR
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':EXPORTAR',
    'Permiso para exportar el reporte de rotación de productos',
    v_module_key,
    'EXPORTAR',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_exportar;

  -- Crear permiso EJECUTAR
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':EJECUTAR',
    'Permiso para ejecutar el reporte de rotación de productos',
    v_module_key,
    'EJECUTAR',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_ejecutar;

  -- Si no se crearon (porque ya existían), obtener sus IDs
  IF v_perm_leer IS NULL THEN
    SELECT id INTO v_perm_leer FROM rbac_permissions WHERE name = v_module_key || ':LEER';
  END IF;
  
  IF v_perm_exportar IS NULL THEN
    SELECT id INTO v_perm_exportar FROM rbac_permissions WHERE name = v_module_key || ':EXPORTAR';
  END IF;
  
  IF v_perm_ejecutar IS NULL THEN
    SELECT id INTO v_perm_ejecutar FROM rbac_permissions WHERE name = v_module_key || ':EJECUTAR';
  END IF;

  -- Obtener IDs de roles
  SELECT id INTO v_role_desarrollador FROM rbac_roles WHERE name = 'DESARROLLADOR';
  SELECT id INTO v_role_administrador FROM rbac_roles WHERE name = 'ADMINISTRADOR';
  SELECT id INTO v_role_colaborador FROM rbac_roles WHERE name = 'COLABORADOR';
  SELECT id INTO v_role_operador FROM rbac_roles WHERE name = 'OPERADOR';
  SELECT id INTO v_role_unidadc FROM rbac_roles WHERE name = 'UNIDADC';

  -- Asignar permisos a roles
  -- DESARROLLADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_desarrollador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_desarrollador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_desarrollador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- ADMINISTRADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_administrador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- COLABORADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_colaborador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- OPERADOR: solo lectura y ejecución
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_operador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_operador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- UNIDADC: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_unidadc, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- Configurar visibilidad del módulo para todos los roles
  INSERT INTO rbac_module_visibility (id, role_id, module_key, is_visible, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_desarrollador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_operador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, module_key) DO UPDATE SET is_visible = true, updated_at = CURRENT_TIMESTAMP;

  RAISE NOTICE 'Módulo REPORTES_ROTACION_PRODUCTOS creado exitosamente';
  RAISE NOTICE 'Permisos creados: LEER (%), EXPORTAR (%), EJECUTAR (%)', v_perm_leer, v_perm_exportar, v_perm_ejecutar;
  RAISE NOTICE 'Asignaciones completadas para 5 roles';
  RAISE NOTICE 'Visibilidad configurada para 5 roles';
END $$;

-- Verificar la creación
SELECT 
  'Permisos creados' as tipo,
  COUNT(*) as total
FROM rbac_permissions
WHERE module = 'REPORTES_ROTACION_PRODUCTOS';

SELECT 
  'Asignaciones creadas' as tipo,
  COUNT(*) as total
FROM rbac_role_permissions rp
JOIN rbac_permissions p ON p.id = rp.permission_id
WHERE p.module = 'REPORTES_ROTACION_PRODUCTOS';

SELECT 
  'Visibilidad configurada' as tipo,
  COUNT(*) as total
FROM rbac_module_visibility
WHERE module_key = 'REPORTES_ROTACION_PRODUCTOS';

COMMIT;

DECLARE
  v_module_key TEXT := 'REPORTES_ROTACION_PRODUCTOS';
  v_perm_leer UUID;
  v_perm_exportar UUID;
  v_perm_ejecutar UUID;
  v_role_desarrollador UUID;
  v_role_administrador UUID;
  v_role_colaborador UUID;
  v_role_operador UUID;
  v_role_unidadc UUID;
BEGIN
  -- Crear permiso LEER
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':LEER',
    'Permiso para leer el reporte de rotación de productos',
    v_module_key,
    'LEER',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_leer;

  -- Crear permiso EXPORTAR
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':EXPORTAR',
    'Permiso para exportar el reporte de rotación de productos',
    v_module_key,
    'EXPORTAR',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_exportar;

  -- Crear permiso EJECUTAR
  INSERT INTO rbac_permissions (
    id,
    name,
    description,
    module,
    action,
    is_active,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_module_key || ':EJECUTAR',
    'Permiso para ejecutar el reporte de rotación de productos',
    v_module_key,
    'EJECUTAR',
    true,
    'MIGRATION_SCRIPT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_perm_ejecutar;

  -- Si no se crearon (porque ya existían), obtener sus IDs
  IF v_perm_leer IS NULL THEN
    SELECT id INTO v_perm_leer FROM rbac_permissions WHERE name = v_module_key || ':LEER';
  END IF;
  
  IF v_perm_exportar IS NULL THEN
    SELECT id INTO v_perm_exportar FROM rbac_permissions WHERE name = v_module_key || ':EXPORTAR';
  END IF;
  
  IF v_perm_ejecutar IS NULL THEN
    SELECT id INTO v_perm_ejecutar FROM rbac_permissions WHERE name = v_module_key || ':EJECUTAR';
  END IF;

  -- Obtener IDs de roles
  SELECT id INTO v_role_desarrollador FROM rbac_roles WHERE name = 'DESARROLLADOR';
  SELECT id INTO v_role_administrador FROM rbac_roles WHERE name = 'ADMINISTRADOR';
  SELECT id INTO v_role_colaborador FROM rbac_roles WHERE name = 'COLABORADOR';
  SELECT id INTO v_role_operador FROM rbac_roles WHERE name = 'OPERADOR';
  SELECT id INTO v_role_unidadc FROM rbac_roles WHERE name = 'UNIDADC';

  -- 3. Asignar permisos a roles
  -- DESARROLLADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_desarrollador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_desarrollador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_desarrollador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- ADMINISTRADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_administrador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- COLABORADOR: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_colaborador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- OPERADOR: solo lectura y ejecución
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_operador, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_operador, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- UNIDADC: todos los permisos
  INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_unidadc, v_perm_leer, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_perm_exportar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_perm_ejecutar, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true, updated_at = CURRENT_TIMESTAMP;

  -- 4. Configurar visibilidad del módulo para todos los roles
  INSERT INTO rbac_module_visibility (id, role_id, module_key, is_visible, created_by, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), v_role_desarrollador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_administrador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_colaborador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_operador, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), v_role_unidadc, v_module_key, true, 'MIGRATION_SCRIPT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (role_id, module_key) DO UPDATE SET is_visible = true, updated_at = CURRENT_TIMESTAMP;

  RAISE NOTICE 'Módulo REPORTES_ROTACION_PRODUCTOS creado exitosamente';
  RAISE NOTICE 'Permisos creados: LEER (%), EXPORTAR (%), EJECUTAR (%)', v_perm_leer, v_perm_exportar, v_perm_ejecutar;
  RAISE NOTICE 'Asignaciones completadas para 5 roles';
  RAISE NOTICE 'Visibilidad configurada para 5 roles';
END $$;

-- Verificar la creación
SELECT 
  'Permisos creados' as tipo,
  COUNT(*) as total
FROM rbac_permissions
WHERE module = 'REPORTES_ROTACION_PRODUCTOS';

SELECT 
  'Asignaciones creadas' as tipo,
  COUNT(*) as total
FROM rbac_role_permissions rp
JOIN rbac_permissions p ON p.id = rp.permission_id
WHERE p.module = 'REPORTES_ROTACION_PRODUCTOS';

SELECT 
  'Visibilidad configurada' as tipo,
  COUNT(*) as total
FROM rbac_module_visibility
WHERE module_key = 'REPORTES_ROTACION_PRODUCTOS';

COMMIT;

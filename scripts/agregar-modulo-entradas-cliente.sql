-- ====================================================================
-- Script: Agregar módulo REPORTES_ENTRADAS_CLIENTE al sistema RBAC
-- Fecha: 23 de noviembre de 2025
-- Descripción: Agrega el nuevo módulo de reportes de entradas por proveedor
-- ====================================================================

BEGIN;

-- 1. Verificar si el módulo ya existe
DO $$
DECLARE
  v_module_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM rbac_modules WHERE key = 'REPORTES_ENTRADAS_CLIENTE'
  ) INTO v_module_exists;
  
  IF v_module_exists THEN
    RAISE NOTICE '⚠️  El módulo REPORTES_ENTRADAS_CLIENTE ya existe. Saltando creación.';
  ELSE
    RAISE NOTICE '✅ El módulo REPORTES_ENTRADAS_CLIENTE no existe. Procediendo a crear...';
  END IF;
END $$;

-- 2. Insertar módulo si no existe
INSERT INTO rbac_modules (id, key, title, category, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'REPORTES_ENTRADAS_CLIENTE',
  'Entradas por Proveedor',
  'reportes',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- 3. Crear permiso LEER para el módulo
INSERT INTO rbac_permissions (id, module, action, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'REPORTES_ENTRADAS_CLIENTE',
  'LEER',
  'Ver reporte de entradas agrupadas por proveedor',
  NOW(),
  NOW()
)
ON CONFLICT (module, action) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Asignar permiso LEER a todos los roles existentes (granted=true por defecto)
DO $$
DECLARE
  v_role RECORD;
  v_permission_id TEXT;
  v_assigned_count INT := 0;
BEGIN
  -- Obtener el ID del permiso
  SELECT id INTO v_permission_id
  FROM rbac_permissions
  WHERE module = 'REPORTES_ENTRADAS_CLIENTE' AND action = 'LEER';
  
  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró el permiso REPORTES_ENTRADAS_CLIENTE:LEER';
  END IF;
  
  -- Asignar a cada rol
  FOR v_role IN SELECT id, name FROM rbac_roles LOOP
    INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_role.id,
      v_permission_id,
      true, -- Por defecto, todos los roles tienen acceso
      NOW(),
      NOW()
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    IF FOUND THEN
      v_assigned_count := v_assigned_count + 1;
      RAISE NOTICE '  ✅ Asignado a rol: %', v_role.name;
    ELSE
      RAISE NOTICE '  ⚠️  Ya existía para rol: %', v_role.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen: Permiso asignado a % roles', v_assigned_count;
END $$;

-- 5. Configurar visibilidad del módulo para todos los roles (visible por defecto)
DO $$
DECLARE
  v_role RECORD;
  v_module_id TEXT;
  v_visible_count INT := 0;
BEGIN
  -- Obtener el ID del módulo
  SELECT id INTO v_module_id
  FROM rbac_modules
  WHERE key = 'REPORTES_ENTRADAS_CLIENTE';
  
  IF v_module_id IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró el módulo REPORTES_ENTRADAS_CLIENTE';
  END IF;
  
  -- Configurar visibilidad para cada rol
  FOR v_role IN SELECT id, name FROM rbac_roles LOOP
    INSERT INTO rbac_module_visibility (id, role_id, module_id, visible, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_role.id,
      v_module_id,
      true, -- Visible por defecto
      NOW(),
      NOW()
    )
    ON CONFLICT (role_id, module_id) DO UPDATE SET
      visible = true,
      updated_at = NOW();
    
    IF FOUND THEN
      v_visible_count := v_visible_count + 1;
      RAISE NOTICE '  ✅ Visibilidad configurada para rol: %', v_role.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen: Visibilidad configurada para % roles', v_visible_count;
END $$;

-- 6. Verificación final
DO $$
DECLARE
  v_total_roles INT;
  v_total_permisos INT;
  v_total_visibilidad INT;
BEGIN
  SELECT COUNT(*) INTO v_total_roles FROM rbac_roles;
  
  SELECT COUNT(*) INTO v_total_permisos
  FROM rbac_role_permissions rp
  JOIN rbac_permissions p ON rp.permission_id = p.id
  WHERE p.module = 'REPORTES_ENTRADAS_CLIENTE';
  
  SELECT COUNT(*) INTO v_total_visibilidad
  FROM rbac_module_visibility mv
  JOIN rbac_modules m ON mv.module_id = m.id
  WHERE m.key = 'REPORTES_ENTRADAS_CLIENTE';
  
  RAISE NOTICE '';
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ MÓDULO CONFIGURADO EXITOSAMENTE';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Módulo: REPORTES_ENTRADAS_CLIENTE';
  RAISE NOTICE 'Total de roles: %', v_total_roles;
  RAISE NOTICE 'Permisos asignados: %', v_total_permisos;
  RAISE NOTICE 'Visibilidad configurada: %', v_total_visibilidad;
  RAISE NOTICE '';
  
  IF v_total_permisos != v_total_roles THEN
    RAISE WARNING '⚠️  ADVERTENCIA: No todos los roles tienen el permiso asignado';
  END IF;
  
  IF v_total_visibilidad != v_total_roles THEN
    RAISE WARNING '⚠️  ADVERTENCIA: No todos los roles tienen visibilidad configurada';
  END IF;
END $$;

COMMIT;

-- ====================================================================
-- Fin del script
-- ====================================================================

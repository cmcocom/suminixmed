-- ====================================================================
-- Script: Agregar modulo REPORTES_ENTRADAS_CLIENTE al sistema RBAC
-- Fecha: 23 de noviembre de 2025
-- Descripcion: Agrega permisos y visibilidad para reporte de entradas por proveedor
--
-- RESPALDO CREADO: backup_antes_modulo_entradas_cliente_2025-11-23_21-50-14.backup (1.41 MB)
-- ====================================================================

BEGIN;

-- 1. Insertar permisos para el nuevo modulo
-- Columnas: id, name, description, module, action, is_active, created_by, created_at, updated_at
INSERT INTO rbac_permissions (id, name, description, module, action, is_active, created_by, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE:LEER', 'Ver reporte de entradas por proveedor', 'REPORTES_ENTRADAS_CLIENTE', 'LEER', true, 'MIGRATION_SCRIPT', NOW(), NOW()),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE:EXPORTAR', 'Exportar reporte de entradas a Excel/PDF', 'REPORTES_ENTRADAS_CLIENTE', 'EXPORTAR', true, 'MIGRATION_SCRIPT', NOW(), NOW()),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE:EJECUTAR', 'Ejecutar consultas del reporte de entradas', 'REPORTES_ENTRADAS_CLIENTE', 'EJECUTAR', true, 'MIGRATION_SCRIPT', NOW(), NOW())
ON CONFLICT (module, action) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Asignar permisos a todos los roles existentes (granted=true por arquitectura RBAC V2)
DO $$
DECLARE
  v_role RECORD;
  v_perm RECORD;
  v_assigned_count INT := 0;
BEGIN
  -- Iterar sobre todos los roles
  FOR v_role IN SELECT id, name FROM rbac_roles LOOP
    -- Iterar sobre todos los permisos del nuevo modulo
    FOR v_perm IN SELECT id FROM rbac_permissions WHERE module = 'REPORTES_ENTRADAS_CLIENTE' LOOP
      -- Insertar asignacion si no existe (columnas: id, role_id, permission_id, granted, granted_by, granted_at)
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by, granted_at)
      VALUES (
        gen_random_uuid(),
        v_role.id,
        v_perm.id,
        true, -- Todos los permisos granted=true (RBAC V2)
        'MIGRATION_SCRIPT',
        NOW()
      )
      ON CONFLICT (role_id, permission_id) DO UPDATE SET
        granted = true,
        granted_by = 'MIGRATION_SCRIPT',
        granted_at = NOW();
      
      v_assigned_count := v_assigned_count + 1;
    END LOOP;
    
    RAISE NOTICE '  Asignados permisos a rol: %', v_role.name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total asignaciones: %', v_assigned_count;
END $$;

-- 3. Configurar visibilidad del modulo (visible por defecto para todos los roles)
-- Columnas: id, role_id, module_key, is_visible, created_by, created_at, updated_at
DO $$
DECLARE
  v_role RECORD;
  v_visible_count INT := 0;
BEGIN
  FOR v_role IN SELECT id, name FROM rbac_roles LOOP
    INSERT INTO rbac_module_visibility (id, role_id, module_key, is_visible, created_by, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_role.id,
      'REPORTES_ENTRADAS_CLIENTE',
      true, -- Visible por defecto
      'MIGRATION_SCRIPT',
      NOW(),
      NOW()
    )
    ON CONFLICT (role_id, module_key) DO UPDATE SET
      is_visible = true,
      updated_at = NOW();
    
    v_visible_count := v_visible_count + 1;
    RAISE NOTICE '  Visibilidad configurada para rol: %', v_role.name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total visibilidades: %', v_visible_count;
END $$;

-- 4. Verificacion final
DO $$
DECLARE
  v_total_roles INT;
  v_total_permisos INT;
  v_total_asignaciones INT;
  v_total_visibilidad INT;
BEGIN
  SELECT COUNT(*) INTO v_total_roles FROM rbac_roles;
  
  SELECT COUNT(*) INTO v_total_permisos
  FROM rbac_permissions
  WHERE module = 'REPORTES_ENTRADAS_CLIENTE';
  
  SELECT COUNT(*) INTO v_total_asignaciones
  FROM rbac_role_permissions rp
  JOIN rbac_permissions p ON rp.permission_id = p.id
  WHERE p.module = 'REPORTES_ENTRADAS_CLIENTE';
  
  SELECT COUNT(*) INTO v_total_visibilidad
  FROM rbac_module_visibility
  WHERE module_key = 'REPORTES_ENTRADAS_CLIENTE';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   MODULO CONFIGURADO EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Modulo: REPORTES_ENTRADAS_CLIENTE';
  RAISE NOTICE 'Total de roles: %', v_total_roles;
  RAISE NOTICE 'Permisos creados: %', v_total_permisos;
  RAISE NOTICE 'Asignaciones creadas: %', v_total_asignaciones;
  RAISE NOTICE 'Visibilidad configurada: %', v_total_visibilidad;
  RAISE NOTICE '';
  
  -- Validaciones
  IF v_total_permisos <> 3 THEN
    RAISE WARNING 'ADVERTENCIA: Se esperaban 3 permisos, se crearon %', v_total_permisos;
  END IF;
  
  IF v_total_asignaciones <> (v_total_roles * v_total_permisos) THEN
    RAISE WARNING 'ADVERTENCIA: Faltan asignaciones. Esperadas: %, Creadas: %', 
                  (v_total_roles * v_total_permisos), v_total_asignaciones;
  END IF;
  
  IF v_total_visibilidad <> v_total_roles THEN
    RAISE WARNING 'ADVERTENCIA: Faltan visibilidades. Esperadas: %, Creadas: %',
                  v_total_roles, v_total_visibilidad;
  END IF;
  
  -- Si todo esta bien
  IF v_total_permisos = 3 AND 
     v_total_asignaciones = (v_total_roles * v_total_permisos) AND
     v_total_visibilidad = v_total_roles THEN
    RAISE NOTICE 'VALIDACION: TODOS LOS DATOS CORRECTOS';
    RAISE NOTICE '';
  END IF;
END $$;

COMMIT;

-- ====================================================================
-- Fin del script
-- ====================================================================

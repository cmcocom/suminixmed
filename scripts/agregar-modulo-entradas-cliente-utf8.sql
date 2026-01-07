-- Script para agregar el modulo REPORTES_ENTRADAS_CLIENTE al sistema RBAC
-- Fecha: 2025-01-XX
-- Descripcion: Configura permisos y visibilidad del reporte de entradas por proveedor

BEGIN;

-- 1. Insertar el nuevo modulo REPORTES_ENTRADAS_CLIENTE en rbac_permissions
-- Solo si no existe ya
INSERT INTO rbac_permissions (id, module, action, description, category)
VALUES
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'LEER', 'Ver reporte de entradas por proveedor', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'EXPORTAR', 'Exportar reporte de entradas a Excel/PDF', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'EJECUTAR', 'Ejecutar consultas del reporte de entradas', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'CREAR', 'Crear nuevas configuraciones de reporte', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'EDITAR', 'Editar configuraciones de reporte', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'ELIMINAR', 'Eliminar configuraciones de reporte', 'reportes'),
  (gen_random_uuid(), 'REPORTES_ENTRADAS_CLIENTE', 'ACTUALIZAR', 'Actualizar datos del reporte', 'reportes')
ON CONFLICT (module, action) DO NOTHING;

-- 2. Obtener IDs de roles existentes
DO $$
DECLARE
  v_desarrollador_id UUID;
  v_administrador_id UUID;
  v_colaborador_id UUID;
  v_operador_id UUID;
  v_perm_id UUID;
BEGIN
  -- Obtener IDs de roles
  SELECT id INTO v_desarrollador_id FROM rbac_roles WHERE name = 'DESARROLLADOR';
  SELECT id INTO v_administrador_id FROM rbac_roles WHERE name = 'ADMINISTRADOR';
  SELECT id INTO v_colaborador_id FROM rbac_roles WHERE name = 'COLABORADOR';
  SELECT id INTO v_operador_id FROM rbac_roles WHERE name = 'OPERADOR';

  -- 3. Asignar permisos a DESARROLLADOR (todos los permisos)
  FOR v_perm_id IN 
    SELECT id FROM rbac_permissions WHERE module = 'REPORTES_ENTRADAS_CLIENTE'
  LOOP
    INSERT INTO rbac_role_permissions (role_id, permission_id, granted)
    VALUES (v_desarrollador_id, v_perm_id, true)
    ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;
  END LOOP;

  -- 4. Asignar permisos a ADMINISTRADOR (LEER, EXPORTAR, EJECUTAR)
  FOR v_perm_id IN 
    SELECT id FROM rbac_permissions 
    WHERE module = 'REPORTES_ENTRADAS_CLIENTE' 
    AND action IN ('LEER', 'EXPORTAR', 'EJECUTAR')
  LOOP
    INSERT INTO rbac_role_permissions (role_id, permission_id, granted)
    VALUES (v_administrador_id, v_perm_id, true)
    ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;
  END LOOP;

  -- 5. Asignar permisos a COLABORADOR (LEER, EXPORTAR, EJECUTAR)
  FOR v_perm_id IN 
    SELECT id FROM rbac_permissions 
    WHERE module = 'REPORTES_ENTRADAS_CLIENTE' 
    AND action IN ('LEER', 'EXPORTAR', 'EJECUTAR')
  LOOP
    INSERT INTO rbac_role_permissions (role_id, permission_id, granted)
    VALUES (v_colaborador_id, v_perm_id, true)
    ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;
  END LOOP;

  -- 6. Asignar permisos a OPERADOR (solo LEER)
  FOR v_perm_id IN 
    SELECT id FROM rbac_permissions 
    WHERE module = 'REPORTES_ENTRADAS_CLIENTE' 
    AND action = 'LEER'
  LOOP
    INSERT INTO rbac_role_permissions (role_id, permission_id, granted)
    VALUES (v_operador_id, v_perm_id, true)
    ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;
  END LOOP;

END $$;

-- 7. Configurar visibilidad del menu en rbac_menu_visibility
-- Insertar para todos los roles
INSERT INTO rbac_menu_visibility (role_name, module, is_visible)
VALUES
  ('DESARROLLADOR', 'REPORTES_ENTRADAS_CLIENTE', true),
  ('ADMINISTRADOR', 'REPORTES_ENTRADAS_CLIENTE', true),
  ('COLABORADOR', 'REPORTES_ENTRADAS_CLIENTE', true),
  ('OPERADOR', 'REPORTES_ENTRADAS_CLIENTE', true)
ON CONFLICT (role_name, module) DO UPDATE SET is_visible = true;

-- 8. Verificacion final
SELECT 
  'Permisos creados:' as tipo,
  COUNT(*) as total
FROM rbac_permissions 
WHERE module = 'REPORTES_ENTRADAS_CLIENTE'

UNION ALL

SELECT 
  'Asignaciones a roles:' as tipo,
  COUNT(*) as total
FROM rbac_role_permissions rrp
JOIN rbac_permissions rp ON rrp.permission_id = rp.id
WHERE rp.module = 'REPORTES_ENTRADAS_CLIENTE'

UNION ALL

SELECT 
  'Visibilidad configurada:' as tipo,
  COUNT(*) as total
FROM rbac_menu_visibility
WHERE module = 'REPORTES_ENTRADAS_CLIENTE';

COMMIT;

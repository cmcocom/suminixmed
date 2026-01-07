-- Migración para implementar RBAC dinámico
-- Fecha: 14 septiembre 2025

-- 1. Tabla de Roles Dinámicos
CREATE TABLE IF NOT EXISTS "public"."rbac_roles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT
);

-- 2. Tabla de Permisos Dinámicos
CREATE TABLE IF NOT EXISTS "public"."rbac_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,
    
    CONSTRAINT "rbac_permissions_module_action_resource_key" UNIQUE ("module", "action", "resource")
);

-- 3. Tabla de Asignación Rol-Permisos
CREATE TABLE IF NOT EXISTS "public"."rbac_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT,
    
    CONSTRAINT "rbac_role_permissions_role_permission_key" UNIQUE ("role_id", "permission_id"),
    CONSTRAINT "rbac_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rbac_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."rbac_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Tabla de Asignación Usuario-Roles (para múltiples roles por usuario)
CREATE TABLE IF NOT EXISTS "public"."rbac_user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT "rbac_user_roles_user_role_key" UNIQUE ("user_id", "role_id"),
    CONSTRAINT "rbac_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rbac_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Tabla de Auditoría RBAC
CREATE TABLE IF NOT EXISTS "public"."rbac_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "entity_type" VARCHAR(50) NOT NULL, -- 'role', 'permission', 'role_permission', 'user_role'
    "entity_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'REVOKE'
    "old_values" JSONB,
    "new_values" JSONB,
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "reason" TEXT
);

-- 6. Índices para optimización
CREATE INDEX IF NOT EXISTS "rbac_roles_name_idx" ON "public"."rbac_roles"("name");
CREATE INDEX IF NOT EXISTS "rbac_roles_active_idx" ON "public"."rbac_roles"("is_active");
CREATE INDEX IF NOT EXISTS "rbac_permissions_module_idx" ON "public"."rbac_permissions"("module");
CREATE INDEX IF NOT EXISTS "rbac_permissions_action_idx" ON "public"."rbac_permissions"("action");
CREATE INDEX IF NOT EXISTS "rbac_permissions_active_idx" ON "public"."rbac_permissions"("is_active");
CREATE INDEX IF NOT EXISTS "rbac_role_permissions_role_idx" ON "public"."rbac_role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "rbac_role_permissions_permission_idx" ON "public"."rbac_role_permissions"("permission_id");
CREATE INDEX IF NOT EXISTS "rbac_user_roles_user_idx" ON "public"."rbac_user_roles"("user_id");
CREATE INDEX IF NOT EXISTS "rbac_user_roles_role_idx" ON "public"."rbac_user_roles"("role_id");
CREATE INDEX IF NOT EXISTS "rbac_user_roles_active_idx" ON "public"."rbac_user_roles"("is_active");
CREATE INDEX IF NOT EXISTS "rbac_audit_log_entity_idx" ON "public"."rbac_audit_log"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "rbac_audit_log_performed_at_idx" ON "public"."rbac_audit_log"("performed_at");
CREATE INDEX IF NOT EXISTS "rbac_audit_log_performed_by_idx" ON "public"."rbac_audit_log"("performed_by");

-- 7. Insertar roles del sistema existentes
-- REMOVED: DESARROLLADOR and COLABORADOR roles
-- The following system roles were intentionally reduced to avoid reintroducing
-- removed roles. If you need to restore them, consult git history or backups.
INSERT INTO "public"."rbac_roles" ("name", "description", "is_system_role", "is_active") VALUES
('ADMINISTRADOR', 'Gestión completa excepto entidades', true, true),
('OPERADOR', 'Solo solicitudes y reportes asignados', true, true)
ON CONFLICT ("name") DO NOTHING;

-- 8. Insertar permisos del sistema existentes
INSERT INTO "public"."rbac_permissions" ("name", "module", "action", "description") VALUES
-- Dashboard
('Ver Dashboard', 'DASHBOARD', 'LEER', 'Acceso al dashboard principal con estadísticas'),

-- Entidades
('Ver Entidades', 'ENTIDADES', 'LEER', 'Visualizar información de entidades'),
('Crear Entidades', 'ENTIDADES', 'CREAR', 'Crear nuevas entidades'),
('Editar Entidades', 'ENTIDADES', 'EDITAR', 'Modificar entidades existentes'),
('Eliminar Entidades', 'ENTIDADES', 'ELIMINAR', 'Eliminar entidades del sistema'),

-- Usuarios
('Ver Usuarios', 'USUARIOS', 'LEER', 'Visualizar lista de usuarios'),
('Crear Usuarios', 'USUARIOS', 'CREAR', 'Crear nuevos usuarios'),
('Editar Usuarios', 'USUARIOS', 'EDITAR', 'Modificar información de usuarios'),
('Eliminar Usuarios', 'USUARIOS', 'ELIMINAR', 'Eliminar usuarios del sistema'),
('Asignar Rol Admin', 'USUARIOS', 'ASIGNAR_ROL_ADMIN', 'Asignar rol de Administrador'),
('Asignar Rol Colaborador/Operador', 'USUARIOS', 'ASIGNAR_ROL_COLABORADOR_OPERADOR', 'Asignar roles de Colaborador y Operador'),
('Administrar Permisos', 'USUARIOS', 'ADMINISTRAR_PERMISOS', 'Gestionar matriz de permisos por roles'),

-- Inventario
('Ver Inventario', 'INVENTARIO', 'LEER', 'Ver inventario general del sistema'),
('Crear Inventario', 'INVENTARIO', 'CREAR', 'Agregar productos al inventario'),
('Editar Inventario', 'INVENTARIO', 'EDITAR', 'Modificar productos existentes'),
('Eliminar Inventario', 'INVENTARIO', 'ELIMINAR', 'Eliminar productos del inventario'),
('Salida Inventario', 'INVENTARIO', 'SALIDA', 'Registrar salidas de productos'),

-- Productos
('Ver Productos', 'PRODUCTOS', 'LEER', 'Ver catálogo de productos'),
('Crear Productos', 'PRODUCTOS', 'CREAR', 'Crear nuevos productos'),
('Editar Productos', 'PRODUCTOS', 'EDITAR', 'Modificar información de productos'),
('Eliminar Productos', 'PRODUCTOS', 'ELIMINAR', 'Eliminar productos del sistema'),

-- Stock Fijo
('Ver Stock Fijo', 'STOCK_FIJO', 'LEER', 'Ver configuración de stock fijo'),
('Crear Stock Fijo', 'STOCK_FIJO', 'CREAR', 'Configurar nuevo stock fijo'),
('Editar Stock Fijo', 'STOCK_FIJO', 'EDITAR', 'Modificar configuración de stock'),
('Eliminar Stock Fijo', 'STOCK_FIJO', 'ELIMINAR', 'Eliminar configuración de stock fijo'),

-- Categorías
('Ver Categorías', 'CATEGORIAS', 'LEER', 'Ver categorías de productos'),
('Crear Categorías', 'CATEGORIAS', 'CREAR', 'Crear nuevas categorías'),
('Editar Categorías', 'CATEGORIAS', 'EDITAR', 'Modificar categorías existentes'),
('Eliminar Categorías', 'CATEGORIAS', 'ELIMINAR', 'Eliminar categorías del sistema'),

-- Proveedores
('Ver Proveedores', 'PROVEEDORES', 'LEER', 'Ver información de proveedores'),
('Crear Proveedores', 'PROVEEDORES', 'CREAR', 'Registrar nuevos proveedores'),
('Editar Proveedores', 'PROVEEDORES', 'EDITAR', 'Modificar datos de proveedores'),
('Eliminar Proveedores', 'PROVEEDORES', 'ELIMINAR', 'Eliminar proveedores del sistema'),

-- Clientes
('Ver Clientes', 'CLIENTES', 'LEER', 'Ver información de clientes'),
('Crear Clientes', 'CLIENTES', 'CREAR', 'Registrar nuevos clientes'),
('Editar Clientes', 'CLIENTES', 'EDITAR', 'Modificar datos de clientes'),
('Eliminar Clientes', 'CLIENTES', 'ELIMINAR', 'Eliminar clientes del sistema'),

-- Salidas
('Ver Salidas', 'SALIDAS', 'LEER', 'Ver registro de salidas'),
('Crear Salidas', 'SALIDAS', 'CREAR', 'Registrar nuevas salidas'),
('Editar Salidas', 'SALIDAS', 'EDITAR', 'Modificar salidas existentes'),
('Eliminar Salidas', 'SALIDAS', 'ELIMINAR', 'Eliminar registros de salidas'),

-- Entradas
('Ver Entradas', 'ENTRADAS', 'LEER', 'Ver registro de entradas'),
('Crear Entradas', 'ENTRADAS', 'CREAR', 'Registrar nuevas entradas'),
('Editar Entradas', 'ENTRADAS', 'EDITAR', 'Modificar entradas existentes'),
('Eliminar Entradas', 'ENTRADAS', 'ELIMINAR', 'Eliminar registros de entradas'),

-- Solicitudes
('Ver Solicitudes', 'SOLICITUDES', 'LEER', 'Ver solicitudes/vales del sistema'),
('Crear Solicitudes', 'SOLICITUDES', 'CREAR', 'Crear nuevas solicitudes'),
('Editar Solicitudes', 'SOLICITUDES', 'EDITAR', 'Modificar solicitudes existentes'),
('Eliminar Solicitudes', 'SOLICITUDES', 'ELIMINAR', 'Eliminar solicitudes del sistema'),

-- Reportes
('Ver Reportes', 'REPORTES', 'LEER', 'Acceso básico a reportes'),
('Ver Todos los Reportes', 'REPORTES', 'LEER_TODO', 'Ver todos los reportes del sistema'),
('Ver Reportes Propios', 'REPORTES', 'LEER_PROPIO', 'Ver solo reportes propios'),
('Reportes de Inventario', 'REPORTES', 'INVENTARIO', 'Generar reportes de inventario'),

-- Ajustes
('Ver Ajustes', 'AJUSTES', 'LEER', 'Acceder a configuración del sistema'),
('Editar Ajustes', 'AJUSTES', 'EDITAR', 'Modificar configuración general'),
('Crear Ajustes', 'AJUSTES', 'CREAR', 'Crear nueva configuración'),
('Generador de Reportes', 'AJUSTES', 'GENERADOR_REPORTES', 'Acceso al generador de reportes'),

-- Fondos Fijos
('Ver Fondos Fijos', 'FONDOS_FIJOS', 'LEER', 'Ver fondos fijos configurados'),
('Crear Fondos Fijos', 'FONDOS_FIJOS', 'CREAR', 'Crear nuevos fondos fijos'),
('Editar Fondos Fijos', 'FONDOS_FIJOS', 'EDITAR', 'Modificar fondos fijos existentes'),
('Eliminar Fondos Fijos', 'FONDOS_FIJOS', 'ELIMINAR', 'Eliminar fondos fijos del sistema'),

-- Perfil Propio
('Cambiar Contraseña', 'PERFIL_PROPIO', 'CAMBIAR_PASSWORD', 'Cambiar su propia contraseña'),
('Editar Datos Propios', 'PERFIL_PROPIO', 'EDITAR_DATOS', 'Modificar sus datos personales')
ON CONFLICT ("module", "action", "resource") DO NOTHING;

-- 9. Función para trigger de auditoría actualizada
CREATE OR REPLACE FUNCTION rbac_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO "public"."rbac_audit_log" (
            "entity_type", "entity_id", "action", "old_values", "performed_at"
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            to_jsonb(OLD),
            CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "public"."rbac_audit_log" (
            "entity_type", "entity_id", "action", "old_values", "new_values", "performed_at"
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO "public"."rbac_audit_log" (
            "entity_type", "entity_id", "action", "new_values", "performed_at"
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'CREATE',
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear triggers de auditoría
DROP TRIGGER IF EXISTS rbac_roles_audit_trigger ON "public"."rbac_roles";
CREATE TRIGGER rbac_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_roles"
    FOR EACH ROW
    EXECUTE FUNCTION rbac_audit_trigger();

DROP TRIGGER IF EXISTS rbac_permissions_audit_trigger ON "public"."rbac_permissions";
CREATE TRIGGER rbac_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_permissions"
    FOR EACH ROW
    EXECUTE FUNCTION rbac_audit_trigger();

DROP TRIGGER IF EXISTS rbac_role_permissions_audit_trigger ON "public"."rbac_role_permissions";
CREATE TRIGGER rbac_role_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_role_permissions"
    FOR EACH ROW
    EXECUTE FUNCTION rbac_audit_trigger();

DROP TRIGGER IF EXISTS rbac_user_roles_audit_trigger ON "public"."rbac_user_roles";
CREATE TRIGGER rbac_user_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_user_roles"
    FOR EACH ROW
    EXECUTE FUNCTION rbac_audit_trigger();

-- Comentarios
COMMENT ON TABLE "public"."rbac_roles" IS 'Roles dinámicos del sistema RBAC';
COMMENT ON TABLE "public"."rbac_permissions" IS 'Permisos dinámicos del sistema RBAC';
COMMENT ON TABLE "public"."rbac_role_permissions" IS 'Asignación de permisos a roles';
COMMENT ON TABLE "public"."rbac_user_roles" IS 'Asignación de roles a usuarios';
COMMENT ON TABLE "public"."rbac_audit_log" IS 'Log de auditoría para cambios en RBAC';
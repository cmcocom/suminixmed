-- Función para limpiar sesiones expiradas automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM "public"."active_sessions" 
    WHERE "lastActivity" < NOW() - INTERVAL '35 minutes';
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar automáticamente después de cada inserción/actualización
CREATE OR REPLACE FUNCTION auto_cleanup_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar limpieza solo ocasionalmente (1 de cada 10 operaciones)
    IF random() < 0.1 THEN
        PERFORM cleanup_expired_sessions();
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_auto_cleanup_sessions ON "public"."active_sessions";
CREATE TRIGGER trigger_auto_cleanup_sessions
    AFTER INSERT OR UPDATE ON "public"."active_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_sessions();

-- Función para validar límites de licencia en la base de datos
CREATE OR REPLACE FUNCTION validate_user_license()
RETURNS TRIGGER AS $$
DECLARE
    max_users INT;
    current_active_users INT;
BEGIN
    -- Solo validar en INSERT y cuando se active un usuario
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.activo = false AND NEW.activo = true) THEN
        -- Obtener límite de usuarios de la entidad activa
        SELECT licencia_usuarios_max INTO max_users
        FROM "public"."entidades"
        WHERE estatus = 'activo'
        LIMIT 1;
        
        -- Si no hay entidad activa, permitir la operación
        IF max_users IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Contar usuarios activos actuales
        SELECT COUNT(*) INTO current_active_users
        FROM "public"."User"
        WHERE activo = true;
        
        -- Si es INSERT, sumar 1 al conteo
        IF TG_OP = 'INSERT' THEN
            current_active_users := current_active_users + 1;
        END IF;
        
        -- Validar límite
        IF current_active_users > max_users THEN
            RAISE EXCEPTION 'Se ha alcanzado el límite máximo de usuarios activos (%). Usuarios activos actuales: %', 
                max_users, current_active_users - 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación de licencia
DROP TRIGGER IF EXISTS trigger_validate_user_license ON "public"."User";
CREATE TRIGGER trigger_validate_user_license
    BEFORE INSERT OR UPDATE ON "public"."User"
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_license();

-- Función para auditoría de cambios críticos
CREATE OR REPLACE FUNCTION audit_critical_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de cambios en usuarios (activación/desactivación)
    IF TG_TABLE_NAME = 'User' AND TG_OP = 'UPDATE' AND OLD.activo != NEW.activo THEN
        INSERT INTO "public"."audit_log" (table_name, record_id, action, old_values, new_values, changed_at)
        VALUES (
            'User',
            NEW.id,
            CASE WHEN NEW.activo THEN 'ACTIVATE_USER' ELSE 'DEACTIVATE_USER' END,
            json_build_object('activo', OLD.activo),
            json_build_object('activo', NEW.activo),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" SERIAL PRIMARY KEY,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para la tabla de auditoría
CREATE INDEX IF NOT EXISTS "audit_log_table_record_idx" ON "public"."audit_log"("table_name", "record_id");
CREATE INDEX IF NOT EXISTS "audit_log_changed_at_idx" ON "public"."audit_log"("changed_at");

-- Crear trigger de auditoría para User
DROP TRIGGER IF EXISTS trigger_audit_user_changes ON "public"."User";
CREATE TRIGGER trigger_audit_user_changes
    AFTER UPDATE ON "public"."User"
    FOR EACH ROW
    EXECUTE FUNCTION audit_critical_changes();

-- ================================================
-- CORRECCIÓN: Cambiar validación de usuarios activos a usuarios concurrentes
-- ================================================

-- Eliminar el trigger incorrecto
DROP TRIGGER IF EXISTS trigger_validate_user_license ON "public"."User";
DROP FUNCTION IF EXISTS validate_user_license();

-- Nueva función para validar límites de usuarios concurrentes (no usuarios activos)
-- Esta función se ejecutará al crear una nueva sesión, no al crear/activar usuarios
CREATE OR REPLACE FUNCTION validate_concurrent_user_license()
RETURNS TRIGGER AS $$
DECLARE
    max_concurrent_users INT;
    current_concurrent_users INT;
BEGIN
    -- Solo validar en INSERT de nuevas sesiones
    IF TG_OP = 'INSERT' THEN
        -- Limpiar sesiones expiradas primero
        DELETE FROM "public"."active_sessions" 
        WHERE "lastActivity" < NOW() - INTERVAL '35 minutes';
        
        -- Obtener límite de usuarios concurrentes de la entidad activa
        SELECT licencia_usuarios_max INTO max_concurrent_users
        FROM "public"."entidades"
        WHERE estatus = 'activo'
        LIMIT 1;
        
        -- Si no hay entidad activa, permitir la operación
        IF max_concurrent_users IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Contar sesiones activas actuales (usuarios concurrentes)
        SELECT COUNT(DISTINCT "userId") INTO current_concurrent_users
        FROM "public"."active_sessions"
        WHERE "lastActivity" >= NOW() - INTERVAL '35 minutes';
        
        -- Si es INSERT, sumar 1 al conteo solo si el usuario no tiene sesión activa
        IF NOT EXISTS (
            SELECT 1 FROM "public"."active_sessions" 
            WHERE "userId" = NEW."userId" 
            AND "lastActivity" >= NOW() - INTERVAL '35 minutes'
        ) THEN
            current_concurrent_users := current_concurrent_users + 1;
        END IF;
        
        -- Validar límite de usuarios concurrentes
        IF current_concurrent_users > max_concurrent_users THEN
            RAISE EXCEPTION 'Se ha alcanzado el límite máximo de usuarios concurrentes (%). Usuarios conectados actualmente: %', 
                max_concurrent_users, current_concurrent_users - 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación de usuarios concurrentes en la tabla de sesiones activas
CREATE TRIGGER trigger_validate_concurrent_users
    BEFORE INSERT ON "public"."active_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION validate_concurrent_user_license();

-- Función de utilidad para obtener estadísticas de licencia
CREATE OR REPLACE FUNCTION get_license_stats()
RETURNS TABLE (
    max_concurrent_users INT,
    current_concurrent_users BIGINT,
    available_slots INT,
    is_within_limit BOOLEAN
) AS $$
DECLARE
    max_users INT;
    current_users BIGINT;
BEGIN
    -- Limpiar sesiones expiradas
    DELETE FROM "public"."active_sessions" 
    WHERE "lastActivity" < NOW() - INTERVAL '35 minutes';
    
    -- Obtener límite de usuarios concurrentes
    SELECT licencia_usuarios_max INTO max_users
    FROM "public"."entidades"
    WHERE estatus = 'activo'
    LIMIT 1;
    
    -- Contar usuarios concurrentes actuales
    SELECT COUNT(DISTINCT "userId") INTO current_users
    FROM "public"."active_sessions"
    WHERE "lastActivity" >= NOW() - INTERVAL '35 minutes';
    
    -- Devolver estadísticas
    RETURN QUERY SELECT 
        max_users,
        current_users,
        GREATEST(0, max_users - current_users::INT),
        (current_users <= max_users);
END;
$$ LANGUAGE plpgsql;

-- Índices para mejorar performance de las validaciones
CREATE INDEX IF NOT EXISTS "active_sessions_user_activity_idx" 
ON "public"."active_sessions"("userId", "lastActivity");

CREATE INDEX IF NOT EXISTS "active_sessions_last_activity_idx" 
ON "public"."active_sessions"("lastActivity");

-- Comentario explicativo
COMMENT ON FUNCTION validate_concurrent_user_license() IS 
'Valida el límite de usuarios concurrentes (conectados simultáneamente) basado en active_sessions, no usuarios activos registrados';

COMMENT ON FUNCTION get_license_stats() IS 
'Obtiene estadísticas actuales de uso de licencia para usuarios concurrentes';
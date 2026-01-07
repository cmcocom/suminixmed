-- Quitar validación por usuarios activos y reemplazar por usuarios concurrentes
DROP TRIGGER IF EXISTS trigger_validate_user_license ON "public"."User";
DROP FUNCTION IF EXISTS validate_user_license();

-- Función: validar límite de usuarios concurrentes al insertar en active_sessions
CREATE OR REPLACE FUNCTION validate_concurrent_user_license()
RETURNS TRIGGER AS $$
DECLARE
    max_concurrent_users INT;
    current_concurrent_users INT;
    session_timeout_minutes INT := 35;
BEGIN
    -- Obtener timeout desde la entidad activa si existe
    SELECT COALESCE(tiempo_sesion_minutos, 35)
      INTO session_timeout_minutes
    FROM "public"."entidades"
    WHERE estatus = 'activo'
    LIMIT 1;

    -- Limpiar sesiones expiradas primero
    DELETE FROM "public"."active_sessions" 
    WHERE "lastActivity" < NOW() - make_interval(mins => session_timeout_minutes);
    
    -- Obtener límite de usuarios concurrentes de la entidad activa
    SELECT licencia_usuarios_max INTO max_concurrent_users
    FROM "public"."entidades"
    WHERE estatus = 'activo'
    LIMIT 1;
    
    IF max_concurrent_users IS NULL THEN
        RETURN NEW; -- si no hay entidad activa, permitir
    END IF;
    
    -- Contar usuarios concurrentes actuales
    SELECT COUNT(DISTINCT "userId") INTO current_concurrent_users
    FROM "public"."active_sessions"
    WHERE "lastActivity" >= NOW() - make_interval(mins => session_timeout_minutes);
    
    -- Si el usuario no tiene sesión activa vigente, se sumará este nuevo login
    IF NOT EXISTS (
        SELECT 1 FROM "public"."active_sessions"
        WHERE "userId" = NEW."userId"
          AND "lastActivity" >= NOW() - make_interval(mins => session_timeout_minutes)
    ) THEN
        current_concurrent_users := current_concurrent_users + 1;
    END IF;
    
    IF current_concurrent_users > max_concurrent_users THEN
        RAISE EXCEPTION 'CONCURRENT_LIMIT_EXCEEDED: Límite máximo de usuarios concurrentes (%), actuales: %',
            max_concurrent_users, current_concurrent_users - 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: validar en INSERT sobre active_sessions
DROP TRIGGER IF EXISTS trigger_validate_concurrent_users ON "public"."active_sessions";
CREATE TRIGGER trigger_validate_concurrent_users
    BEFORE INSERT ON "public"."active_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION validate_concurrent_user_license();

-- Función de estadísticas de licencia concurrente
CREATE OR REPLACE FUNCTION get_license_stats()
RETURNS TABLE (
    max_concurrent_users INT,
    current_concurrent_users BIGINT,
    available_slots INT,
    is_within_limit BOOLEAN
) AS $$
DECLARE
    max_users INT := 0;
    current_users BIGINT := 0;
    session_timeout_minutes INT := 35;
BEGIN
    SELECT COALESCE(tiempo_sesion_minutos, 35), COALESCE(licencia_usuarios_max, 0)
      INTO session_timeout_minutes, max_users
    FROM "public"."entidades"
    WHERE estatus = 'activo'
    LIMIT 1;

    -- Limpiar sesiones expiradas
    DELETE FROM "public"."active_sessions" 
    WHERE "lastActivity" < NOW() - make_interval(mins => session_timeout_minutes);
    
    -- Contar usuarios concurrentes actuales
    SELECT COUNT(DISTINCT "userId") INTO current_users
    FROM "public"."active_sessions"
    WHERE "lastActivity" >= NOW() - make_interval(mins => session_timeout_minutes);
    
    RETURN QUERY SELECT 
        max_users,
        current_users,
        GREATEST(0, max_users - current_users::INT),
        (current_users <= max_users);
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS "active_sessions_user_activity_idx" 
  ON "public"."active_sessions"("userId", "lastActivity");
CREATE INDEX IF NOT EXISTS "active_sessions_last_activity_idx" 
  ON "public"."active_sessions"("lastActivity");

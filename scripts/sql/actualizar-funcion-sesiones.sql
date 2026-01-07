-- Función actualizada para validar sesiones concurrentes con configuración por usuario
-- Permite límites personalizados por usuario desde user_session_config

CREATE OR REPLACE FUNCTION check_user_concurrent_sessions()
RETURNS TRIGGER AS $$
DECLARE
    current_sessions_count INTEGER;
    max_sessions_allowed INTEGER;
    user_custom_limit INTEGER;
BEGIN
    -- Obtener límite personalizado del usuario si existe
    SELECT max_concurrent_sessions INTO user_custom_limit
    FROM user_session_config
    WHERE user_id = NEW."userId";

    -- Si el usuario tiene configuración personalizada, usarla
    -- Si no, usar el límite global (por defecto 1)
    IF user_custom_limit IS NOT NULL THEN
        max_sessions_allowed := user_custom_limit;
    ELSE
        -- Límite global por defecto
        max_sessions_allowed := 1;
    END IF;

    -- Contar sesiones activas actuales del usuario
    SELECT COUNT(*) INTO current_sessions_count
    FROM "active_sessions"
    WHERE "userId" = NEW."userId"
    AND "lastActivity" > NOW() - INTERVAL '35 minutes';

    -- Validar si excede el límite permitido
    IF current_sessions_count >= max_sessions_allowed THEN
        RAISE EXCEPTION 'CONCURRENT_LIMIT_EXCEEDED: Usuario % ha alcanzado su límite de % sesiones concurrentes. Sesiones actuales: %',
            NEW."userId", max_sessions_allowed, current_sessions_count
        USING HINT = 'Cierre alguna sesión activa o espere a que expire (35 minutos de inactividad)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS check_concurrent_sessions_trigger ON "active_sessions";

-- Crear nuevo trigger
CREATE TRIGGER check_concurrent_sessions_trigger
    BEFORE INSERT ON "active_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION check_user_concurrent_sessions();

-- Comentario de documentación
COMMENT ON FUNCTION check_user_concurrent_sessions() IS 
'Valida límites de sesiones concurrentes por usuario. 
Consulta user_session_config para límites personalizados.
Si no existe configuración, usa límite global de 1 sesión.
Ejemplo: Usuario 888963 puede tener 3 sesiones concurrentes.';

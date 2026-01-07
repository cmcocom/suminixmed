-- Eliminar el límite de sesiones concurrentes por usuario
-- Esto permitirá que los usuarios abran múltiples pestañas sin restricciones

-- 1. Eliminar el trigger que valida sesiones concurrentes
DROP TRIGGER IF EXISTS check_concurrent_sessions_trigger ON active_sessions;

-- 2. Eliminar la función de validación
DROP FUNCTION IF EXISTS check_user_concurrent_sessions();

-- 3. Comentario de documentación
COMMENT ON TABLE active_sessions IS 
'Tabla de sesiones activas sin límite de sesiones concurrentes por usuario.
Los usuarios pueden abrir múltiples pestañas libremente.
Solo se mantiene el límite global de usuarios conectados (configurado en entidades).';

-- Verificación
SELECT 
    'Trigger eliminado' as accion,
    COUNT(*) as triggers_restantes
FROM information_schema.triggers
WHERE trigger_name = 'check_concurrent_sessions_trigger';

SELECT 
    'Función eliminada' as accion,
    COUNT(*) as funciones_restantes
FROM pg_proc
WHERE proname = 'check_user_concurrent_sessions';

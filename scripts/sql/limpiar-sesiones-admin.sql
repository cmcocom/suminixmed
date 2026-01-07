-- Cerrar todas las sesiones activas para permitir login de admin
-- Esto liberará espacio para que admin@unidadc.com pueda conectarse

DELETE FROM active_sessions;

-- Verificar que se eliminaron
SELECT COUNT(*) as sesiones_restantes FROM active_sessions;
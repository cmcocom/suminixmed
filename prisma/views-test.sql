-- Vista básica para usuarios
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE activo = true) as active_users,
    COUNT(*) FILTER (WHERE activo = false) as inactive_users
FROM "User";

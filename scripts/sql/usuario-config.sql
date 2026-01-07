-- Identificar usuario con configuración específica
\c suminix

SELECT 
    u.clave, 
    u.name, 
    u.email, 
    usc.max_concurrent_sessions,
    usc.created_at as config_creada
FROM user_session_config usc 
JOIN "User" u ON usc.user_id = u.id;
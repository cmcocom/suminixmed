-- Análisis simplificado de sesiones
\c suminix

\echo 'CONFIGURACIÓN DE ENTIDADES:';
SELECT * FROM entidades;

\echo '';
\echo 'SESIONES ACTIVAS:';
SELECT COUNT(*) as total_sesiones FROM active_sessions;

\echo '';  
\echo 'USUARIOS ÚNICOS CONECTADOS:';
SELECT COUNT(DISTINCT "userId") as usuarios_conectados FROM active_sessions;

\echo '';
\echo 'CONFIGURACIÓN ESPECÍFICA DE USUARIOS:';
SELECT * FROM user_session_config;

\echo '';
\echo 'DETALLE DE SESIONES ACTUALES:';
SELECT 
    s.id,
    u.clave as usuario,
    s."tabId",
    s."createdAt",
    s."lastActivity"
FROM active_sessions s
JOIN "User" u ON s."userId" = u.id
ORDER BY s."lastActivity" DESC;
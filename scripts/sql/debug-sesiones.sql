-- Investigación profunda del problema de sesiones
\c suminix

\echo 'ANÁLISIS DETALLADO DE SESIONES:';

-- 1. Conteo total de sesiones por tiempo
SELECT 
    COUNT(*) as total_sesiones_todas,
    COUNT(CASE WHEN "lastActivity" > (NOW() - INTERVAL '1 hour') THEN 1 END) as sesiones_ultima_hora,
    COUNT(CASE WHEN "lastActivity" > (NOW() - INTERVAL '45 minutes') THEN 1 END) as sesiones_45_min,
    COUNT(CASE WHEN "lastActivity" > (NOW() - INTERVAL '30 minutes') THEN 1 END) as sesiones_30_min
FROM active_sessions;

\echo '';
\echo 'TODAS LAS SESIONES (INCLUSO EXPIRADAS):';
SELECT 
    s.id,
    u.clave as usuario,
    s."tabId",
    s."createdAt",
    s."lastActivity",
    EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 as minutos_inactivo
FROM active_sessions s
LEFT JOIN "User" u ON s."userId" = u.id
ORDER BY s."lastActivity" DESC;

\echo '';
\echo 'CONFIGURACIÓN DE ENTIDAD ACTUAL:';
SELECT 
    nombre,
    licencia_usuarios_max,
    tiempo_sesion_minutos,
    estatus
FROM entidades;

\echo '';
\echo 'CONFIGURACIONES ESPECÍFICAS DE USUARIO:';
SELECT 
    u.clave,
    u.name,
    usc.max_concurrent_sessions,
    u.activo as usuario_activo
FROM user_session_config usc
JOIN "User" u ON usc.user_id = u.id;

\echo '';
\echo 'TEST DE LA FUNCIÓN DE VALIDACIÓN:';
-- Simulemos qué pasaría si tratamos de validar
SELECT 
    'Usuarios únicos en última hora' as metrica,
    COUNT(DISTINCT "userId")::text as valor
FROM active_sessions 
WHERE "lastActivity" > (NOW() - INTERVAL '1 hour')
UNION ALL
SELECT 
    'Límite configurado',
    licencia_usuarios_max::text
FROM entidades
WHERE estatus = 'activo'
UNION ALL
SELECT 
    'Estado de validación',
    CASE 
        WHEN (SELECT COUNT(DISTINCT "userId") FROM active_sessions WHERE "lastActivity" > (NOW() - INTERVAL '1 hour')) >= (SELECT licencia_usuarios_max FROM entidades WHERE estatus = 'activo')
        THEN 'LÍMITE ALCANZADO ❌'
        ELSE 'OK ✅'
    END;

\echo '';
\echo 'CONEXIONES ACTIVAS A LA BASE DE DATOS:';
SELECT 
    datname as base_datos,
    usename as usuario_db,
    client_addr as ip_cliente,
    state as estado,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE datname = 'suminix' 
    AND pid <> pg_backend_pid()
ORDER BY state_change DESC;
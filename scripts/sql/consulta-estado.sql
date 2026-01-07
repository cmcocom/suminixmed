-- Consulta simple para verificar el estado actual
SELECT 
    'Usuarios conectados' as tipo,
    COUNT(*)::text as valor
FROM active_sessions
UNION ALL
SELECT 
    'Límite máximo' as tipo,
    licencia_usuarios_max::text as valor
FROM entidades
LIMIT 1;
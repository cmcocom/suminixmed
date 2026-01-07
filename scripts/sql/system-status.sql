-- Estado actual del sistema después de las mejoras
SELECT 'Usuarios activos en el sistema:' as info, '' as email, '' as rol, '' as activo_str;

-- Mostrar todos los usuarios activos con sus roles
SELECT '', email, rol::text, 
       CASE WHEN activo THEN 'SI' ELSE 'NO' END as activo_str
FROM "User" 
WHERE activo = true 
ORDER BY rol::text, email;

-- Separador
SELECT '', '', '', '';
SELECT 'Sesiones actualmente conectadas:', '', '', '';

-- Mostrar sesiones activas con información del usuario
SELECT '', u.email, u.rol::text, 
       EXTRACT(EPOCH FROM (NOW() - sess."lastActivity"))/60 || ' min ago' as ultima_actividad
FROM active_sessions sess 
JOIN "User" u ON sess."userId" = u.id 
ORDER BY sess."lastActivity" DESC;

-- Separador  
SELECT '', '', '', '';
SELECT 'Estadísticas de licencia:', '', '', '';

-- Mostrar estadísticas de licencia
SELECT 'Max usuarios', max_concurrent_users::text, '', ''
FROM (SELECT * FROM get_license_stats()) stats
UNION ALL
SELECT 'Usuarios actuales', current_concurrent_users::text, '', ''
FROM (SELECT * FROM get_license_stats()) stats
UNION ALL
SELECT 'Slots disponibles', available_slots::text, '', ''
FROM (SELECT * FROM get_license_stats()) stats
UNION ALL
SELECT 'Dentro del límite', 
       CASE WHEN is_within_limit THEN 'SI' ELSE 'NO' END, '', ''
FROM (SELECT * FROM get_license_stats()) stats;
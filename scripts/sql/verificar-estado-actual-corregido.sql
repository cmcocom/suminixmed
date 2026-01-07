-- Verificar el estado actual de usuarios conectados (consulta corregida)
SELECT 
    'Estado de sesiones activas' as consulta,
    COUNT(*) as total_sesiones,
    MAX(u.name) as nombre_usuario,
    MAX(u.email) as email_usuario,
    MAX(ases."lastActivity") as ultima_actividad
FROM active_sessions ases
JOIN "User" u ON u.id = ases."userId"
GROUP BY ases."userId"
ORDER BY MAX(ases."lastActivity") DESC;

-- Ver límite configurado
SELECT 
    'Límite configurado' as consulta,
    licencia_usuarios_max as limite_maximo,
    tiempo_sesion_minutos,
    estatus::text
FROM entidades;

-- Estadísticas completas
SELECT * FROM get_license_stats();
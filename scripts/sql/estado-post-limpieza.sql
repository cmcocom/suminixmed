-- Verificar estado después de limpiar sesiones
SELECT 
    'Después de limpiar' as estado,
    COUNT(*) as sesiones_activas
FROM active_sessions;

-- Ver estadísticas actuales
SELECT * FROM get_license_stats();
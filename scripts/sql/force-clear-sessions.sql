-- Script de limpieza agresiva para sesiones concurrentes
-- Este script forzará la eliminación de todos los registros relacionados con sesiones

-- 1. Ver estado actual completo
SELECT 'ANTES DE LIMPIEZA' as estado;

-- Ver sesiones en la tabla active_sessions
SELECT 
    'active_sessions' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT "userId") as usuarios_unicos
FROM active_sessions;

-- Ver que está contando get_license_stats
SELECT 
    'get_license_stats' as fuente,
    max as limite_licencia,
    current as usuarios_contados,
    available as espacios_disponibles,
    withinLimit as dentro_del_limite
FROM get_license_stats();

-- 2. LIMPIEZA AGRESIVA
-- Truncar completamente la tabla (esto elimina TODO)
TRUNCATE TABLE active_sessions RESTART IDENTITY CASCADE;

-- 3. Verificar limpieza
SELECT 'DESPUÉS DE LIMPIEZA' as estado;

-- Verificar tabla vacía
SELECT 
    'active_sessions' as tabla,
    COUNT(*) as total_registros
FROM active_sessions;

-- Verificar estadísticas actualizadas
SELECT 
    'get_license_stats' as fuente,
    max as limite_licencia,
    current as usuarios_contados,
    available as espacios_disponibles,
    withinLimit as dentro_del_limite
FROM get_license_stats();

-- 4. Mensaje final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM active_sessions) = 0 
        THEN '✅ ÉXITO: Todas las sesiones eliminadas - Puedes empezar pruebas desde cero'
        ELSE '❌ PROBLEMA: Aún hay sesiones activas'
    END as resultado_final;
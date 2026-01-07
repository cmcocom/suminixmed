-- Script de utilidad para depuración de sesiones concurrentes
-- Úsalo cuando necesites verificar o limpiar sesiones durante pruebas

-- ===== COMANDOS DE CONSULTA =====

-- Ver sesiones activas actuales
-- SELECT 
--     u.email,
--     u.name,
--     u.rol,
--     s."userId",
--     s."tabId",
--     s."lastActivity",
--     AGE(NOW(), s."lastActivity") as tiempo_inactivo
-- FROM active_sessions s
-- JOIN "User" u ON s."userId" = u.id
-- WHERE s."lastActivity" > NOW() - INTERVAL '30 minutes'
-- ORDER BY s."lastActivity" DESC;

-- Ver estadísticas de licencia
-- SELECT * FROM get_license_stats();

-- Ver conteo rápido de sesiones
-- SELECT COUNT(*) as sesiones_activas FROM active_sessions;

-- ===== COMANDOS DE LIMPIEZA =====

-- Opción 1: Limpiar TODAS las sesiones (para empezar desde cero)
DELETE FROM active_sessions;

-- Opción 2: Limpiar solo sesiones antiguas (más de 30 minutos)
-- DELETE FROM active_sessions WHERE "lastActivity" <= NOW() - INTERVAL '30 minutes';

-- Opción 3: Limpiar sesiones de un usuario específico
-- DELETE FROM active_sessions WHERE "userId" = 'REPLACE_WITH_USER_ID';

-- ===== VERIFICACIÓN POST-LIMPIEZA =====
SELECT 
    COUNT(*) as sesiones_restantes,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas las sesiones eliminadas'
        ELSE '⚠️ Aún hay ' || COUNT(*) || ' sesiones activas'
    END as estado
FROM active_sessions;

-- Verificar estadísticas finales
SELECT * FROM get_license_stats();
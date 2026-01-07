-- Script de limpieza simple y efectiva
-- Solo nos enfocamos en limpiar y verificar

-- 1. Ver estado actual
SELECT 'ANTES: Total sesiones activas' as info, COUNT(*) as cantidad FROM active_sessions;

-- 2. LIMPIEZA COMPLETA
TRUNCATE TABLE active_sessions RESTART IDENTITY CASCADE;

-- 3. Verificar limpieza
SELECT 'DESPUÉS: Total sesiones activas' as info, COUNT(*) as cantidad FROM active_sessions;

-- 4. Resultado final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM active_sessions) = 0 
        THEN '✅ ÉXITO: Todas las sesiones eliminadas'
        ELSE '❌ PROBLEMA: Aún hay sesiones'
    END as resultado;
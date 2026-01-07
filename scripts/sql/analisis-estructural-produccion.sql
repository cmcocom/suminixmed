-- ============================================================================
-- ANÁLISIS ESTRUCTURAL: PRODUCCIÓN vs EVOLUCIONADO
-- ============================================================================
-- Identificar triggers, vistas, funciones y otros elementos de producción

\echo '🔍 ANÁLISIS ESTRUCTURAL - PRODUCCIÓN vs EVOLUCIONADO'
\echo '===================================================='

-- Conectar a producción para analizar elementos estructurales
\c suminix

\echo '\n📊 ELEMENTOS ESTRUCTURALES EN PRODUCCIÓN:'

-- 1. Listar funciones personalizadas
\echo '\n🔧 FUNCIONES PERSONALIZADAS:'
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 2. Listar triggers
\echo '\n⚡ TRIGGERS:'
SELECT 
    trigger_name,
    event_object_table as tabla,
    action_timing,
    event_manipulation as evento
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 3. Listar vistas
\echo '\n👁️ VISTAS:'
SELECT 
    table_name as vista_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Verificar índices específicos importantes
\echo '\n🔍 ÍNDICES IMPORTANTES:'
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE '%_idx%'
ORDER BY tablename, indexname;

-- 5. Verificar constraints especiales
\echo '\n🔒 CONSTRAINTS ESPECIALES:'
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;

\echo '\n=====================================';
\echo 'ANÁLISIS DE PRODUCCIÓN COMPLETADO';
\echo '=====================================';
-- ============================================================================
-- ANÁLISIS COMPLETO DE SESIONES Y POLÍTICAS DE USUARIOS
-- ============================================================================

\echo '🔍 ANÁLISIS COMPLETO DE SESIONES Y POLÍTICAS'
\echo '============================================'

\c suminix

\echo '\n👥 1. USUARIOS CONECTADOS ACTUALMENTE'
\echo '===================================='

-- Usuarios con sesiones activas
SELECT 
    u.clave as usuario_clave,
    u.name as nombre_usuario,
    u.email,
    u.activo as usuario_activo,
    COUNT(s.id) as sesiones_activas,
    MAX(s."lastActivity") as ultima_actividad,
    MIN(s."createdAt") as primera_sesion,
    EXTRACT(EPOCH FROM (NOW() - MAX(s."lastActivity"))) / 60 as minutos_inactivo
FROM "User" u
INNER JOIN active_sessions s ON u.id = s."userId"
GROUP BY u.id, u.clave, u.name, u.email, u.activo
ORDER BY ultima_actividad DESC;

\echo '\n📊 RESUMEN DE CONEXIONES:'

SELECT 
    COUNT(DISTINCT "userId") as usuarios_unicos_conectados,
    COUNT(*) as total_sesiones_activas,
    AVG(EXTRACT(EPOCH FROM (NOW() - "lastActivity")) / 60)::numeric(10,2) as promedio_minutos_inactivo,
    MAX("lastActivity") as sesion_mas_reciente,
    MIN("lastActivity") as sesion_mas_antigua
FROM active_sessions;

\echo '\n⚙️ 2. CONFIGURACIONES DE ENTIDADES Y POLÍTICAS'
\echo '=============================================='

-- Configuración completa de entidades
SELECT 
    id_empresa,
    nombre as nombre_entidad,
    rfc,
    estatus,
    fecha_registro,
    licencia_usuarios_max as limite_usuarios_concurrentes,
    tiempo_sesion_minutos as tiempo_expiracion_minutos,
    ROUND(tiempo_sesion_minutos / 60.0, 2) as tiempo_expiracion_horas,
    createdAt as fecha_creacion_config,
    updatedAt as ultima_actualizacion_config
FROM entidades
WHERE estatus = 'ACTIVO'
ORDER BY fecha_registro DESC;

\echo '\n🔒 3. VALIDACIÓN DE LÍMITES DE LICENCIAS'
\echo '======================================'

-- Verificar si se están respetando los límites
WITH limites_actuales AS (
    SELECT 
        e.licencia_usuarios_max as limite_configurado,
        e.tiempo_sesion_minutos as tiempo_limite_minutos,
        COUNT(DISTINCT s."userId") as usuarios_conectados_ahora,
        COUNT(s.id) as sesiones_totales_activas
    FROM entidades e
    CROSS JOIN active_sessions s
    WHERE e.estatus = 'ACTIVO'
        AND s."lastActivity" > (NOW() - INTERVAL '1 hour')
    GROUP BY e.licencia_usuarios_max, e.tiempo_sesion_minutos
)
SELECT 
    limite_configurado,
    usuarios_conectados_ahora,
    sesiones_totales_activas,
    tiempo_limite_minutos,
    CASE 
        WHEN usuarios_conectados_ahora <= limite_configurado THEN '✅ DENTRO DEL LÍMITE'
        ELSE '⚠️ EXCEDE LÍMITE'
    END as estado_licencias,
    (limite_configurado - usuarios_conectados_ahora) as licencias_disponibles
FROM limites_actuales;

\echo '\n⏰ 4. ANÁLISIS DE TIEMPO DE SESIONES'
\echo '=================================='

-- Análisis detallado de tiempos de sesión
SELECT 
    s.id as session_id,
    u.clave as usuario,
    s."tabId" as tab_id,
    s."createdAt" as inicio_sesion,
    s."lastActivity" as ultima_actividad,
    EXTRACT(EPOCH FROM (NOW() - s."createdAt")) / 60 as duracion_total_minutos,
    EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 as minutos_inactivo,
    e.tiempo_sesion_minutos as limite_configurado_minutos,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 > e.tiempo_sesion_minutos THEN '🔴 EXPIRADA'
        WHEN EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 > (e.tiempo_sesion_minutos * 0.8) THEN '🟡 PRÓXIMA A EXPIRAR'
        ELSE '🟢 ACTIVA'
    END as estado_sesion
FROM active_sessions s
JOIN "User" u ON s."userId" = u.id
CROSS JOIN entidades e
WHERE e.estatus = 'ACTIVO'
ORDER BY s."lastActivity" DESC;

\echo '\n🔧 5. FUNCIONES DE VALIDACIÓN ACTIVAS'
\echo '===================================='

-- Verificar funciones de control de sesiones
SELECT 
    routine_name as funcion,
    routine_type as tipo,
    CASE routine_name
        WHEN 'validate_concurrent_user_license' THEN 'Valida límites de usuarios concurrentes antes de crear sesión'
        WHEN 'cleanup_expired_sessions' THEN 'Limpia sesiones expiradas automáticamente'  
        WHEN 'auto_cleanup_sessions' THEN 'Trigger de limpieza automática en INSERT/UPDATE'
        WHEN 'notify_active_sessions_change' THEN 'Notifica cambios en sesiones activas'
        ELSE 'Función del sistema'
    END as descripcion,
    '✅ ACTIVA' as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'validate_concurrent_user_license',
        'cleanup_expired_sessions', 
        'auto_cleanup_sessions',
        'notify_active_sessions_change'
    )
ORDER BY routine_name;

\echo '\n⚡ 6. TRIGGERS DE CONTROL ACTIVOS'
\echo '==============================='

-- Verificar triggers de control de sesiones
SELECT 
    trigger_name as trigger,
    event_object_table as tabla_afectada,
    action_timing as momento,
    event_manipulation as evento,
    CASE trigger_name
        WHEN 'trigger_validate_concurrent_users' THEN 'Valida límites antes de crear sesión'
        WHEN 'trigger_auto_cleanup_sessions' THEN 'Limpia automáticamente sesiones expiradas'
        WHEN 'trg_notify_active_sessions_insert' THEN 'Notifica nueva sesión creada'
        WHEN 'trg_notify_active_sessions_update' THEN 'Notifica actualización de sesión'  
        WHEN 'trg_notify_active_sessions_delete' THEN 'Notifica sesión eliminada'
        ELSE 'Control del sistema'
    END as proposito
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table = 'active_sessions'
ORDER BY trigger_name;

\echo '\n📋 7. CONFIGURACIÓN DE USER SESSION CONFIG'
\echo '========================================'

-- Verificar configuraciones específicas de usuario (si existen)
SELECT count(*) as configuraciones_personalizadas
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'user_session_config';

-- Si existe la tabla, mostrar configuraciones
\gset
\if :configuraciones_personalizadas
    SELECT 
        usc.*,
        u.clave as usuario_clave,
        u.name as nombre_usuario
    FROM user_session_config usc
    JOIN "User" u ON usc.user_id = u.id
    ORDER BY usc.created_at DESC;
\else
    SELECT 'No hay configuraciones personalizadas de sesión por usuario' as mensaje;
\endif

\echo '\n🚨 8. ALERTAS Y RECOMENDACIONES'
\echo '=============================='

-- Generar alertas basadas en el análisis
WITH analisis_critico AS (
    SELECT 
        e.licencia_usuarios_max as limite,
        COUNT(DISTINCT s."userId") as usuarios_activos,
        COUNT(s.id) as sesiones_totales,
        e.tiempo_sesion_minutos as tiempo_limite,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 > e.tiempo_sesion_minutos THEN 1 END) as sesiones_expiradas
    FROM entidades e
    CROSS JOIN active_sessions s
    WHERE e.estatus = 'ACTIVO'
    GROUP BY e.licencia_usuarios_max, e.tiempo_sesion_minutos
)
SELECT 
    'LÍMITE DE LICENCIAS' as categoria,
    CASE 
        WHEN usuarios_activos > limite THEN '🔴 CRÍTICO: Se excede el límite de ' || limite || ' usuarios'
        WHEN usuarios_activos > (limite * 0.9) THEN '🟡 ADVERTENCIA: Cerca del límite (' || usuarios_activos || '/' || limite || ')'
        ELSE '🟢 OK: Dentro del límite (' || usuarios_activos || '/' || limite || ')'
    END as estado,
    usuarios_activos || ' de ' || limite || ' licencias usadas' as detalle
FROM analisis_critico
UNION ALL
SELECT 
    'SESIONES EXPIRADAS',
    CASE 
        WHEN sesiones_expiradas > 0 THEN '🟡 HAY ' || sesiones_expiradas || ' SESIONES EXPIRADAS'
        ELSE '🟢 NO HAY SESIONES EXPIRADAS'
    END,
    'Límite configurado: ' || tiempo_limite || ' minutos'
FROM analisis_critico
UNION ALL
SELECT 
    'SESIONES MÚLTIPLES',
    CASE 
        WHEN sesiones_totales > usuarios_activos THEN '📊 INFO: ' || (sesiones_totales - usuarios_activos) || ' sesiones adicionales (múltiples tabs)'
        ELSE '📊 INFO: Una sesión por usuario'
    END,
    sesiones_totales || ' sesiones totales para ' || usuarios_activos || ' usuarios'
FROM analisis_critico;

\echo '\n📈 RESUMEN EJECUTIVO'
\echo '==================='

-- Resumen final
SELECT 
    'CONFIGURACIÓN ACTUAL' as aspecto,
    e.licencia_usuarios_max || ' usuarios máx | ' || e.tiempo_sesion_minutos || ' min timeout' as valor
FROM entidades e WHERE e.estatus = 'ACTIVO'
UNION ALL
SELECT 
    'USUARIOS CONECTADOS',
    COUNT(DISTINCT s."userId")::text || ' usuarios únicos'
FROM active_sessions s
UNION ALL  
SELECT
    'SESIONES ACTIVAS',
    COUNT(*)::text || ' sesiones totales'
FROM active_sessions
UNION ALL
SELECT 
    'FUNCIONES DE CONTROL',
    COUNT(*)::text || ' funciones críticas activas'
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'validate_concurrent_user_license',
        'cleanup_expired_sessions',
        'auto_cleanup_sessions'
    );

\echo '\n✅ ANÁLISIS COMPLETADO'
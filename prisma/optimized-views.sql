-- ================================================
-- VIEWS OPTIMIZADAS PARA CONSULTAS FRECUENTES
-- ================================================

-- Vista para estadísticas de usuarios en tiempo real
CREATE OR R-- Índices adicionales para optimizar las views
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at_desc 
ON audit_log (changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity 
ON active_sessions ("lastActivity" DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_stock_level 
ON "Inventario" (stock, stock_minimo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_inventario_categoria_activo 
ON "Inventario" (categoria_id, activo);

-- Índice compuesto para consultas del dashboard
CREATE INDEX IF NOT EXISTS idx_users_activo_created 
ON "User" (activo, "createdAt");

-- Índice para queries de valor de inventario
CREATE INDEX IF NOT EXISTS idx_inventario_valor 
ON "Inventario" (activo, precio, stock) WHERE activo = true;tats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE activo = true) as active_users,
    COUNT(*) FILTER (WHERE activo = false) as inactive_users,
    COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE) as users_created_today,
    COUNT(*) FILTER (WHERE "updatedAt" >= CURRENT_DATE) as users_updated_today
FROM "User";

-- ================================================
-- VISTA PARA INVENTARIO CON INFORMACIÓN AGREGADA
-- ================================================

CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT 
    i.id,
    i.nombre,
    i.descripcion,
    i.stock,
    i.stock_minimo,
    i.precio,
    c.nombre as categoria_nombre,
    CASE 
        WHEN i.stock = 0 THEN 'sin_stock'
        WHEN i.stock <= i.stock_minimo THEN 'stock_bajo'
        WHEN i.stock <= (i.stock_minimo * 2) THEN 'stock_medio'
        ELSE 'stock_alto'
    END as nivel_stock,
    (i.stock * i.precio) as valor_total,
    i."createdAt",
    i."updatedAt"
FROM "Inventario" i
LEFT JOIN categorias c ON i.categoria_id = c.id
WHERE i.activo = true;

-- ================================================
-- VISTA PARA DASHBOARD PRINCIPAL
-- ================================================

CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    -- Estadísticas de usuarios
    (SELECT total_users FROM v_user_stats) as total_users,
    (SELECT active_users FROM v_user_stats) as active_users,
    (SELECT inactive_users FROM v_user_stats) as inactive_users,
    
    -- Estadísticas de inventario
    (SELECT COUNT(*) FROM "Inventario" WHERE activo = true) as total_inventory,
    (SELECT COUNT(*) FROM v_inventory_summary WHERE nivel_stock = 'stock_bajo') as low_stock_items,
    (SELECT COUNT(*) FROM v_inventory_summary WHERE nivel_stock = 'sin_stock') as out_of_stock_items,
    (SELECT COALESCE(SUM(valor_total), 0) FROM v_inventory_summary) as total_inventory_value,
    
    -- Estadísticas de categorías
    (SELECT COUNT(*) FROM categorias WHERE activo = true) as active_categories,
    
    -- Estadísticas de clientes
    (SELECT COUNT(*) FROM clientes WHERE activo = true) as active_clients,
    
    -- Sesiones activas
    (SELECT COUNT(*) FROM active_sessions 
     WHERE "lastActivity" > NOW() - INTERVAL '30 minutes') as active_sessions,
    
    -- Actividad reciente
    (SELECT COUNT(*) FROM audit_log 
     WHERE changed_at >= CURRENT_DATE) as today_activities;

-- ================================================
-- VISTA PARA SESIONES ACTIVAS CON INFORMACIÓN DETALLADA
-- ================================================

CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
    s.id,
    s."userId",
    s."tabId",
    s."lastActivity",
    u.name as user_name,
    u.email as user_email,
    EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 as minutes_inactive,
    CASE 
        WHEN s."lastActivity" > NOW() - INTERVAL '5 minutes' THEN 'muy_activo'
        WHEN s."lastActivity" > NOW() - INTERVAL '15 minutes' THEN 'activo'
        WHEN s."lastActivity" > NOW() - INTERVAL '30 minutes' THEN 'poco_activo'
        ELSE 'inactivo'
    END as activity_level,
    s."createdAt",
    s."updatedAt"
FROM active_sessions s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE s."lastActivity" > NOW() - INTERVAL '35 minutes';

-- ================================================
-- VISTA PARA AUDITORÍA RECIENTE
-- ================================================

CREATE OR REPLACE VIEW v_recent_audit_logs AS
SELECT 
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.old_values,
    al.new_values,
    al.created_at,
    -- Intentar obtener información del usuario si está en new_values
    CASE 
        WHEN al.new_values ? 'userId' THEN 
            (SELECT name FROM "User" WHERE id = (al.new_values->>'userId'))
        ELSE 'Sistema'
    END as user_name
FROM audit_log al
WHERE al.changed_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY al.changed_at DESC;

-- ================================================
-- VISTA PARA PRODUCTOS CON STOCK CRÍTICO
-- ================================================

CREATE OR REPLACE VIEW v_critical_stock AS
SELECT 
    i.id,
    i.nombre,
    i.stock as stock_actual,
    i.stock_minimo,
    c.nombre as categoria,
    i.precio,
    (i.stock_minimo - i.stock) as deficit_stock,
    CASE 
        WHEN i.stock = 0 THEN 'critico'
        WHEN i.stock <= (i.stock_minimo * 0.5) THEN 'muy_bajo'
        WHEN i.stock <= i.stock_minimo THEN 'bajo'
    END as prioridad,
    i."updatedAt" as ultima_actualizacion
FROM "Inventario" i
LEFT JOIN categorias c ON i.categoria_id = c.id
WHERE i.activo = true 
  AND i.stock <= i.stock_minimo
ORDER BY 
    CASE 
        WHEN i.stock = 0 THEN 1
        WHEN i.stock <= (i.stock_minimo * 0.5) THEN 2
        ELSE 3
    END,
    i.stock ASC;

-- ================================================
-- VISTA PARA ANÁLISIS DE CATEGORÍAS
-- ================================================

CREATE OR REPLACE VIEW v_category_analysis AS
SELECT 
    c.id,
    c.nombre as categoria,
    c.activo,
    COUNT(i.id) as total_productos,
    COUNT(i.id) FILTER (WHERE i.activo = true) as productos_activos,
    COUNT(i.id) FILTER (WHERE i.stock <= i.stock_minimo) as productos_stock_bajo,
    COALESCE(SUM(i.stock * i.precio), 0) as valor_total_categoria,
    COALESCE(AVG(i.stock), 0) as promedio_stock,
    MAX(i."updatedAt") as ultima_actualizacion
FROM categorias c
LEFT JOIN "Inventario" i ON c.id = i.categoria_id
GROUP BY c.id, c.nombre, c.activo
ORDER BY valor_total_categoria DESC;

-- ================================================
-- VISTA PARA MÉTRICAS DE RENDIMIENTO
-- ================================================

CREATE OR REPLACE VIEW v_performance_metrics AS
SELECT 
    'active_sessions' as metric_name,
    COUNT(*) as current_value,
    'sessions' as unit,
    NOW() as measured_at
FROM active_sessions
WHERE "lastActivity" > NOW() - INTERVAL '30 minutes'

UNION ALL

SELECT 
    'low_stock_items',
    COUNT(*),
    'items',
    NOW()
FROM "Inventario" 
WHERE activo = true AND stock <= stock_minimo

UNION ALL

SELECT 
    'total_inventory_value',
    COALESCE(SUM(stock * precio), 0)::INTEGER,
    'currency',
    NOW()
FROM "Inventario" 
WHERE activo = true

UNION ALL

SELECT 
    'active_users',
    COUNT(*),
    'users',
    NOW()
FROM "User" u
WHERE u.activo = true;

-- ================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZAR LAS VIEWS
-- ================================================

-- Índices para mejorar el rendimiento de las views
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc 
ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity 
ON active_sessions ("lastActivity" DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_stock_level 
ON inventario (stock, stock_minimo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_inventario_categoria_activo 
ON inventario (categoria_id, activo);

-- Índice compuesto para consultas del dashboard
CREATE INDEX IF NOT EXISTS idx_users_activo_created 
ON users (activo, "createdAt");

-- Índice para queries de valor de inventario
CREATE INDEX IF NOT EXISTS idx_inventario_valor 
ON inventario (activo, precio, stock) WHERE activo = true;

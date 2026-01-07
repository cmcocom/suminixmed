-- ================================================
-- STORED PROCEDURES PARA OPTIMIZACIÓN DE SESIONES
-- ================================================

-- Función para limpiar sesiones expiradas automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(timeout_minutes INTEGER DEFAULT 35)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_time TIMESTAMP;
BEGIN
    cutoff_time := NOW() - INTERVAL '1 minute' * timeout_minutes;
    
    -- Eliminar sesiones expiradas
    DELETE FROM active_sessions 
    WHERE "lastActivity" < cutoff_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log de la operación
    INSERT INTO audit_log (table_name, record_id, action, new_values, changed_at)
    VALUES (
        'active_sessions',
        'cleanup',
        'BULK_DELETE_EXPIRED',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'cutoff_time', cutoff_time,
            'timeout_minutes', timeout_minutes
        ),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA VALIDACIÓN AUTOMÁTICA DE LICENCIAS
-- ================================================

CREATE OR REPLACE FUNCTION validate_user_license(entity_id TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    current_users INTEGER,
    max_users INTEGER,
    remaining_slots INTEGER
) AS $$
DECLARE
    entity_record RECORD;
    active_users_count INTEGER;
BEGIN
    -- Obtener información de la entidad
    SELECT * INTO entity_record
    FROM entidades 
    WHERE id_empresa = entity_id AND estatus = 'activo';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Contar usuarios activos
    SELECT COUNT(*) INTO active_users_count
    FROM "User"
    WHERE activo = true;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        active_users_count < entity_record.licencia_usuarios_max,
        active_users_count,
        entity_record.licencia_usuarios_max,
        GREATEST(0, entity_record.licencia_usuarios_max - active_users_count);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA ESTADÍSTICAS DEL DASHBOARD
-- ================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
    total_users INTEGER,
    active_users INTEGER,
    inactive_users INTEGER,
    total_inventory INTEGER,
    low_stock_items INTEGER,
    total_categories INTEGER,
    active_categories INTEGER,
    total_clients INTEGER,
    active_sessions_count INTEGER,
    today_logins INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Estadísticas de usuarios
        (SELECT COUNT(*)::INTEGER FROM "User"),
        (SELECT COUNT(*)::INTEGER FROM "User" WHERE activo = true),
        (SELECT COUNT(*)::INTEGER FROM "User" WHERE activo = false),
        
        -- Estadísticas de inventario
        (SELECT COUNT(*)::INTEGER FROM "Inventario"),
        (SELECT COUNT(*)::INTEGER FROM "Inventario" WHERE cantidad <= 10), -- Stock bajo = menos de 10 unidades
        
        -- Estadísticas de categorías
        (SELECT COUNT(*)::INTEGER FROM categorias),
        (SELECT COUNT(*)::INTEGER FROM categorias WHERE activo = true),
        
        -- Estadísticas de clientes
        (SELECT COUNT(*)::INTEGER FROM clientes WHERE activo = true),
        
        -- Sesiones activas
        (SELECT COUNT(*)::INTEGER FROM active_sessions 
         WHERE "lastActivity" > NOW() - INTERVAL '30 minutes'),
        
        -- Logins de hoy
        (SELECT COUNT(*)::INTEGER FROM audit_log 
         WHERE action = 'USER_LOGIN' 
         AND changed_at >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA GESTIÓN OPTIMIZADA DE HEARTBEAT
-- ================================================

CREATE OR REPLACE FUNCTION update_session_heartbeat(
    p_user_id TEXT,
    p_tab_id TEXT,
    p_last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    session_exists BOOLEAN := false;
BEGIN
    -- Verificar si la sesión existe
    SELECT EXISTS(
        SELECT 1 FROM active_sessions 
        WHERE "userId" = p_user_id AND "tabId" = p_tab_id
    ) INTO session_exists;
    
    IF session_exists THEN
        -- Actualizar sesión existente
        UPDATE active_sessions 
        SET 
            "lastActivity" = p_last_activity,
            "updatedAt" = NOW()
        WHERE "userId" = p_user_id AND "tabId" = p_tab_id;
    ELSE
        -- Crear nueva sesión
        INSERT INTO active_sessions ("userId", "tabId", "lastActivity", "createdAt", "updatedAt")
        VALUES (p_user_id, p_tab_id, p_last_activity, NOW(), NOW())
        ON CONFLICT ("userId", "tabId") DO UPDATE SET
            "lastActivity" = p_last_activity,
            "updatedAt" = NOW();
    END IF;
    
    -- Limpiar sesiones expiradas ocasionalmente (10% probabilidad)
    IF random() < 0.1 THEN
        PERFORM cleanup_expired_sessions();
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA AUDITORÍA AUTOMÁTICA
-- ================================================

CREATE OR REPLACE FUNCTION log_user_action(
    p_user_id TEXT,
    p_action TEXT,
    p_table_name TEXT DEFAULT 'users',
    p_record_id TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_at
    ) VALUES (
        p_table_name,
        COALESCE(p_record_id, p_user_id),
        p_action,
        p_old_values,
        COALESCE(p_new_values, jsonb_build_object('userId', p_user_id, 'timestamp', NOW())),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA OPTIMIZACIÓN DE INVENTARIO
-- ================================================

CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS TABLE(
    total_items INTEGER,
    low_stock_count INTEGER,
    out_of_stock_count INTEGER,
    total_value DECIMAL,
    categories_count INTEGER,
    avg_stock_level DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COUNT(*) FILTER (WHERE stock <= stock_minimo)::INTEGER as low_stock_count,
        COUNT(*) FILTER (WHERE stock = 0)::INTEGER as out_of_stock_count,
        COALESCE(SUM(precio * stock), 0)::DECIMAL as total_value,
        COUNT(DISTINCT categoria_id)::INTEGER as categories_count,
        COALESCE(AVG(stock), 0)::DECIMAL as avg_stock_level
    FROM "Inventario"
    WHERE activo = true;
END;
$$ LANGUAGE plpgsql;

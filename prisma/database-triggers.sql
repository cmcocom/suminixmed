-- ================================================
-- TRIGGERS AUTOMÁTICOS PARA OPTIMIZACIÓN
-- ================================================

-- Trigger para auto-limpieza de sesiones al insertar nuevas
CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar sesiones expiradas con 5% de probabilidad
    IF random() < 0.05 THEN
        PERFORM cleanup_expired_sessions();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auto_cleanup_sessions
    AFTER INSERT ON active_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_sessions();

-- ================================================
-- TRIGGER PARA VALIDACIÓN AUTOMÁTICA DE LICENCIAS
-- ================================================

CREATE OR REPLACE FUNCTION trigger_validate_user_license()
RETURNS TRIGGER AS $$
DECLARE
    license_info RECORD;
BEGIN
    -- Solo validar al activar usuarios
    IF NEW.activo = true AND (OLD IS NULL OR OLD.activo = false) THEN
        
        -- Obtener información de licencia
        SELECT * INTO license_info
        FROM validate_user_license((SELECT id_empresa FROM entidades LIMIT 1));
        
        -- Si no hay slots disponibles, rechazar
        IF NOT license_info.is_valid THEN
            RAISE EXCEPTION 'Licencia excedida. Usuarios activos: %, Máximo: %', 
                license_info.current_users, license_info.max_users;
        END IF;
        
        -- Log de auditoría
        PERFORM log_user_action(
            NEW.id,
            'USER_ACTIVATED',
            'User',
            NEW.id,
            CASE WHEN OLD IS NOT NULL THEN to_jsonb(OLD) ELSE NULL END,
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_user_license_trigger
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validate_user_license();

-- ================================================
-- TRIGGER PARA AUDITORÍA AUTOMÁTICA DE INVENTARIO
-- ================================================

CREATE OR REPLACE FUNCTION trigger_audit_inventory()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    user_id TEXT;
BEGIN
    -- Determinar tipo de acción
    IF TG_OP = 'INSERT' THEN
        action_type := 'INVENTORY_CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'INVENTORY_UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'INVENTORY_DELETE';
    END IF;
    
    -- Obtener user_id del contexto (si está disponible)
    user_id := current_setting('app.current_user_id', true);
    
    -- Log de auditoría
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_at)
    VALUES (
        'Inventario',
        COALESCE(NEW.id, OLD.id),
        action_type,
        CASE WHEN OLD IS NOT NULL THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN NEW IS NOT NULL THEN to_jsonb(NEW) ELSE NULL END,
        NOW()
    );
    
    -- Alertas de stock bajo
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.stock <= NEW.stock_minimo THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_at)
        VALUES (
            'Inventario',
            NEW.id,
            'LOW_STOCK_ALERT',
            jsonb_build_object(
                'product_name', NEW.nombre,
                'current_stock', NEW.stock,
                'minimum_stock', NEW.stock_minimo,
                'alert_level', 'warning'
            ),
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER audit_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Inventario"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_audit_inventory();

-- ================================================
-- TRIGGER PARA GESTIÓN AUTOMÁTICA DE TIMESTAMPS
-- ================================================

CREATE OR REPLACE FUNCTION trigger_update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updatedAt
CREATE OR REPLACE TRIGGER update_timestamps_users
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamps();

CREATE OR REPLACE TRIGGER update_timestamps_inventario
    BEFORE UPDATE ON "Inventario"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamps();

CREATE OR REPLACE TRIGGER update_timestamps_categorias
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamps();

CREATE OR REPLACE TRIGGER update_timestamps_clientes
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamps();

CREATE OR REPLACE TRIGGER update_timestamps_entidades
    BEFORE UPDATE ON entidades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamps();

-- ================================================
-- TRIGGER PARA LIMPIEZA AUTOMÁTICA DE DATOS OBSOLETOS
-- ================================================

CREATE OR REPLACE FUNCTION trigger_cleanup_old_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar logs de auditoría antiguos (más de 90 días)
    IF random() < 0.01 THEN -- 1% de probabilidad
        DELETE FROM audit_log 
        WHERE changed_at < NOW() - INTERVAL '90 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER cleanup_old_audit_logs
    AFTER INSERT ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_old_data();

-- ================================================
-- TRIGGER PARA VALIDACIÓN DE DATOS DE INVENTARIO
-- ================================================

CREATE OR REPLACE FUNCTION trigger_validate_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar stock no negativo
    IF NEW.stock < 0 THEN
        RAISE EXCEPTION 'El stock no puede ser negativo: %', NEW.stock;
    END IF;
    
    -- Validar precio positivo
    IF NEW.precio <= 0 THEN
        RAISE EXCEPTION 'El precio debe ser positivo: %', NEW.precio;
    END IF;
    
    -- Validar stock mínimo
    IF NEW.stock_minimo < 0 THEN
        RAISE EXCEPTION 'El stock mínimo no puede ser negativo: %', NEW.stock_minimo;
    END IF;
    
    -- Auto-calcular campos derivados si es necesario
    NEW."updatedAt" = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_inventory_trigger
    BEFORE INSERT OR UPDATE ON "Inventario"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validate_inventory();

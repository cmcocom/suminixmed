-- ================================================
-- SISTEMA UNIVERSAL DE AUDITORÍA POR TRIGGERS
-- ================================================

-- Función universal de auditoría que funciona para cualquier tabla
CREATE OR REPLACE FUNCTION universal_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    table_id TEXT;
    user_context TEXT;
    audit_level TEXT := 'MEDIUM';
BEGIN
    -- Determinar tipo de acción
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        table_id := COALESCE(NEW.id::TEXT, 'unknown');
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        table_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT, 'unknown');
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        table_id := COALESCE(OLD.id::TEXT, 'unknown');
    END IF;

    -- Obtener contexto de usuario (si está disponible)
    BEGIN
        user_context := current_setting('audit.user_id', true);
    EXCEPTION WHEN OTHERS THEN
        user_context := NULL;
    END;

    -- Determinar nivel de criticidad según la tabla
    CASE TG_TABLE_NAME
        WHEN 'User', 'rbac_roles', 'rbac_permissions', 'rbac_user_roles' THEN
            audit_level := 'CRITICAL';
        WHEN 'entradas_inventario', 'salidas_inventario', 'Inventario', 'ffijo' THEN
            audit_level := 'HIGH';
        WHEN 'clientes', 'proveedores', 'categorias' THEN
            audit_level := 'MEDIUM';
        ELSE
            audit_level := 'LOW';
    END CASE;

    -- Si es DELETE, aumentar criticidad
    IF TG_OP = 'DELETE' THEN
        audit_level := CASE audit_level
            WHEN 'LOW' THEN 'MEDIUM'
            WHEN 'MEDIUM' THEN 'HIGH'
            WHEN 'HIGH' THEN 'CRITICAL'
            ELSE 'CRITICAL'
        END;
    END IF;

    -- Insertar registro de auditoría
    BEGIN
        INSERT INTO "public"."audit_log" (
            table_name, 
            record_id, 
            action, 
            old_values, 
            new_values,
            user_id,
            level,
            description,
            changed_at
        )
        VALUES (
            TG_TABLE_NAME,
            table_id,
            action_type,
            CASE WHEN OLD IS NOT NULL THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN NEW IS NOT NULL THEN to_jsonb(NEW) ELSE NULL END,
            user_context,
            audit_level,
            format('%s %s en tabla %s', action_type, table_id, TG_TABLE_NAME),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Error en auditoría para tabla %: %', TG_TABLE_NAME, SQLERRM;
    END;

    -- Retornar el registro apropiado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS PARA TABLAS PRINCIPALES
-- ================================================

-- Usuarios (CRÍTICO)
DROP TRIGGER IF EXISTS audit_trigger_user ON "public"."User";
CREATE TRIGGER audit_trigger_user
    AFTER INSERT OR UPDATE OR DELETE ON "public"."User"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Inventario (ALTO)
DROP TRIGGER IF EXISTS audit_trigger_inventario ON "public"."Inventario";
CREATE TRIGGER audit_trigger_inventario
    AFTER INSERT OR UPDATE OR DELETE ON "public"."Inventario"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Entradas de Inventario (ALTO)
DROP TRIGGER IF EXISTS audit_trigger_entradas ON "public"."entradas_inventario";
CREATE TRIGGER audit_trigger_entradas
    AFTER INSERT OR UPDATE OR DELETE ON "public"."entradas_inventario"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Salidas de Inventario (ALTO)
DROP TRIGGER IF EXISTS audit_trigger_salidas ON "public"."salidas_inventario";
CREATE TRIGGER audit_trigger_salidas
    AFTER INSERT OR UPDATE OR DELETE ON "public"."salidas_inventario"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Clientes (MEDIO)
DROP TRIGGER IF EXISTS audit_trigger_clientes ON "public"."clientes";
CREATE TRIGGER audit_trigger_clientes
    AFTER INSERT OR UPDATE OR DELETE ON "public"."clientes"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Proveedores (MEDIO)
DROP TRIGGER IF EXISTS audit_trigger_proveedores ON "public"."proveedores";
CREATE TRIGGER audit_trigger_proveedores
    AFTER INSERT OR UPDATE OR DELETE ON "public"."proveedores"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Órdenes de Compra (ALTO)
DROP TRIGGER IF EXISTS audit_trigger_ordenes_compra ON "public"."ordenes_compra";
CREATE TRIGGER audit_trigger_ordenes_compra
    AFTER INSERT OR UPDATE OR DELETE ON "public"."ordenes_compra"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Categorías (MEDIO)
DROP TRIGGER IF EXISTS audit_trigger_categorias ON "public"."categorias";
CREATE TRIGGER audit_trigger_categorias
    AFTER INSERT OR UPDATE OR DELETE ON "public"."categorias"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Fondo Fijo (ALTO)
DROP TRIGGER IF EXISTS audit_trigger_ffijo ON "public"."ffijo";
CREATE TRIGGER audit_trigger_ffijo
    AFTER INSERT OR UPDATE OR DELETE ON "public"."ffijo"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- ================================================
-- TRIGGERS PARA TABLAS RBAC (CRÍTICO)
-- ================================================

-- Roles RBAC
DROP TRIGGER IF EXISTS audit_trigger_rbac_roles ON "public"."rbac_roles";
CREATE TRIGGER audit_trigger_rbac_roles
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_roles"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Permisos RBAC
DROP TRIGGER IF EXISTS audit_trigger_rbac_permissions ON "public"."rbac_permissions";
CREATE TRIGGER audit_trigger_rbac_permissions
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_permissions"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Asignaciones Rol-Permiso RBAC
DROP TRIGGER IF EXISTS audit_trigger_rbac_role_permissions ON "public"."rbac_role_permissions";
CREATE TRIGGER audit_trigger_rbac_role_permissions
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_role_permissions"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- Asignaciones Usuario-Rol RBAC
DROP TRIGGER IF EXISTS audit_trigger_rbac_user_roles ON "public"."rbac_user_roles";
CREATE TRIGGER audit_trigger_rbac_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON "public"."rbac_user_roles"
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

-- ================================================
-- FUNCIÓN PARA ESTABLECER CONTEXTO DE USUARIO
-- ================================================

-- Función para que las aplicaciones establezcan el contexto del usuario
CREATE OR REPLACE FUNCTION set_audit_user(user_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('audit.user_id', user_id_param, true);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS ESPECÍFICOS PARA MOVIMIENTOS DE STOCK
-- ================================================

-- Función específica para auditoría de cambios de stock
CREATE OR REPLACE FUNCTION audit_stock_changes()
RETURNS TRIGGER AS $$
DECLARE
    stock_change INTEGER;
    user_context TEXT;
    audit_description TEXT;
BEGIN
    -- Solo procesar si cambió la cantidad
    IF TG_OP = 'UPDATE' AND OLD.cantidad != NEW.cantidad THEN
        stock_change := NEW.cantidad - OLD.cantidad;
        
        -- Obtener contexto de usuario
        BEGIN
            user_context := current_setting('audit.user_id', true);
        EXCEPTION WHEN OTHERS THEN
            user_context := NULL;
        END;

        -- Generar descripción del cambio
        IF stock_change > 0 THEN
            audit_description := format('Incremento de stock: +%s unidades de %s (Stock: %s → %s)', 
                stock_change, NEW.nombre, OLD.cantidad, NEW.cantidad);
        ELSE
            audit_description := format('Reducción de stock: %s unidades de %s (Stock: %s → %s)', 
                stock_change, NEW.nombre, OLD.cantidad, NEW.cantidad);
        END IF;

        -- Registrar el cambio de stock
        INSERT INTO "public"."audit_log" (
            table_name, 
            record_id, 
            action, 
            old_values, 
            new_values,
            user_id,
            level,
            description,
            metadata,
            changed_at
        )
        VALUES (
            'Inventario',
            NEW.id,
            'STOCK_MOVEMENT',
            jsonb_build_object('cantidad', OLD.cantidad, 'nombre', OLD.nombre),
            jsonb_build_object('cantidad', NEW.cantidad, 'nombre', NEW.nombre),
            user_context,
            'HIGH',
            audit_description,
            jsonb_build_object(
                'stock_change', stock_change,
                'previous_stock', OLD.cantidad,
                'new_stock', NEW.cantidad,
                'product_name', NEW.nombre
            ),
            NOW()
        );

        -- Alerta de stock bajo
        IF NEW.cantidad <= COALESCE(NEW.cantidad_minima, 0) AND NEW.cantidad_minima > 0 THEN
            INSERT INTO "public"."audit_log" (
                table_name, 
                record_id, 
                action, 
                new_values,
                user_id,
                level,
                description,
                metadata,
                changed_at
            )
            VALUES (
                'Inventario',
                NEW.id,
                'LOW_STOCK_ALERT',
                jsonb_build_object(
                    'cantidad', NEW.cantidad,
                    'cantidad_minima', NEW.cantidad_minima,
                    'nombre', NEW.nombre
                ),
                user_context,
                'CRITICAL',
                format('⚠️  STOCK BAJO: %s tiene %s unidades (mínimo: %s)', 
                    NEW.nombre, NEW.cantidad, NEW.cantidad_minima),
                jsonb_build_object(
                    'alert_type', 'LOW_STOCK',
                    'current_stock', NEW.cantidad,
                    'minimum_stock', NEW.cantidad_minima,
                    'product_name', NEW.nombre,
                    'deficit', NEW.cantidad_minima - NEW.cantidad
                ),
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger específico para cambios de stock
DROP TRIGGER IF EXISTS audit_stock_changes_trigger ON "public"."Inventario";
CREATE TRIGGER audit_stock_changes_trigger
    AFTER UPDATE ON "public"."Inventario"
    FOR EACH ROW 
    WHEN (OLD.cantidad IS DISTINCT FROM NEW.cantidad)
    EXECUTE FUNCTION audit_stock_changes();

-- ================================================
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- ================================================

-- Función para limpiar registros de auditoría antiguos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar registros de más de 6 meses (excepto críticos)
    DELETE FROM "public"."audit_log"
    WHERE changed_at < NOW() - INTERVAL '6 months'
    AND level != 'CRITICAL';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log de la limpieza
    INSERT INTO "public"."audit_log" (
        table_name, 
        record_id, 
        action, 
        new_values,
        level,
        description,
        changed_at
    )
    VALUES (
        'system',
        'cleanup_' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
        'MAINTENANCE',
        jsonb_build_object('deleted_records', deleted_count),
        'LOW',
        format('Limpieza automática: eliminados %s registros antiguos', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ================================================

-- Índices compuestos para consultas complejas
CREATE INDEX IF NOT EXISTS "audit_log_composite_search_idx" 
ON "public"."audit_log"("table_name", "action", "changed_at");

CREATE INDEX IF NOT EXISTS "audit_log_user_activity_idx" 
ON "public"."audit_log"("user_id", "action", "changed_at");

CREATE INDEX IF NOT EXISTS "audit_log_level_date_idx" 
ON "public"."audit_log"("level", "changed_at");

-- Índice parcial para registros críticos
CREATE INDEX IF NOT EXISTS "audit_log_critical_idx" 
ON "public"."audit_log"("changed_at", "table_name") 
WHERE level = 'CRITICAL';

-- ================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================================

COMMENT ON FUNCTION universal_audit_trigger() IS 'Función universal de auditoría para todas las tablas del sistema';
COMMENT ON FUNCTION audit_stock_changes() IS 'Función específica para auditar cambios de stock en inventario';
COMMENT ON FUNCTION set_audit_user(TEXT) IS 'Establece el contexto del usuario actual para auditoría';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Limpia registros de auditoría antiguos automáticamente';

-- ================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ================================================

-- Verificar que los triggers se crearon correctamente
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name LIKE 'audit_trigger_%';
    
    RAISE NOTICE 'Sistema de auditoría instalado correctamente. Triggers activos: %', trigger_count;
END;
$$;
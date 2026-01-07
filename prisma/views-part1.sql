-- ================================================
-- VISTAS OPTIMIZADAS - PARTE 1
-- ================================================

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE activo = true) as active_users,
    COUNT(*) FILTER (WHERE activo = false) as inactive_users,
    COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE) as users_created_today,
    COUNT(*) FILTER (WHERE "updatedAt" >= CURRENT_DATE) as users_updated_today
FROM "User";

-- Vista para inventario con información agregada
CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT 
    i.id,
    i.nombre,
    i.descripcion,
    i.cantidad,
    i.precio,
    c.nombre as categoria_nombre,
    CASE 
        WHEN i.cantidad = 0 THEN 'sin_stock'
        WHEN i.cantidad <= 5 THEN 'stock_bajo'
        WHEN i.cantidad <= 20 THEN 'stock_medio'
        ELSE 'stock_alto'
    END as nivel_stock,
    (i.cantidad * i.precio) as valor_total,
    i."createdAt",
    i."updatedAt"
FROM "Inventario" i
LEFT JOIN categorias c ON i.categoria_id = c.id;

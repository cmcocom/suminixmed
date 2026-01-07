-- Mostrar todas las entradas del producto con clave 166
-- Producto: SISTEMA URINARIO CERRADO NUMERO 16 (ID: PROD-00451)

SELECT 
    e.folio,
    e.serie,
    TO_CHAR(e.fecha_creacion, 'YYYY-MM-DD HH24:MI') as fecha_entrada,
    pr.nombre as proveedor,
    p.cantidad,
    p.precio,
    (p.cantidad * p.precio) as total,
    p.numero_lote,
    TO_CHAR(p.fecha_vencimiento, 'YYYY-MM-DD') as vencimiento,
    p.cantidad_disponible,
    i.clave as producto_clave,
    i.nombre as producto_nombre,
    i.cantidad as stock_actual
FROM partidas_entrada_inventario p
JOIN entradas_inventario e ON p.entrada_id = e.id
JOIN "Inventario" i ON p.inventario_id = i.id
LEFT JOIN proveedores pr ON e.proveedor_id = pr.id
WHERE i.clave = '166'
ORDER BY e.fecha_creacion DESC;

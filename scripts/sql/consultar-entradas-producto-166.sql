-- Consultar todas las entradas del producto 166
SELECT 
    e.id,
    e.folio,
    e.serie,
    e.fecha_creacion,
    e.proveedor_id,
    pr.nombre as proveedor,
    p.cantidad,
    p.precio,
    p.numero_lote,
    p.fecha_vencimiento,
    i.clave as producto_clave,
    i.nombre as producto_nombre
FROM partidas_entrada_inventario p
JOIN entradas_inventario e ON p.entrada_id = e.id
JOIN "Inventario" i ON p.inventario_id = i.id
LEFT JOIN proveedores pr ON e.proveedor_id = pr.id
WHERE i.id = '166'
ORDER BY e.fecha_creacion DESC;

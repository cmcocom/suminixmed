-- ====================================================================
-- ENTRADAS DEL PRODUCTO: SISTEMA URINARIO CERRADO NUMERO 16 (Clave: 166)
-- ====================================================================
-- ID del producto: PROD-00451
-- Stock actual: 996 unidades
-- Total de entradas registradas: 2
-- ====================================================================

\x
SELECT 
    e.id as entrada_id,
    e.folio,
    e.serie,
    TO_CHAR(e.fecha_creacion, 'DD/MM/YYYY HH24:MI:SS') as fecha_entrada,
    pr.nombre as proveedor,
    p.cantidad as cantidad_entrada,
    p.precio as precio_unitario,
    (p.cantidad * p.precio) as total_entrada,
    p.numero_lote,
    TO_CHAR(p.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento,
    p.cantidad_disponible as cantidad_restante_lote,
    e.motivo as motivo_entrada,
    e.estado as estado_entrada,
    e.observaciones
FROM partidas_entrada_inventario p
JOIN entradas_inventario e ON p.entrada_id = e.id
JOIN "Inventario" i ON p.inventario_id = i.id
LEFT JOIN proveedores pr ON e.proveedor_id = pr.id
WHERE i.clave = '166'
ORDER BY e.fecha_creacion DESC;

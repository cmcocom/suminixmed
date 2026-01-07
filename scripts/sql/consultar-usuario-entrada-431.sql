-- Consultar quién capturó la entrada con folio 431
SELECT 
    e.id as entrada_id,
    e.folio,
    e.user_id,
    u.name as usuario_nombre,
    u.clave as usuario_clave,
    u.email as usuario_email,
    TO_CHAR(e.fecha_creacion, 'DD/MM/YYYY HH24:MI:SS') as fecha_captura,
    e.motivo,
    e.estado,
    pr.nombre as proveedor
FROM entradas_inventario e
LEFT JOIN "User" u ON e.user_id = u.id
LEFT JOIN proveedores pr ON e.proveedor_id = pr.id
WHERE e.folio = '431';

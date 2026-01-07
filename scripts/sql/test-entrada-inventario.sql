-- PRUEBA DE GENERACIÓN DE ENTRADA DE INVENTARIO
BEGIN;

-- Variables para la entrada
\set entrada_id '''test_entrada_' :'CURRENT_TIMESTAMP' ''''
\set partida1_id '''test_partida1_' :'CURRENT_TIMESTAMP' ''''
\set partida2_id '''test_partida2_' :'CURRENT_TIMESTAMP' ''''

-- Verificar cantidades ANTES de la entrada
SELECT 'CANTIDADES ANTES DE LA ENTRADA' as info;
SELECT id, nombre, cantidad 
FROM "Inventario" 
WHERE id IN ('PROD-00303', 'PROD-00081');

-- Crear la entrada de inventario
INSERT INTO entradas_inventario (
    id,
    motivo,
    observaciones,
    total,
    estado,
    user_id,
    almacen_id,
    proveedor_id,
    folio,
    serie,
    fecha_entrada,
    createdAt,
    updatedAt
) VALUES (
    'test_entrada_' || extract(epoch from now())::text,
    'Prueba de entrada automática',
    'Entrada de prueba para validar funcionalidad del sistema',
    150.00,
    'COMPLETADA',
    'aeeba35b-963d-4de4-a153-047944711ed9',
    '7672b90c-65dc-4535-b1fe-9d2b68c6dd87',
    'prov-001',
    'FOL-TEST-001',
    'SER-001',
    NOW(),
    NOW(),
    NOW()
);

-- Obtener el ID de la entrada creada
\set entrada_creada_id (SELECT id FROM entradas_inventario WHERE folio = 'FOL-TEST-001' LIMIT 1)

-- Crear partidas de entrada
INSERT INTO partidas_entrada_inventario (
    id,
    entrada_id,
    inventario_id,
    cantidad,
    precio,
    orden,
    createdAt,
    updatedAt
) VALUES 
(
    'test_partida1_' || extract(epoch from now())::text,
    (SELECT id FROM entradas_inventario WHERE folio = 'FOL-TEST-001' LIMIT 1),
    'PROD-00303',
    50,
    1.50,
    1,
    NOW(),
    NOW()
),
(
    'test_partida2_' || extract(epoch from now())::text,
    (SELECT id FROM entradas_inventario WHERE folio = 'FOL-TEST-001' LIMIT 1),
    'PROD-00081',
    100,
    1.00,
    2,
    NOW(),
    NOW()
);

-- Actualizar las cantidades en el inventario (simulando el comportamiento de la aplicación)
UPDATE "Inventario" 
SET cantidad = cantidad + 50,
    updatedAt = NOW()
WHERE id = 'PROD-00303';

UPDATE "Inventario" 
SET cantidad = cantidad + 100,
    updatedAt = NOW()
WHERE id = 'PROD-00081';

-- Verificar cantidades DESPUÉS de la entrada
SELECT 'CANTIDADES DESPUÉS DE LA ENTRADA' as info;
SELECT id, nombre, cantidad 
FROM "Inventario" 
WHERE id IN ('PROD-00303', 'PROD-00081');

-- Verificar la entrada creada
SELECT 'ENTRADA CREADA' as info;
SELECT id, motivo, total, estado, folio, fecha_entrada 
FROM entradas_inventario 
WHERE folio = 'FOL-TEST-001';

-- Verificar las partidas creadas
SELECT 'PARTIDAS DE LA ENTRADA' as info;
SELECT p.id, p.inventario_id, i.nombre, p.cantidad, p.precio, (p.cantidad * p.precio) as subtotal
FROM partidas_entrada_inventario p
JOIN "Inventario" i ON p.inventario_id = i.id
WHERE p.entrada_id = (SELECT id FROM entradas_inventario WHERE folio = 'FOL-TEST-001' LIMIT 1);

COMMIT;
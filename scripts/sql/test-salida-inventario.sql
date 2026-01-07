-- PRUEBA DE GENERACIÓN DE SALIDA DE INVENTARIO
BEGIN;

-- Verificar cantidades ANTES de la salida
SELECT 'CANTIDADES ANTES DE LA SALIDA' as info;
SELECT id, nombre, cantidad 
FROM "Inventario" 
WHERE id IN ('PROD-00303', 'PROD-00081');

-- Crear la salida de inventario
INSERT INTO salidas_inventario (
    id,
    motivo,
    observaciones,
    total,
    estado,
    user_id,
    almacen_id,
    folio,
    serie,
    fecha_salida,
    tipo_salida,
    estado_surtido,
    "createdAt",
    "updatedAt"
) VALUES (
    'test_salida_' || extract(epoch from now())::text,
    'Prueba de salida automática',
    'Salida de prueba para validar funcionalidad del sistema',
    125.00,
    'COMPLETADA',
    'aeeba35b-963d-4de4-a153-047944711ed9',
    '7672b90c-65dc-4535-b1fe-9d2b68c6dd87',
    'SAL-TEST-001',
    'SER-SAL-001',
    NOW(),
    'normal',
    'completado',
    NOW(),
    NOW()
);

-- Crear partidas de salida
INSERT INTO partidas_salida_inventario (
    id,
    salida_id,
    inventario_id,
    cantidad,
    precio,
    orden,
    "createdAt",
    "updatedAt"
) VALUES 
(
    'test_partida_sal1_' || extract(epoch from now())::text,
    (SELECT id FROM salidas_inventario WHERE folio = 'SAL-TEST-001' LIMIT 1),
    'PROD-00303',
    25,
    1.50,
    1,
    NOW(),
    NOW()
),
(
    'test_partida_sal2_' || extract(epoch from now())::text,
    (SELECT id FROM salidas_inventario WHERE folio = 'SAL-TEST-001' LIMIT 1),
    'PROD-00081',
    50,
    2.00,
    2,
    NOW(),
    NOW()
);

-- Actualizar las cantidades en el inventario (simulando el comportamiento de la aplicación)
-- Para salidas, se RESTA la cantidad
UPDATE "Inventario" 
SET cantidad = cantidad - 25,
    "updatedAt" = NOW()
WHERE id = 'PROD-00303';

UPDATE "Inventario" 
SET cantidad = cantidad - 50,
    "updatedAt" = NOW()
WHERE id = 'PROD-00081';

-- Verificar cantidades DESPUÉS de la salida
SELECT 'CANTIDADES DESPUÉS DE LA SALIDA' as info;
SELECT id, nombre, cantidad 
FROM "Inventario" 
WHERE id IN ('PROD-00303', 'PROD-00081');

-- Verificar la salida creada
SELECT 'SALIDA CREADA' as info;
SELECT id, motivo, total, estado, folio, fecha_salida, tipo_salida, estado_surtido
FROM salidas_inventario 
WHERE folio = 'SAL-TEST-001';

-- Verificar las partidas creadas
SELECT 'PARTIDAS DE LA SALIDA' as info;
SELECT p.id, p.inventario_id, i.nombre, p.cantidad, p.precio, (p.cantidad * p.precio) as subtotal
FROM partidas_salida_inventario p
JOIN "Inventario" i ON p.inventario_id = i.id
WHERE p.salida_id = (SELECT id FROM salidas_inventario WHERE folio = 'SAL-TEST-001' LIMIT 1);

COMMIT;
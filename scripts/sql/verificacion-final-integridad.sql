-- VERIFICACIÓN FINAL DE INTEGRIDAD DE ENTRADAS Y SALIDAS
SELECT 'RESUMEN DE PRUEBAS REALIZADAS' as info;

-- Verificar las entradas de prueba creadas
SELECT 'ENTRADAS DE PRUEBA' as tipo_movimiento;
SELECT e.id, e.folio, e.motivo, e.total, e.estado, 
       COUNT(p.id) as num_partidas,
       SUM(p.cantidad * p.precio) as total_calculado
FROM entradas_inventario e
LEFT JOIN partidas_entrada_inventario p ON e.id = p.entrada_id
WHERE e.folio LIKE '%TEST%'
GROUP BY e.id, e.folio, e.motivo, e.total, e.estado;

-- Verificar las salidas de prueba creadas
SELECT 'SALIDAS DE PRUEBA' as tipo_movimiento;
SELECT s.id, s.folio, s.motivo, s.total, s.estado, s.estado_surtido,
       COUNT(p.id) as num_partidas,
       SUM(p.cantidad * p.precio) as total_calculado
FROM salidas_inventario s
LEFT JOIN partidas_salida_inventario p ON s.id = p.salida_id
WHERE s.folio LIKE '%TEST%'
GROUP BY s.id, s.folio, s.motivo, s.total, s.estado, s.estado_surtido;

-- Verificar estado actual de los productos afectados
SELECT 'ESTADO ACTUAL DE PRODUCTOS AFECTADOS' as verificacion;
SELECT id, nombre, cantidad, 
       cantidad - 100431 as diferencia_prod_303,  -- cantidad original era 100431
       cantidad - 28725 as diferencia_prod_081     -- cantidad original era 28725
FROM "Inventario" 
WHERE id IN ('PROD-00303', 'PROD-00081');

-- Calcular movimientos netos esperados
SELECT 'CÁLCULO DE MOVIMIENTOS ESPERADOS' as calculo;
SELECT 
    'PROD-00303' as producto,
    '+50 (entrada) -25 (salida) = +25 neto' as movimiento_esperado,
    100431 + 25 as cantidad_esperada;
    
SELECT 
    'PROD-00081' as producto,
    '+100 (entrada) -50 (salida) = +50 neto' as movimiento_esperado,
    28725 + 50 as cantidad_esperada;

-- Verificar totales generales del sistema
SELECT 'TOTALES ACTUALIZADOS DEL SISTEMA' as totales;
SELECT 
    (SELECT COUNT(*) FROM entradas_inventario) as total_entradas,
    (SELECT COUNT(*) FROM salidas_inventario) as total_salidas,
    (SELECT COUNT(*) FROM partidas_entrada_inventario) as total_partidas_entrada,
    (SELECT COUNT(*) FROM partidas_salida_inventario) as total_partidas_salida;
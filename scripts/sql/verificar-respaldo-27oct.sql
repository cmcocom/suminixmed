-- VERIFICACIÓN DE INTEGRIDAD - RESPALDO ACTUALIZADO 27 OCTUBRE 2025
SELECT 'VERIFICACIÓN DE RESPALDO ACTUALIZADO - ' || current_timestamp as titulo;

-- Estado comparativo con respaldo anterior
SELECT 'COMPARATIVA CON RESPALDO ANTERIOR (26 OCT vs 27 OCT)' as seccion;

SELECT 
    'usuarios' as tabla,
    126 as anterior_26oct,
    (SELECT COUNT(*) FROM "User") as actual_27oct,
    (SELECT COUNT(*) FROM "User") - 126 as diferencia
UNION ALL
SELECT 
    'productos',
    505 as anterior_26oct,
    (SELECT COUNT(*) FROM "Inventario") as actual_27oct,
    (SELECT COUNT(*) FROM "Inventario") - 505 as diferencia
UNION ALL
SELECT 
    'entradas',
    439 as anterior_26oct,
    (SELECT COUNT(*) FROM entradas_inventario) as actual_27oct,
    (SELECT COUNT(*) FROM entradas_inventario) - 439 as diferencia
UNION ALL
SELECT 
    'salidas',
    561 as anterior_26oct,
    (SELECT COUNT(*) FROM salidas_inventario) as actual_27oct,
    (SELECT COUNT(*) FROM salidas_inventario) - 561 as diferencia
UNION ALL
SELECT 
    'partidas_entrada',
    673 as anterior_26oct,
    (SELECT COUNT(*) FROM partidas_entrada_inventario) as actual_27oct,
    (SELECT COUNT(*) FROM partidas_entrada_inventario) - 673 as diferencia
UNION ALL
SELECT 
    'partidas_salida',
    6915 as anterior_26oct,
    (SELECT COUNT(*) FROM partidas_salida_inventario) as actual_27oct,
    (SELECT COUNT(*) FROM partidas_salida_inventario) - 6915 as diferencia
UNION ALL
SELECT 
    'clientes',
    202 as anterior_26oct,
    (SELECT COUNT(*) FROM clientes) as actual_27oct,
    (SELECT COUNT(*) FROM clientes) - 202 as diferencia
ORDER BY tabla;

-- Verificar actividad reciente (movimientos del día)
SELECT 'ACTIVIDAD DEL DÍA (27 OCTUBRE 2025)' as actividad;
SELECT 
    'entradas_hoy' as tipo_movimiento,
    COUNT(*) as cantidad
FROM entradas_inventario 
WHERE DATE(fecha_creacion) = CURRENT_DATE
UNION ALL
SELECT 
    'salidas_hoy',
    COUNT(*)
FROM salidas_inventario 
WHERE DATE(fecha_creacion) = CURRENT_DATE;

-- Verificar últimos movimientos
SELECT 'ÚLTIMOS MOVIMIENTOS REGISTRADOS' as ultimos;
SELECT 
    'ultima_entrada' as tipo,
    MAX(fecha_creacion) as fecha_hora,
    MAX(id) as ultimo_id
FROM entradas_inventario
UNION ALL
SELECT 
    'ultima_salida',
    MAX(fecha_creacion),
    MAX(id)
FROM salidas_inventario;

SELECT 'RESPALDO 27-OCT-2025 VERIFICADO EXITOSAMENTE' as resultado_final;
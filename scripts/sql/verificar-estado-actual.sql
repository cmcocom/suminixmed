-- Verificación del estado actual de la base de datos
SELECT 'ESTADO ACTUAL - ' || current_date as fecha_respaldo;

SELECT 'CONTEO DE REGISTROS PRINCIPALES' as seccion;
SELECT 
    'usuarios' as tabla,
    COUNT(*) as registros 
FROM "User"
UNION ALL
SELECT 
    'productos',
    COUNT(*) 
FROM "Inventario"
UNION ALL
SELECT 
    'entradas',
    COUNT(*) 
FROM entradas_inventario
UNION ALL
SELECT 
    'salidas',
    COUNT(*) 
FROM salidas_inventario
UNION ALL
SELECT 
    'partidas_entrada',
    COUNT(*) 
FROM partidas_entrada_inventario
UNION ALL
SELECT 
    'partidas_salida',
    COUNT(*) 
FROM partidas_salida_inventario
UNION ALL
SELECT 
    'clientes',
    COUNT(*) 
FROM clientes
ORDER BY tabla;
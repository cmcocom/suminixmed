SELECT 'Inventario' as tabla, COUNT(*) as registros FROM "Inventario"
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes  
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL
SELECT 'empleados', COUNT(*) FROM empleados
UNION ALL
SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario
UNION ALL  
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
ORDER BY registros DESC;
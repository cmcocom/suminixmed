-- Query para verificar conteos de registros después de migración
SELECT 'inventario' as tabla, COUNT(*) as registros FROM "Inventario"
UNION ALL
SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario  
UNION ALL
SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario
UNION ALL
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
UNION ALL 
SELECT 'partidas_salida_inventario', COUNT(*) FROM partidas_salida_inventario
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'almacenes', COUNT(*) FROM almacenes
UNION ALL
SELECT 'tipos_entrada', COUNT(*) FROM tipos_entrada
UNION ALL
SELECT 'tipos_salida', COUNT(*) FROM tipos_salida
UNION ALL
SELECT 'unidades_medida', COUNT(*) FROM unidades_medida;
-- Verificar datos cargados
SELECT 'Productos' as tabla, COUNT(*) as total FROM "Inventario"
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM "User"
UNION ALL  
SELECT 'Clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Entradas', COUNT(*) FROM entradas_inventario
UNION ALL
SELECT 'Salidas', COUNT(*) FROM salidas_inventario;
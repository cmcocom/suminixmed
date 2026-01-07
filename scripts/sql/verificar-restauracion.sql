-- Verificación de conteos después de la restauración
SELECT 
  'User (usuarios)' as tabla, 
  COUNT(*) as registros 
FROM "User" 

UNION ALL 

SELECT 
  'Inventario (productos)', 
  COUNT(*) 
FROM "Inventario" 

UNION ALL 

SELECT 
  'entradas_inventario', 
  COUNT(*) 
FROM entradas_inventario 

UNION ALL 

SELECT 
  'salidas_inventario', 
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

UNION ALL 

SELECT 
  'proveedores', 
  COUNT(*) 
FROM proveedores 

UNION ALL 

SELECT 
  'categorias', 
  COUNT(*) 
FROM categorias 

UNION ALL

SELECT
  'rbac_roles',
  COUNT(*)
FROM rbac_roles

UNION ALL

SELECT
  'rbac_permissions', 
  COUNT(*)
FROM rbac_permissions

ORDER BY tabla;
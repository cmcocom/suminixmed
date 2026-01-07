-- Verificar datos disponibles para las pruebas
SELECT 'PRODUCTOS DISPONIBLES' as info;
SELECT id, nombre, clave, cantidad, precio 
FROM "Inventario" 
WHERE estado = 'disponible' 
ORDER BY cantidad DESC 
LIMIT 5;

SELECT 'USUARIOS DISPONIBLES' as info;
SELECT id, email, name 
FROM "User" 
WHERE id IS NOT NULL 
LIMIT 3;

SELECT 'PROVEEDORES DISPONIBLES' as info;
SELECT id, nombre 
FROM proveedores 
LIMIT 3;

SELECT 'ALMACENES DISPONIBLES' as info;
SELECT id, nombre 
FROM almacenes 
LIMIT 3;
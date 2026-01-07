-- Verificar migración de productos
SELECT 'TOTAL DE PRODUCTOS:' as descripcion, COUNT(*) as valor FROM "Inventario"
UNION ALL
SELECT 'PRODUCTOS CON CEROS A LA IZQUIERDA:' as descripcion, COUNT(*) as valor FROM "Inventario" WHERE clave LIKE '0%';

-- Mostrar productos con ceros preservados
SELECT '=== PRODUCTOS CON CEROS A LA IZQUIERDA ===' as titulo;
SELECT clave, nombre FROM "Inventario" WHERE clave LIKE '0%' ORDER BY clave LIMIT 15;

-- Mostrar algunos productos para verificar estructura
SELECT '=== MUESTRA GENERAL DE PRODUCTOS ===' as titulo;
SELECT clave, nombre, cantidad, precio_unitario FROM "Inventario" ORDER BY clave LIMIT 10;
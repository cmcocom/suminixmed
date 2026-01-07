-- Buscar producto 166
SELECT id, clave, nombre, cantidad, estado
FROM "Inventario"
WHERE id = '166' OR clave = '166' OR clave LIKE '%166%'
LIMIT 10;

-- Ver todas las entradas que existen (muestra general)
SELECT COUNT(*) as total_entradas
FROM partidas_entrada_inventario;

-- Ver productos con entradas
SELECT DISTINCT i.id, i.clave, i.nombre, COUNT(p.id) as num_entradas
FROM "Inventario" i
JOIN partidas_entrada_inventario p ON p.inventario_id = i.id
WHERE i.clave LIKE '%166%' OR i.id = '166'
GROUP BY i.id, i.clave, i.nombre;

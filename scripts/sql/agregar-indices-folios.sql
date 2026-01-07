-- Agregar índices para optimizar búsquedas y ordenamiento por folio
-- Fecha: 2025-11-07
-- Descripción: Agregar índices en columnas folio para entradas y salidas

-- Índice en folio de entradas_inventario
CREATE INDEX IF NOT EXISTS "entradas_inventario_folio_idx" ON "entradas_inventario"("folio");

-- Índice compuesto serie-folio de entradas_inventario  
CREATE INDEX IF NOT EXISTS "entradas_inventario_serie_folio_idx" ON "entradas_inventario"("serie", "folio");

-- Índice en folio de salidas_inventario
CREATE INDEX IF NOT EXISTS "salidas_inventario_folio_idx" ON "salidas_inventario"("folio");

-- Índice compuesto serie-folio de salidas_inventario
CREATE INDEX IF NOT EXISTS "salidas_inventario_serie_folio_idx" ON "salidas_inventario"("serie", "folio");

-- Verificar índices creados
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('entradas_inventario', 'salidas_inventario')
    AND indexname LIKE '%folio%'
ORDER BY tablename, indexname;

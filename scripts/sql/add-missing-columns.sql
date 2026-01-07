-- Agregar columnas faltantes a entradas_inventario
ALTER TABLE entradas_inventario 
ADD COLUMN IF NOT EXISTS folio VARCHAR(50),
ADD COLUMN IF NOT EXISTS serie VARCHAR(50),
ADD COLUMN IF NOT EXISTS fecha_entrada TIMESTAMP;

-- Agregar columnas faltantes a salidas_inventario
ALTER TABLE salidas_inventario 
ADD COLUMN IF NOT EXISTS folio VARCHAR(50),
ADD COLUMN IF NOT EXISTS serie VARCHAR(50),
ADD COLUMN IF NOT EXISTS fecha_salida TIMESTAMP;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_entradas_folio ON entradas_inventario(folio);
CREATE INDEX IF NOT EXISTS idx_entradas_fecha_entrada ON entradas_inventario(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_salidas_folio ON salidas_inventario(folio);
CREATE INDEX IF NOT EXISTS idx_salidas_fecha_salida ON salidas_inventario(fecha_salida);

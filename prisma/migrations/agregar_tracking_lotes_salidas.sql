-- Agregar campos de tracking de lotes a partidas_salida_inventario
-- Esto permite trazabilidad completa: saber de qué lote específico salió cada producto

-- 1. Agregar columna para FK al lote de entrada
ALTER TABLE partidas_salida_inventario 
ADD COLUMN lote_entrada_id VARCHAR(255);

-- 2. Agregar columna para guardar número de lote (copia para trazabilidad)
ALTER TABLE partidas_salida_inventario 
ADD COLUMN numero_lote VARCHAR(50);

-- 3. Agregar columna para guardar fecha de vencimiento del lote (copia para trazabilidad)
ALTER TABLE partidas_salida_inventario 
ADD COLUMN fecha_vencimiento_lote TIMESTAMP;

-- 4. Crear índice en lote_entrada_id para mejorar queries de trazabilidad
CREATE INDEX idx_partidas_salida_lote_entrada ON partidas_salida_inventario(lote_entrada_id);

-- 5. Crear índice en numero_lote para búsquedas por lote
CREATE INDEX idx_partidas_salida_numero_lote ON partidas_salida_inventario(numero_lote);

-- 6. Agregar FK constraint (opcional, puede ejecutarse después si hay datos)
-- NOTA: Por ahora no agregamos el constraint para permitir retrocompatibilidad con salidas antiguas
-- ALTER TABLE partidas_salida_inventario 
-- ADD CONSTRAINT fk_partidas_salida_lote_entrada 
-- FOREIGN KEY (lote_entrada_id) REFERENCES partidas_entrada_inventario(id) 
-- ON DELETE SET NULL;

-- Los campos son opcionales (nullable) para:
-- 1. Permitir retrocompatibilidad con salidas existentes sin lotes
-- 2. Permitir salidas de productos que no requieren tracking de lotes (entidades con capturar_lotes=false)

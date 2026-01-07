-- Migración: Eliminar columna proveedor de Inventario
-- Fecha: 17 de octubre de 2025
-- Razón: El proveedor se almacena en entradas_inventario.proveedor_id, no en productos

-- Eliminar columna proveedor de Inventario
ALTER TABLE "Inventario" DROP COLUMN IF EXISTS "proveedor";

-- Comentario
COMMENT ON TABLE "Inventario" IS 'Tabla de productos del inventario. El proveedor se registra en las entradas, no en el producto.';

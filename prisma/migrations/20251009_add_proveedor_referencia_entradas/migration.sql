-- Agregar campos de proveedor y referencia externa a entradas_inventario
ALTER TABLE "entradas_inventario" ADD COLUMN IF NOT EXISTS "proveedor_id" TEXT;
ALTER TABLE "entradas_inventario" ADD COLUMN IF NOT EXISTS "referencia_externa" VARCHAR(100);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS "entradas_inventario_proveedor_id_idx" ON "entradas_inventario"("proveedor_id");
CREATE INDEX IF NOT EXISTS "entradas_inventario_referencia_externa_idx" ON "entradas_inventario"("referencia_externa");

-- Agregar constraint de foreign key para proveedor
ALTER TABLE "entradas_inventario" 
ADD CONSTRAINT "fk_entradas_proveedor" 
FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL;

-- Comentarios para documentación
COMMENT ON COLUMN "entradas_inventario"."proveedor_id" IS 'ID del proveedor (requerido para tipos de entrada que lo necesiten)';
COMMENT ON COLUMN "entradas_inventario"."referencia_externa" IS 'Número de factura, orden de compra u otro documento externo';

-- Manual migration to add additional fields
-- Adding fields to Inventario table
ALTER TABLE "Inventario" ADD COLUMN IF NOT EXISTS "codigo_barras" VARCHAR(100);
ALTER TABLE "Inventario" ADD COLUMN IF NOT EXISTS "numero_lote" VARCHAR(50);

-- Adding field to clientes table
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "codigo_postal" VARCHAR(10);

-- Adding field to proveedores table
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "condiciones_pago" VARCHAR(100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Inventario_codigo_barras_idx" ON "Inventario"("codigo_barras");
CREATE INDEX IF NOT EXISTS "Inventario_numero_lote_idx" ON "Inventario"("numero_lote");
CREATE INDEX IF NOT EXISTS "clientes_codigo_postal_idx" ON "clientes"("codigo_postal");
CREATE INDEX IF NOT EXISTS "proveedores_condiciones_pago_idx" ON "proveedores"("condiciones_pago");
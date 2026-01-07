-- Agregar campos de control de inventario a la tabla Inventario
-- Estos campos son esenciales para el control automático de órdenes de compra

ALTER TABLE "Inventario" ADD COLUMN "cantidad_minima" INTEGER DEFAULT 0;
ALTER TABLE "Inventario" ADD COLUMN "cantidad_maxima" INTEGER DEFAULT 0;
ALTER TABLE "Inventario" ADD COLUMN "punto_reorden" INTEGER DEFAULT 0;
ALTER TABLE "Inventario" ADD COLUMN "dias_reabastecimiento" INTEGER DEFAULT 7;

-- Índices para mejorar performance en consultas de control de stock
CREATE INDEX "Inventario_cantidad_minima_idx" ON "Inventario"("cantidad_minima");
CREATE INDEX "Inventario_punto_reorden_idx" ON "Inventario"("punto_reorden");
CREATE INDEX "Inventario_control_stock_idx" ON "Inventario"("cantidad", "cantidad_minima", "punto_reorden");

-- Comentarios para documentar los campos
COMMENT ON COLUMN "Inventario"."cantidad_minima" IS 'Cantidad mínima de stock para generar alerta';
COMMENT ON COLUMN "Inventario"."cantidad_maxima" IS 'Cantidad máxima recomendada en inventario';  
COMMENT ON COLUMN "Inventario"."punto_reorden" IS 'Punto en el que se debe generar orden de compra automática';
COMMENT ON COLUMN "Inventario"."dias_reabastecimiento" IS 'Días estimados para reabastecimiento del proveedor';
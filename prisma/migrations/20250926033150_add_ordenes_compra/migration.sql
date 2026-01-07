-- CreateTable
CREATE TABLE "public"."ordenes_compra" (
    "id" TEXT NOT NULL,
    "numero_orden" VARCHAR(50) NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega_esperada" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "usuario_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalle_orden_compra" (
    "id" TEXT NOT NULL,
    "orden_compra_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalle_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_numero_orden_key" ON "public"."ordenes_compra"("numero_orden");

-- CreateIndex
CREATE INDEX "ordenes_compra_proveedor_id_idx" ON "public"."ordenes_compra"("proveedor_id");

-- CreateIndex
CREATE INDEX "ordenes_compra_usuario_id_idx" ON "public"."ordenes_compra"("usuario_id");

-- CreateIndex
CREATE INDEX "ordenes_compra_estado_idx" ON "public"."ordenes_compra"("estado");

-- CreateIndex
CREATE INDEX "ordenes_compra_fecha_orden_idx" ON "public"."ordenes_compra"("fecha_orden");

-- CreateIndex
CREATE INDEX "detalle_orden_compra_orden_compra_id_idx" ON "public"."detalle_orden_compra"("orden_compra_id");

-- CreateIndex
CREATE INDEX "detalle_orden_compra_producto_id_idx" ON "public"."detalle_orden_compra"("producto_id");

-- CreateIndex
CREATE INDEX "detalle_orden_compra_orden_idx" ON "public"."detalle_orden_compra"("orden");

-- AddForeignKey
ALTER TABLE "public"."ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordenes_compra" ADD CONSTRAINT "ordenes_compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_orden_compra" ADD CONSTRAINT "detalle_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_orden_compra" ADD CONSTRAINT "detalle_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."Inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."Inventario" ADD COLUMN     "cantidad_maxima" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_minima" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dias_reabastecimiento" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "punto_reorden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ubicacion_general" VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."audit_log" ADD COLUMN     "description" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "level" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" TEXT,
ADD COLUMN     "user_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."entradas_inventario" ADD COLUMN     "almacen_id" TEXT;

-- AlterTable
ALTER TABLE "public"."salidas_inventario" ADD COLUMN     "almacen_id" TEXT;

-- CreateTable
CREATE TABLE "public"."almacenes" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "direccion" VARCHAR(255),
    "responsable" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ubicaciones_almacen" (
    "id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'ESTANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventario_almacen" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "ubicacion_id" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "cantidad_minima" INTEGER NOT NULL DEFAULT 0,
    "cantidad_maxima" INTEGER NOT NULL DEFAULT 0,
    "punto_reorden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventarios_fisicos" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_finalizacion" TIMESTAMP(3),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'EN_PROCESO',
    "almacen_id" TEXT,
    "usuario_creador_id" TEXT NOT NULL,
    "total_productos" INTEGER NOT NULL DEFAULT 0,
    "total_ajustes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventarios_fisicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventarios_fisicos_detalle" (
    "id" TEXT NOT NULL,
    "inventario_fisico_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad_sistema" INTEGER NOT NULL,
    "cantidad_contada" INTEGER,
    "diferencia" INTEGER,
    "observaciones" TEXT,
    "ajustado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventarios_fisicos_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "almacenes_activo_idx" ON "public"."almacenes"("activo");

-- CreateIndex
CREATE INDEX "almacenes_es_principal_idx" ON "public"."almacenes"("es_principal");

-- CreateIndex
CREATE INDEX "almacenes_nombre_activo_idx" ON "public"."almacenes"("nombre", "activo");

-- CreateIndex
CREATE INDEX "ubicaciones_almacen_almacen_id_activo_idx" ON "public"."ubicaciones_almacen"("almacen_id", "activo");

-- CreateIndex
CREATE INDEX "ubicaciones_almacen_tipo_idx" ON "public"."ubicaciones_almacen"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_almacen_almacen_id_nombre_key" ON "public"."ubicaciones_almacen"("almacen_id", "nombre");

-- CreateIndex
CREATE INDEX "inventario_almacen_almacen_id_idx" ON "public"."inventario_almacen"("almacen_id");

-- CreateIndex
CREATE INDEX "inventario_almacen_producto_id_idx" ON "public"."inventario_almacen"("producto_id");

-- CreateIndex
CREATE INDEX "inventario_almacen_ubicacion_id_idx" ON "public"."inventario_almacen"("ubicacion_id");

-- CreateIndex
CREATE INDEX "inventario_almacen_cantidad_idx" ON "public"."inventario_almacen"("cantidad");

-- CreateIndex
CREATE INDEX "inventario_almacen_cantidad_cantidad_minima_idx" ON "public"."inventario_almacen"("cantidad", "cantidad_minima");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_almacen_producto_id_almacen_id_key" ON "public"."inventario_almacen"("producto_id", "almacen_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_estado_idx" ON "public"."inventarios_fisicos"("estado");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_fecha_inicio_idx" ON "public"."inventarios_fisicos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_usuario_creador_id_idx" ON "public"."inventarios_fisicos"("usuario_creador_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_almacen_id_idx" ON "public"."inventarios_fisicos"("almacen_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_detalle_inventario_fisico_id_idx" ON "public"."inventarios_fisicos_detalle"("inventario_fisico_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_detalle_producto_id_idx" ON "public"."inventarios_fisicos_detalle"("producto_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_detalle_ajustado_idx" ON "public"."inventarios_fisicos_detalle"("ajustado");

-- CreateIndex
CREATE UNIQUE INDEX "inventarios_fisicos_detalle_inventario_fisico_id_producto_i_key" ON "public"."inventarios_fisicos_detalle"("inventario_fisico_id", "producto_id");

-- CreateIndex
CREATE INDEX "Inventario_cantidad_minima_idx" ON "public"."Inventario"("cantidad_minima");

-- CreateIndex
CREATE INDEX "Inventario_punto_reorden_idx" ON "public"."Inventario"("punto_reorden");

-- CreateIndex
CREATE INDEX "Inventario_cantidad_cantidad_minima_punto_reorden_idx" ON "public"."Inventario"("cantidad", "cantidad_minima", "punto_reorden");

-- CreateIndex
CREATE INDEX "Inventario_ubicacion_general_idx" ON "public"."Inventario"("ubicacion_general");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "public"."audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_level_idx" ON "public"."audit_log"("level");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "public"."audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_user_id_changed_at_idx" ON "public"."audit_log"("user_id", "changed_at");

-- CreateIndex
CREATE INDEX "audit_log_table_name_action_idx" ON "public"."audit_log"("table_name", "action");

-- CreateIndex
CREATE INDEX "entradas_inventario_almacen_id_idx" ON "public"."entradas_inventario"("almacen_id");

-- CreateIndex
CREATE INDEX "salidas_inventario_almacen_id_idx" ON "public"."salidas_inventario"("almacen_id");

-- AddForeignKey
ALTER TABLE "public"."ubicaciones_almacen" ADD CONSTRAINT "ubicaciones_almacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "public"."almacenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventario_almacen" ADD CONSTRAINT "inventario_almacen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."Inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventario_almacen" ADD CONSTRAINT "inventario_almacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "public"."almacenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventario_almacen" ADD CONSTRAINT "inventario_almacen_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."ubicaciones_almacen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entradas_inventario" ADD CONSTRAINT "entradas_inventario_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "public"."almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salidas_inventario" ADD CONSTRAINT "salidas_inventario_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "public"."almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventarios_fisicos" ADD CONSTRAINT "inventarios_fisicos_usuario_creador_id_fkey" FOREIGN KEY ("usuario_creador_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventarios_fisicos" ADD CONSTRAINT "inventarios_fisicos_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "public"."almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventarios_fisicos_detalle" ADD CONSTRAINT "inventarios_fisicos_detalle_inventario_fisico_id_fkey" FOREIGN KEY ("inventario_fisico_id") REFERENCES "public"."inventarios_fisicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventarios_fisicos_detalle" ADD CONSTRAINT "inventarios_fisicos_detalle_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

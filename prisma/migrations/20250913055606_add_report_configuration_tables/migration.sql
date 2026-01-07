-- CreateEnum
CREATE TYPE "public"."ColumnDataType" AS ENUM ('TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'DATETIME', 'BOOLEAN', 'ENUM', 'JSON');

-- CreateEnum
CREATE TYPE "public"."ColumnAlignment" AS ENUM ('LEFT', 'CENTER', 'RIGHT');

-- CreateEnum
CREATE TYPE "public"."FilterType" AS ENUM ('TEXT_INPUT', 'NUMBER_INPUT', 'DATE_PICKER', 'DATE_RANGE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'RANGE_SLIDER');

-- CreateEnum
CREATE TYPE "public"."FilterDataType" AS ENUM ('STRING', 'INTEGER', 'FLOAT', 'DATE', 'BOOLEAN', 'ARRAY');

-- CreateEnum
CREATE TYPE "public"."TipoRol" AS ENUM ('DESARROLLADOR', 'ADMINISTRADOR', 'COLABORADOR', 'OPERADOR');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "rol" "public"."TipoRol" NOT NULL DEFAULT 'OPERADOR';

-- AlterTable
ALTER TABLE "public"."clientes" ADD COLUMN     "id_usuario" TEXT;

-- AlterTable
ALTER TABLE "public"."ffijo" ADD COLUMN     "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
ADD COLUMN     "id_cliente" TEXT,
ADD COLUMN     "observaciones" VARCHAR(255);

-- CreateTable
CREATE TABLE "public"."partidas_salida_inventario" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "inventario_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidas_salida_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salidas_inventario" (
    "id" TEXT NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "observaciones" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'COMPLETADA',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salidas_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partidas_entrada_inventario" (
    "id" TEXT NOT NULL,
    "entrada_id" TEXT NOT NULL,
    "inventario_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidas_entrada_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entradas_inventario" (
    "id" TEXT NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "observaciones" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'COMPLETADA',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entradas_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_configurations" (
    "id" TEXT NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_columns" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "column_key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "data_type" "public"."ColumnDataType" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "alignment" "public"."ColumnAlignment" NOT NULL DEFAULT 'LEFT',
    "format" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_filters" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "filter_key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "filter_type" "public"."FilterType" NOT NULL,
    "data_type" "public"."FilterDataType" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "placeholder" VARCHAR(100),
    "default_value" VARCHAR(255),
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_inventario_id_idx" ON "public"."partidas_salida_inventario"("inventario_id");

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_orden_idx" ON "public"."partidas_salida_inventario"("orden");

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_salida_id_idx" ON "public"."partidas_salida_inventario"("salida_id");

-- CreateIndex
CREATE INDEX "salidas_inventario_estado_idx" ON "public"."salidas_inventario"("estado");

-- CreateIndex
CREATE INDEX "salidas_inventario_fecha_creacion_idx" ON "public"."salidas_inventario"("fecha_creacion");

-- CreateIndex
CREATE INDEX "salidas_inventario_user_id_idx" ON "public"."salidas_inventario"("user_id");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_inventario_id_idx" ON "public"."partidas_entrada_inventario"("inventario_id");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_orden_idx" ON "public"."partidas_entrada_inventario"("orden");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_entrada_id_idx" ON "public"."partidas_entrada_inventario"("entrada_id");

-- CreateIndex
CREATE INDEX "entradas_inventario_estado_idx" ON "public"."entradas_inventario"("estado");

-- CreateIndex
CREATE INDEX "entradas_inventario_fecha_creacion_idx" ON "public"."entradas_inventario"("fecha_creacion");

-- CreateIndex
CREATE INDEX "entradas_inventario_user_id_idx" ON "public"."entradas_inventario"("user_id");

-- CreateIndex
CREATE INDEX "report_configurations_report_type_is_active_idx" ON "public"."report_configurations"("report_type", "is_active");

-- CreateIndex
CREATE INDEX "report_configurations_is_default_report_type_idx" ON "public"."report_configurations"("is_default", "report_type");

-- CreateIndex
CREATE UNIQUE INDEX "report_configurations_report_type_name_key" ON "public"."report_configurations"("report_type", "name");

-- CreateIndex
CREATE INDEX "report_columns_configuration_id_sort_order_idx" ON "public"."report_columns"("configuration_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "report_columns_configuration_id_column_key_key" ON "public"."report_columns"("configuration_id", "column_key");

-- CreateIndex
CREATE INDEX "report_filters_configuration_id_sort_order_idx" ON "public"."report_filters"("configuration_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "report_filters_configuration_id_filter_key_key" ON "public"."report_filters"("configuration_id", "filter_key");

-- CreateIndex
CREATE INDEX "clientes_id_usuario_idx" ON "public"."clientes"("id_usuario");

-- CreateIndex
CREATE INDEX "clientes_id_usuario_activo_idx" ON "public"."clientes"("id_usuario", "activo");

-- CreateIndex
CREATE INDEX "ffijo_id_cliente_idx" ON "public"."ffijo"("id_cliente");

-- CreateIndex
CREATE INDEX "ffijo_estado_idx" ON "public"."ffijo"("estado");

-- AddForeignKey
ALTER TABLE "public"."ffijo" ADD CONSTRAINT "ffijo_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partidas_salida_inventario" ADD CONSTRAINT "partidas_salida_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "public"."Inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partidas_salida_inventario" ADD CONSTRAINT "partidas_salida_inventario_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "public"."salidas_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salidas_inventario" ADD CONSTRAINT "salidas_inventario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partidas_entrada_inventario" ADD CONSTRAINT "partidas_entrada_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "public"."Inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partidas_entrada_inventario" ADD CONSTRAINT "partidas_entrada_inventario_entrada_id_fkey" FOREIGN KEY ("entrada_id") REFERENCES "public"."entradas_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entradas_inventario" ADD CONSTRAINT "entradas_inventario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_configurations" ADD CONSTRAINT "report_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_columns" ADD CONSTRAINT "report_columns_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "public"."report_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_filters" ADD CONSTRAINT "report_filters_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "public"."report_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

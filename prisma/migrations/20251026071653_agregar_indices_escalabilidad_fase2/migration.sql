/*
  Warnings:

  - You are about to drop the column `codigo_barras` on the `Inventario` table. All the data in the column will be lost.
  - You are about to drop the column `fechaIngreso` on the `Inventario` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfMonth` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfWeek` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `lastRun` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `nextRun` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `retentionCount` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `retentionDays` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `backup_config` table. All the data in the column will be lost.
  - You are about to drop the column `backupType` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `durationSeconds` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `tablesCount` on the `backup_history` table. All the data in the column will be lost.
  - You are about to drop the column `indicator_id` on the `dashboard_user_configs` table. All the data in the column will be lost.
  - You are about to drop the column `is_visible` on the `dashboard_user_configs` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `dashboard_user_configs` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `dashboard_user_configs` table. All the data in the column will be lost.
  - You are about to drop the `dashboard_indicator_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dashboard_indicators` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `dashboard_user_configs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `backup_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `backup_type` to the `backup_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `config` to the `dashboard_user_configs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" DROP CONSTRAINT "dashboard_indicator_permissions_granted_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" DROP CONSTRAINT "dashboard_indicator_permissions_indicator_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" DROP CONSTRAINT "dashboard_indicator_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" DROP CONSTRAINT "dashboard_indicator_permissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."dashboard_indicators" DROP CONSTRAINT "dashboard_indicators_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."dashboard_user_configs" DROP CONSTRAINT "dashboard_user_configs_indicator_id_fkey";

-- DropIndex
DROP INDEX "public"."backup_history_backupType_idx";

-- DropIndex
DROP INDEX "public"."backup_history_startedAt_idx";

-- DropIndex
DROP INDEX "public"."dashboard_user_configs_user_id_indicator_id_key";

-- AlterTable
ALTER TABLE "Inventario" DROP COLUMN "codigo_barras",
DROP COLUMN "fechaIngreso",
ADD COLUMN     "unidad_medida_id" TEXT;

-- AlterTable
ALTER TABLE "backup_config" DROP COLUMN "createdAt",
DROP COLUMN "dayOfMonth",
DROP COLUMN "dayOfWeek",
DROP COLUMN "lastRun",
DROP COLUMN "nextRun",
DROP COLUMN "retentionCount",
DROP COLUMN "retentionDays",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "day_of_month" INTEGER,
ADD COLUMN     "day_of_week" INTEGER,
ADD COLUMN     "last_run" TIMESTAMP(3),
ADD COLUMN     "next_run" TIMESTAMP(3),
ADD COLUMN     "retention_count" INTEGER,
ADD COLUMN     "retention_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "backup_history" DROP COLUMN "backupType",
DROP COLUMN "completedAt",
DROP COLUMN "createdBy",
DROP COLUMN "durationSeconds",
DROP COLUMN "errorMessage",
DROP COLUMN "sizeBytes",
DROP COLUMN "startedAt",
DROP COLUMN "tablesCount",
ADD COLUMN     "backup_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "created_by" VARCHAR(100),
ADD COLUMN     "duration_seconds" INTEGER,
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "size_bytes" BIGINT,
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tables_count" INTEGER;

-- AlterTable
ALTER TABLE "dashboard_user_configs" DROP COLUMN "indicator_id",
DROP COLUMN "is_visible",
DROP COLUMN "position",
DROP COLUMN "size",
ADD COLUMN     "config" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "entidades" ADD COLUMN     "capturar_lotes_entradas" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "entradas_inventario" ADD COLUMN     "fecha_entrada" TIMESTAMP(3),
ADD COLUMN     "folio" VARCHAR(50),
ADD COLUMN     "serie" VARCHAR(50),
ALTER COLUMN "observaciones" DROP NOT NULL;

-- AlterTable
ALTER TABLE "partidas_entrada_inventario" ADD COLUMN     "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fecha_vencimiento" TIMESTAMP(3),
ADD COLUMN     "numero_lote" VARCHAR(50);

-- AlterTable
ALTER TABLE "partidas_salida_inventario" ADD COLUMN     "fecha_vencimiento_lote" TIMESTAMP(3),
ADD COLUMN     "lote_entrada_id" VARCHAR(255),
ADD COLUMN     "numero_lote" VARCHAR(50);

-- AlterTable
ALTER TABLE "salidas_inventario" ADD COLUMN     "cliente_id" TEXT,
ADD COLUMN     "fecha_salida" TIMESTAMP(3),
ADD COLUMN     "folio" VARCHAR(50),
ADD COLUMN     "serie" VARCHAR(50);

-- DropTable
DROP TABLE "public"."dashboard_indicator_permissions";

-- DropTable
DROP TABLE "public"."dashboard_indicators";

-- DropEnum
DROP TYPE "public"."IndicatorType";

-- CreateTable
CREATE TABLE "config_folios" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "serie_actual" TEXT DEFAULT '',
    "proximo_folio" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_folios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" TEXT NOT NULL,
    "clave" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_folios_tipo_key" ON "config_folios"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_clave_key" ON "unidades_medida"("clave");

-- CreateIndex
CREATE INDEX "unidades_medida_activo_idx" ON "unidades_medida"("activo");

-- CreateIndex
CREATE INDEX "unidades_medida_clave_idx" ON "unidades_medida"("clave");

-- CreateIndex
CREATE INDEX "Inventario_unidad_medida_id_idx" ON "Inventario"("unidad_medida_id");

-- CreateIndex
CREATE INDEX "backup_history_backup_type_idx" ON "backup_history"("backup_type");

-- CreateIndex
CREATE INDEX "backup_history_started_at_idx" ON "backup_history"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_user_configs_user_id_key" ON "dashboard_user_configs"("user_id");

-- CreateIndex
CREATE INDEX "entradas_inventario_fecha_entrada_idx" ON "entradas_inventario"("fecha_entrada");

-- CreateIndex
CREATE INDEX "entradas_inventario_tipo_entrada_id_idx" ON "entradas_inventario"("tipo_entrada_id");

-- CreateIndex
CREATE INDEX "entradas_inventario_proveedor_id_fecha_creacion_idx" ON "entradas_inventario"("proveedor_id", "fecha_creacion");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_fecha_vencimiento_idx" ON "partidas_entrada_inventario"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_numero_lote_idx" ON "partidas_entrada_inventario"("numero_lote");

-- CreateIndex
CREATE INDEX "partidas_entrada_inventario_entrada_id_inventario_id_idx" ON "partidas_entrada_inventario"("entrada_id", "inventario_id");

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_lote_entrada_id_idx" ON "partidas_salida_inventario"("lote_entrada_id");

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_numero_lote_idx" ON "partidas_salida_inventario"("numero_lote");

-- CreateIndex
CREATE INDEX "partidas_salida_inventario_salida_id_inventario_id_idx" ON "partidas_salida_inventario"("salida_id", "inventario_id");

-- CreateIndex
CREATE INDEX "salidas_inventario_cliente_id_idx" ON "salidas_inventario"("cliente_id");

-- CreateIndex
CREATE INDEX "salidas_inventario_fecha_salida_idx" ON "salidas_inventario"("fecha_salida");

-- CreateIndex
CREATE INDEX "salidas_inventario_tipo_salida_id_idx" ON "salidas_inventario"("tipo_salida_id");

-- CreateIndex
CREATE INDEX "salidas_inventario_cliente_id_fecha_creacion_idx" ON "salidas_inventario"("cliente_id", "fecha_creacion");

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "unidades_medida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas_salida_inventario" ADD CONSTRAINT "partidas_salida_inventario_lote_entrada_id_fkey" FOREIGN KEY ("lote_entrada_id") REFERENCES "partidas_entrada_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas_inventario" ADD CONSTRAINT "salidas_inventario_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

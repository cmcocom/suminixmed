/*
  Warnings:

  - You are about to drop the `report_columns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_filters` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."IndicatorType" AS ENUM ('METRIC', 'COUNT', 'PERCENTAGE', 'CURRENCY', 'TREND', 'ALERT', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "public"."report_columns" DROP CONSTRAINT "report_columns_configuration_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."report_configurations" DROP CONSTRAINT "report_configurations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."report_filters" DROP CONSTRAINT "report_filters_configuration_id_fkey";

-- AlterTable
ALTER TABLE "public"."ffijo" ADD COLUMN     "dias_restablecimiento" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "ultima_fecha_restablecimiento" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."salidas_inventario" ADD COLUMN     "estado_surtido" VARCHAR(20) NOT NULL DEFAULT 'pendiente_surtido',
ADD COLUMN     "solicitud_origen_id" VARCHAR(255),
ADD COLUMN     "tipo_salida" VARCHAR(20) NOT NULL DEFAULT 'normal';

-- DropTable
DROP TABLE "public"."report_columns";

-- DropTable
DROP TABLE "public"."report_configurations";

-- DropTable
DROP TABLE "public"."report_filters";

-- DropEnum
DROP TYPE "public"."ColumnAlignment";

-- DropEnum
DROP TYPE "public"."ColumnDataType";

-- DropEnum
DROP TYPE "public"."FilterDataType";

-- DropEnum
DROP TYPE "public"."FilterType";

-- CreateTable
CREATE TABLE "public"."configuracion_salidas" (
    "id" SERIAL NOT NULL,
    "acumular_pendientes_con_fijo" BOOLEAN NOT NULL DEFAULT true,
    "dias_restablecimiento_global" INTEGER NOT NULL DEFAULT 30,
    "permitir_solicitudes_sin_stock" BOOLEAN NOT NULL DEFAULT true,
    "notificar_excesos_fondo" BOOLEAN NOT NULL DEFAULT true,
    "max_dias_pendiente" INTEGER NOT NULL DEFAULT 30,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_salidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_audit_log" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboard_indicators" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "type" "public"."IndicatorType" NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "query" TEXT NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(20) NOT NULL DEFAULT 'blue',
    "order_position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "refresh_interval" INTEGER NOT NULL DEFAULT 300,
    "format" VARCHAR(20) NOT NULL DEFAULT 'number',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboard_indicator_permissions" (
    "id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "role_id" TEXT,
    "user_id" TEXT,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_indicator_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboard_user_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "size" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_user_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_name_key" ON "public"."rbac_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_permissions_module_action_key" ON "public"."rbac_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_role_id_permission_id_key" ON "public"."rbac_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_user_roles_user_id_role_id_key" ON "public"."rbac_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "dashboard_indicators_is_active_idx" ON "public"."dashboard_indicators"("is_active");

-- CreateIndex
CREATE INDEX "dashboard_indicators_category_idx" ON "public"."dashboard_indicators"("category");

-- CreateIndex
CREATE INDEX "dashboard_indicators_order_position_idx" ON "public"."dashboard_indicators"("order_position");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_indicator_permissions_indicator_id_role_id_key" ON "public"."dashboard_indicator_permissions"("indicator_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_indicator_permissions_indicator_id_user_id_key" ON "public"."dashboard_indicator_permissions"("indicator_id", "user_id");

-- CreateIndex
CREATE INDEX "dashboard_user_configs_user_id_idx" ON "public"."dashboard_user_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_user_configs_user_id_indicator_id_key" ON "public"."dashboard_user_configs"("user_id", "indicator_id");

-- CreateIndex
CREATE INDEX "ffijo_ultima_fecha_restablecimiento_idx" ON "public"."ffijo"("ultima_fecha_restablecimiento");

-- CreateIndex
CREATE INDEX "ffijo_dias_restablecimiento_idx" ON "public"."ffijo"("dias_restablecimiento");

-- CreateIndex
CREATE INDEX "salidas_inventario_tipo_salida_idx" ON "public"."salidas_inventario"("tipo_salida");

-- CreateIndex
CREATE INDEX "salidas_inventario_estado_surtido_idx" ON "public"."salidas_inventario"("estado_surtido");

-- CreateIndex
CREATE INDEX "salidas_inventario_solicitud_origen_id_idx" ON "public"."salidas_inventario"("solicitud_origen_id");

-- AddForeignKey
ALTER TABLE "public"."rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."rbac_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_user_roles" ADD CONSTRAINT "rbac_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_user_roles" ADD CONSTRAINT "rbac_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_indicators" ADD CONSTRAINT "dashboard_indicators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" ADD CONSTRAINT "dashboard_indicator_permissions_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "public"."dashboard_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" ADD CONSTRAINT "dashboard_indicator_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" ADD CONSTRAINT "dashboard_indicator_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_indicator_permissions" ADD CONSTRAINT "dashboard_indicator_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_user_configs" ADD CONSTRAINT "dashboard_user_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dashboard_user_configs" ADD CONSTRAINT "dashboard_user_configs_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "public"."dashboard_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

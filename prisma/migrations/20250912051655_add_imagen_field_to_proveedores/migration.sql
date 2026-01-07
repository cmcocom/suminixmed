-- AlterTable
ALTER TABLE "public"."proveedores" ADD COLUMN     "imagen" VARCHAR(255),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "public"."Inventario_categoriaId_idx" RENAME TO "Inventario_categoria_id_idx";

-- RenameIndex
ALTER INDEX "public"."ActiveSession_lastActivity_idx" RENAME TO "active_sessions_lastActivity_idx";

-- RenameIndex
ALTER INDEX "public"."ActiveSession_userId_lastActivity_idx" RENAME TO "active_sessions_userId_lastActivity_idx";

-- RenameIndex
ALTER INDEX "public"."audit_log_table_record_idx" RENAME TO "audit_log_table_name_record_id_idx";

-- RenameIndex
ALTER INDEX "public"."Categoria_activo_idx" RENAME TO "categorias_activo_idx";

-- RenameIndex
ALTER INDEX "public"."Categoria_nombre_activo_idx" RENAME TO "categorias_nombre_activo_idx";

-- RenameIndex
ALTER INDEX "public"."Cliente_activo_idx" RENAME TO "clientes_activo_idx";

-- RenameIndex
ALTER INDEX "public"."Cliente_email_activo_idx" RENAME TO "clientes_email_activo_idx";

-- RenameIndex
ALTER INDEX "public"."Entidad_estatus_idx" RENAME TO "entidades_estatus_idx";

-- RenameIndex
ALTER INDEX "public"."FondoFijo_cantidad_disponible_idx" RENAME TO "ffijo_cantidad_disponible_idx";

-- RenameIndex
ALTER INDEX "public"."FondoFijo_cantidad_minima_idx" RENAME TO "ffijo_cantidad_minima_idx";

-- RenameIndex
ALTER INDEX "public"."FondoFijo_low_stock_idx" RENAME TO "ffijo_cantidad_disponible_cantidad_minima_idx";

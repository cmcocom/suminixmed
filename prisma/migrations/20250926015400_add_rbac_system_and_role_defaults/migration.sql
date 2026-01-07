-- AlterTable
ALTER TABLE "public"."Inventario" ADD COLUMN     "codigo_barras" VARCHAR(100),
ADD COLUMN     "numero_lote" VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."clientes" ADD COLUMN     "codigo_postal" VARCHAR(10);

-- AlterTable
ALTER TABLE "public"."proveedores" ADD COLUMN     "condiciones_pago" VARCHAR(100);

-- CreateTable
CREATE TABLE "public"."module_visibility" (
    "id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT,
    "role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_default_visibility" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_default_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_visibility_role_id_user_id_module_key_key" ON "public"."module_visibility"("role_id", "user_id", "module_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_default_visibility_role_id_module_key_key" ON "public"."role_default_visibility"("role_id", "module_key");

-- AddForeignKey
ALTER TABLE "public"."module_visibility" ADD CONSTRAINT "module_visibility_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_visibility" ADD CONSTRAINT "module_visibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_default_visibility" ADD CONSTRAINT "role_default_visibility_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

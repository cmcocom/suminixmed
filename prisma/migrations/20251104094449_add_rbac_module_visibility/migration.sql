/*
  Warnings:

  - You are about to drop the `module_visibility` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_default_visibility` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."module_visibility" DROP CONSTRAINT "module_visibility_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."module_visibility" DROP CONSTRAINT "module_visibility_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_default_visibility" DROP CONSTRAINT "role_default_visibility_role_id_fkey";

-- DropTable
DROP TABLE "public"."module_visibility";

-- DropTable
DROP TABLE "public"."role_default_visibility";

-- CreateTable
CREATE TABLE "rbac_module_visibility" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "module_key" VARCHAR(100) NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_module_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rbac_module_visibility_role_id_idx" ON "rbac_module_visibility"("role_id");

-- CreateIndex
CREATE INDEX "rbac_module_visibility_module_key_idx" ON "rbac_module_visibility"("module_key");

-- CreateIndex
CREATE INDEX "rbac_module_visibility_role_id_is_visible_idx" ON "rbac_module_visibility"("role_id", "is_visible");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_module_visibility_role_id_module_key_key" ON "rbac_module_visibility"("role_id", "module_key");

-- AddForeignKey
ALTER TABLE "rbac_module_visibility" ADD CONSTRAINT "rbac_module_visibility_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

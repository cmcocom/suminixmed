-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "is_system_user" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."rbac_roles" ADD COLUMN     "is_system_role" BOOLEAN NOT NULL DEFAULT false;

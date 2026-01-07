-- Migration: remove legacy user rol column and enum
-- Generated manually via prisma migrate diff

BEGIN;

ALTER TABLE "public"."User" DROP COLUMN "rol";
DROP TYPE "public"."TipoRol";

COMMIT;

-- CreateEnum
CREATE TYPE "public"."EstadoEntidad" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "public"."entidades" (
    "id_empresa" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "rfc" VARCHAR(20) NOT NULL,
    "logo" VARCHAR(255),
    "correo" VARCHAR(100),
    "telefono" VARCHAR(20),
    "contacto" VARCHAR(100),
    "licencia" VARCHAR(50),
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatus" "public"."EstadoEntidad" NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidades_pkey" PRIMARY KEY ("id_empresa")
);

-- CreateIndex
CREATE UNIQUE INDEX "entidades_rfc_key" ON "public"."entidades"("rfc");

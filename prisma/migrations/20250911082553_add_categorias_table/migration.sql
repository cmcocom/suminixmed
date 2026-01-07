-- AlterTable
ALTER TABLE "public"."Inventario" ADD COLUMN     "categoria_id" TEXT;

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "public"."categorias"("nombre");

-- AddForeignKey
ALTER TABLE "public"."Inventario" ADD CONSTRAINT "Inventario_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

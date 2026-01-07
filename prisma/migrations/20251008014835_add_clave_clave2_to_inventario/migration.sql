-- AlterTable
ALTER TABLE "Inventario" ADD COLUMN "clave" VARCHAR(50),
ADD COLUMN "clave2" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_clave_key" ON "Inventario"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_clave2_key" ON "Inventario"("clave2");

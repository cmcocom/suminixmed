/*
  Warnings:

  - You are about to drop the column `monto_asignado` on the `ffijo` table. All the data in the column will be lost.

*/
-- Agregar las nuevas columnas primero
ALTER TABLE "public"."ffijo" 
ADD COLUMN "cantidad_asignada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cantidad_minima" INTEGER NOT NULL DEFAULT 0;

-- Convertir monto_asignado a cantidad_asignada (asumiendo que 1000 pesos = 10 unidades)
UPDATE "public"."ffijo" 
SET 
  "cantidad_asignada" = CAST("monto_asignado" / 100 AS INTEGER),
  "cantidad_disponible" = CAST("monto_asignado" / 100 AS INTEGER),
  "cantidad_minima" = 5;

-- Ahora eliminar la columna antigua
ALTER TABLE "public"."ffijo" DROP COLUMN "monto_asignado";

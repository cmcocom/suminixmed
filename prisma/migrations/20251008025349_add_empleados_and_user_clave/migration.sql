-- AlterTable User: Agregar campos clave y telefono
ALTER TABLE "User" ADD COLUMN "clave" VARCHAR(50),
ADD COLUMN "telefono" VARCHAR(20);

-- Actualizar usuario existente con clave especial
UPDATE "User" SET "clave" = 'susr-888963' WHERE "email" = 'cmcocom@unidadc.com';

-- CreateTable empleados
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "numero_empleado" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cargo" VARCHAR(100) NOT NULL,
    "servicio" VARCHAR(100),
    "turno" VARCHAR(50) NOT NULL,
    "correo" VARCHAR(100),
    "celular" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clave_key" ON "User"("clave");

-- CreateIndex
CREATE INDEX "User_clave_idx" ON "User"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_user_id_key" ON "empleados"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_numero_empleado_key" ON "empleados"("numero_empleado");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_correo_key" ON "empleados"("correo");

-- CreateIndex
CREATE INDEX "empleados_numero_empleado_idx" ON "empleados"("numero_empleado");

-- CreateIndex
CREATE INDEX "empleados_servicio_activo_idx" ON "empleados"("servicio", "activo");

-- CreateIndex
CREATE INDEX "empleados_user_id_idx" ON "empleados"("user_id");

-- CreateIndex
CREATE INDEX "empleados_activo_idx" ON "empleados"("activo");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hacer clave obligatoria después de actualizar el usuario existente
ALTER TABLE "User" ALTER COLUMN "clave" SET NOT NULL;

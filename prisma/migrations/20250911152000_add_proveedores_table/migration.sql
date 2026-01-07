-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "razon_social" VARCHAR(200),
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(255),
    "rfc" VARCHAR(20),
    "contacto" VARCHAR(100),
    "sitio_web" VARCHAR(255),
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_email_key" ON "proveedores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_rfc_key" ON "proveedores"("rfc");

-- CreateIndex
CREATE INDEX "proveedores_activo_idx" ON "proveedores"("activo");

-- CreateIndex
CREATE INDEX "proveedores_email_activo_idx" ON "proveedores"("email", "activo");

-- CreateIndex
CREATE INDEX "proveedores_rfc_activo_idx" ON "proveedores"("rfc", "activo");

-- CreateIndex
CREATE INDEX "proveedores_nombre_activo_idx" ON "proveedores"("nombre", "activo");

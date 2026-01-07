-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(255),
    "rfc" VARCHAR(20),
    "empresa" VARCHAR(150),
    "contacto" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "public"."clientes"("email");

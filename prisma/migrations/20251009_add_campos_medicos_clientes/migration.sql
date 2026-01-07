-- Migration: Agregar campos médicos a tabla clientes
-- Fecha: 2025-10-09
-- Descripción: Agrega campos clave, medico_tratante, especialidad y localidad

-- Agregar campo clave (código único del cliente)
ALTER TABLE "clientes" 
ADD COLUMN "clave" VARCHAR(50);

-- Agregar campo medico_tratante
ALTER TABLE "clientes" 
ADD COLUMN "medico_tratante" VARCHAR(200);

-- Agregar campo especialidad
ALTER TABLE "clientes" 
ADD COLUMN "especialidad" VARCHAR(150);

-- Agregar campo localidad (ciudad/municipio)
ALTER TABLE "clientes" 
ADD COLUMN "localidad" VARCHAR(150);

-- Agregar campo estado/provincia (opcional pero útil)
ALTER TABLE "clientes" 
ADD COLUMN "estado" VARCHAR(100);

-- Agregar campo país (opcional pero útil)
ALTER TABLE "clientes" 
ADD COLUMN "pais" VARCHAR(100) DEFAULT 'México';

-- Crear índices para optimizar búsquedas
CREATE INDEX "idx_clientes_clave" ON "clientes"("clave");
CREATE INDEX "idx_clientes_medico_tratante" ON "clientes"("medico_tratante");
CREATE INDEX "idx_clientes_especialidad" ON "clientes"("especialidad");
CREATE INDEX "idx_clientes_localidad" ON "clientes"("localidad");
CREATE INDEX "idx_clientes_localidad_estado" ON "clientes"("localidad", "estado");

-- Comentarios para documentación
COMMENT ON COLUMN "clientes"."clave" IS 'Código o clave única del cliente/paciente';
COMMENT ON COLUMN "clientes"."medico_tratante" IS 'Nombre del médico tratante del paciente';
COMMENT ON COLUMN "clientes"."especialidad" IS 'Especialidad médica del paciente o del médico tratante';
COMMENT ON COLUMN "clientes"."localidad" IS 'Ciudad, localidad o municipio del cliente';
COMMENT ON COLUMN "clientes"."estado" IS 'Estado o provincia del cliente';
COMMENT ON COLUMN "clientes"."pais" IS 'País del cliente';

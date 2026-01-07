-- Migración para mejorar la tabla de auditoría
-- Agregar campos adicionales para un mejor seguimiento

-- Agregar nuevas columnas a la tabla audit_log
ALTER TABLE "public"."audit_log" 
ADD COLUMN IF NOT EXISTS "user_id" TEXT,
ADD COLUMN IF NOT EXISTS "user_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ip_address" INET,
ADD COLUMN IF NOT EXISTS "user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "level" VARCHAR(20) DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Crear índices adicionales para mejor rendimiento
CREATE INDEX IF NOT EXISTS "audit_log_user_id_idx" ON "public"."audit_log"("user_id");
CREATE INDEX IF NOT EXISTS "audit_log_level_idx" ON "public"."audit_log"("level");
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "public"."audit_log"("action");
CREATE INDEX IF NOT EXISTS "audit_log_user_date_idx" ON "public"."audit_log"("user_id", "changed_at");
CREATE INDEX IF NOT EXISTS "audit_log_table_action_idx" ON "public"."audit_log"("table_name", "action");

-- Agregar foreign key a User si el campo user_id apunta a un usuario válido
-- (Solo si la referencia es válida, no forzamos constraint por flexibilidad)

-- Comentarios para documentación
COMMENT ON COLUMN "public"."audit_log"."user_id" IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN "public"."audit_log"."user_name" IS 'Nombre del usuario al momento de la acción';
COMMENT ON COLUMN "public"."audit_log"."ip_address" IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN "public"."audit_log"."user_agent" IS 'User agent del navegador';
COMMENT ON COLUMN "public"."audit_log"."level" IS 'Nivel de criticidad: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN "public"."audit_log"."description" IS 'Descripción legible de la acción realizada';
COMMENT ON COLUMN "public"."audit_log"."metadata" IS 'Metadatos adicionales en formato JSON';
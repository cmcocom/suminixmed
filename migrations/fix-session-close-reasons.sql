-- Migración: Sincronizar tabla session_close_reasons con schema.prisma
-- Fecha: 2026-01-07
-- Descripción: Añadir columnas faltantes sin perder datos existentes

-- 1. Añadir columnas faltantes
ALTER TABLE session_close_reasons 
  ADD COLUMN IF NOT EXISTS tab_id VARCHAR(50);

ALTER TABLE session_close_reasons 
  ADD COLUMN IF NOT EXISTS sub_reason VARCHAR(100);

ALTER TABLE session_close_reasons 
  ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);

ALTER TABLE session_close_reasons 
  ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN DEFAULT false;

ALTER TABLE session_close_reasons 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Renombrar created_at a timestamp (si existe created_at y no existe timestamp)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_close_reasons' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_close_reasons' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE session_close_reasons RENAME COLUMN created_at TO timestamp;
  END IF;
END $$;

-- 3. Ajustar tipo de ip_address de inet a varchar(45) si es necesario
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_close_reasons' 
    AND column_name = 'ip_address' 
    AND data_type = 'inet'
  ) THEN
    ALTER TABLE session_close_reasons 
      ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::VARCHAR(45);
  END IF;
END $$;

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_session_close_reasons_user_timestamp 
  ON session_close_reasons(user_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_session_close_reasons_reason_timestamp 
  ON session_close_reasons(reason, timestamp);

CREATE INDEX IF NOT EXISTS idx_session_close_reasons_fingerprint 
  ON session_close_reasons(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_session_close_reasons_false_positive 
  ON session_close_reasons(is_false_positive);

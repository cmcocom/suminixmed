-- Tabla para configuración de respaldos automáticos
CREATE TABLE IF NOT EXISTS backup_config (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT false,
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    day_of_week INTEGER, -- 0-6 (Domingo-Sábado) para respaldos semanales
    day_of_month INTEGER, -- 1-31 para respaldos mensuales
    hour INTEGER NOT NULL DEFAULT 2, -- 0-23
    minute INTEGER NOT NULL DEFAULT 0, -- 0-59
    retention_days INTEGER NOT NULL DEFAULT 30, -- Días de retención de respaldos
    retention_count INTEGER, -- Número máximo de respaldos a mantener (opcional)
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto si no existe
INSERT INTO backup_config (id, enabled, frequency, hour, minute, retention_days)
VALUES (1, false, 'daily', 2, 0, 30)
ON CONFLICT (id) DO NOTHING;

-- Tabla para historial de respaldos automáticos
CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'automatic', -- 'automatic' o 'manual'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed'
    size_bytes BIGINT,
    tables_count INTEGER,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_by VARCHAR(255),
    description TEXT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON backup_history(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_started ON backup_history(started_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_backup_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_backup_config_updated_at ON backup_config;
CREATE TRIGGER trigger_update_backup_config_updated_at
    BEFORE UPDATE ON backup_config
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_config_updated_at();

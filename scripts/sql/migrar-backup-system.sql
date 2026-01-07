-- ============================================================
-- MIGRACIÓN: Sistema de Respaldos Automáticos
-- ============================================================
-- Fecha: 22 octubre 2025
-- Descripción: Actualiza tablas backup_config y backup_history
--              para soportar configuración de respaldos automáticos
-- ============================================================

-- Verificar y crear tabla backup_config si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_config') THEN
        CREATE TABLE "backup_config" (
            "id" SERIAL NOT NULL,
            "enabled" BOOLEAN NOT NULL DEFAULT false,
            "frequency" VARCHAR(20) NOT NULL DEFAULT 'daily',
            "dayOfWeek" INTEGER,
            "dayOfMonth" INTEGER,
            "hour" INTEGER NOT NULL DEFAULT 3,
            "minute" INTEGER NOT NULL DEFAULT 0,
            "retentionDays" INTEGER NOT NULL DEFAULT 30,
            "retentionCount" INTEGER,
            "lastRun" TIMESTAMP(3),
            "nextRun" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "backup_config_pkey" PRIMARY KEY ("id")
        );
        
        -- Insertar configuración por defecto
        INSERT INTO "backup_config" 
          ("enabled", "frequency", "hour", "minute", "retentionDays", "updatedAt")
        VALUES 
          (false, 'daily', 3, 0, 30, CURRENT_TIMESTAMP);
          
        RAISE NOTICE 'Tabla backup_config creada';
    ELSE
        RAISE NOTICE 'Tabla backup_config ya existe, verificando columnas...';
        
        -- Agregar columnas faltantes si no existen
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_config' AND column_name = 'dayOfWeek') THEN
            ALTER TABLE backup_config ADD COLUMN "dayOfWeek" INTEGER;
            RAISE NOTICE 'Columna dayOfWeek agregada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_config' AND column_name = 'dayOfMonth') THEN
            ALTER TABLE backup_config ADD COLUMN "dayOfMonth" INTEGER;
            RAISE NOTICE 'Columna dayOfMonth agregada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_config' AND column_name = 'retentionDays') THEN
            ALTER TABLE backup_config ADD COLUMN "retentionDays" INTEGER NOT NULL DEFAULT 30;
            RAISE NOTICE 'Columna retentionDays agregada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_config' AND column_name = 'retentionCount') THEN
            ALTER TABLE backup_config ADD COLUMN "retentionCount" INTEGER;
            RAISE NOTICE 'Columna retentionCount agregada';
        END IF;
    END IF;
END $$;

-- Verificar y crear tabla backup_history si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_history') THEN
        CREATE TABLE "backup_history" (
            "id" SERIAL NOT NULL,
            "filename" VARCHAR(255) NOT NULL,
            "backupType" VARCHAR(20) NOT NULL,
            "status" VARCHAR(20) NOT NULL,
            "sizeBytes" BIGINT,
            "tablesCount" INTEGER,
            "errorMessage" TEXT,
            "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "completedAt" TIMESTAMP(3),
            "durationSeconds" INTEGER,
            "createdBy" VARCHAR(100),
            "description" VARCHAR(255),
            CONSTRAINT "backup_history_pkey" PRIMARY KEY ("id")
        );
        
        -- Crear índices
        CREATE INDEX "backup_history_backupType_idx" ON "backup_history"("backupType");
        CREATE INDEX "backup_history_status_idx" ON "backup_history"("status");
        CREATE INDEX "backup_history_startedAt_idx" ON "backup_history"("startedAt");
        
        RAISE NOTICE 'Tabla backup_history creada';
    ELSE
        RAISE NOTICE 'Tabla backup_history ya existe, verificando columnas...';
        
        -- Agregar columnas faltantes si no existen
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_history' AND column_name = 'backupType') THEN
            ALTER TABLE backup_history ADD COLUMN "backupType" VARCHAR(20) NOT NULL DEFAULT 'manual';
            RAISE NOTICE 'Columna backupType agregada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backup_history' AND column_name = 'startedAt') THEN
            ALTER TABLE backup_history ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Columna startedAt agregada';
        END IF;
        
        -- Crear índices si no existen
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'backup_history' AND indexname = 'backup_history_backupType_idx') THEN
            CREATE INDEX "backup_history_backupType_idx" ON "backup_history"("backupType");
            RAISE NOTICE 'Índice backup_history_backupType_idx creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'backup_history' AND indexname = 'backup_history_status_idx') THEN
            CREATE INDEX "backup_history_status_idx" ON "backup_history"("status");
            RAISE NOTICE 'Índice backup_history_status_idx creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'backup_history' AND indexname = 'backup_history_startedAt_idx') THEN
            CREATE INDEX "backup_history_startedAt_idx" ON "backup_history"("startedAt");
            RAISE NOTICE 'Índice backup_history_startedAt_idx creado';
        END IF;
    END IF;
END $$;

-- Agregar comentarios
COMMENT ON TABLE "backup_config" IS 'Configuración de respaldos automáticos programados';
COMMENT ON TABLE "backup_history" IS 'Historial de ejecución de respaldos automáticos y manuales';

SELECT '✅ Migración completada correctamente' as resultado;

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE INDEX "backup_history_backupType_idx" ON "backup_history"("backupType");

-- CreateIndex
CREATE INDEX "backup_history_status_idx" ON "backup_history"("status");

-- CreateIndex
CREATE INDEX "backup_history_startedAt_idx" ON "backup_history"("startedAt");

-- Insertar configuración por defecto
INSERT INTO "backup_config" 
  ("enabled", "frequency", "hour", "minute", "retentionDays", "updatedAt")
VALUES 
  (false, 'daily', 3, 0, 30, CURRENT_TIMESTAMP);

-- Comentarios
COMMENT ON TABLE "backup_config" IS 'Configuración de respaldos automáticos programados';
COMMENT ON TABLE "backup_history" IS 'Historial de ejecución de respaldos automáticos y manuales';
COMMENT ON COLUMN "backup_config"."frequency" IS 'Frecuencia: daily, weekly, monthly';
COMMENT ON COLUMN "backup_config"."dayOfWeek" IS 'Día de la semana (0-6) para respaldos semanales';
COMMENT ON COLUMN "backup_config"."dayOfMonth" IS 'Día del mes (1-31) para respaldos mensuales';
COMMENT ON COLUMN "backup_history"."backupType" IS 'Tipo: automatic o manual';
COMMENT ON COLUMN "backup_history"."status" IS 'Estado: success o failed';

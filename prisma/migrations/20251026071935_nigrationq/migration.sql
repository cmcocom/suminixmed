-- AlterTable
ALTER TABLE "backup_config" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "backup_history" ALTER COLUMN "backup_type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "dashboard_user_configs" ALTER COLUMN "config" DROP DEFAULT;

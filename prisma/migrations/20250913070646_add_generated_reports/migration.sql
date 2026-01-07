-- CreateTable
CREATE TABLE "public"."generated_reports" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "slug" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tables" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "filters" JSONB NOT NULL,
    "allowed_roles" TEXT[],
    "created_by" TEXT NOT NULL,
    "show_filters" BOOLEAN NOT NULL DEFAULT true,
    "show_export" BOOLEAN NOT NULL DEFAULT true,
    "page_size" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_reports_slug_key" ON "public"."generated_reports"("slug");

-- CreateIndex
CREATE INDEX "generated_reports_is_active_idx" ON "public"."generated_reports"("is_active");

-- CreateIndex
CREATE INDEX "generated_reports_slug_idx" ON "public"."generated_reports"("slug");

-- AddForeignKey
ALTER TABLE "public"."generated_reports" ADD CONSTRAINT "generated_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

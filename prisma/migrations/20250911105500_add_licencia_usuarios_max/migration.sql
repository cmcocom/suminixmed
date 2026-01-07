-- Add the new licencia_usuarios_max column
ALTER TABLE "entidades" ADD COLUMN "licencia_usuarios_max" INTEGER NOT NULL DEFAULT 5;

-- Migrate existing licencia values to licencia_usuarios_max
UPDATE "entidades" 
SET "licencia_usuarios_max" = 
  CASE 
    WHEN "licencia" ~ '^[0-9]+$' AND CAST("licencia" AS INTEGER) > 0 
    THEN CAST("licencia" AS INTEGER)
    ELSE 5
  END;

-- Now we can drop the old licencia column
ALTER TABLE "entidades" DROP COLUMN "licencia";

-- CreateTable: tipos_entrada
CREATE TABLE IF NOT EXISTS "tipos_entrada" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "color" VARCHAR(20) DEFAULT 'blue',
    "icono" VARCHAR(50) DEFAULT 'document',
    "requiere_proveedor" BOOLEAN DEFAULT false,
    "requiere_referencia" BOOLEAN DEFAULT false,
    "activo" BOOLEAN DEFAULT true,
    "orden" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tipos_salida
CREATE TABLE IF NOT EXISTS "tipos_salida" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "color" VARCHAR(20) DEFAULT 'blue',
    "icono" VARCHAR(50) DEFAULT 'document',
    "requiere_destino" BOOLEAN DEFAULT false,
    "requiere_referencia" BOOLEAN DEFAULT false,
    "requiere_cliente" BOOLEAN DEFAULT false,
    "activo" BOOLEAN DEFAULT true,
    "orden" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_salida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_entrada_codigo_key" ON "tipos_entrada"("codigo");
CREATE INDEX "tipos_entrada_activo_idx" ON "tipos_entrada"("activo");
CREATE INDEX "tipos_entrada_orden_idx" ON "tipos_entrada"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_salida_codigo_key" ON "tipos_salida"("codigo");
CREATE INDEX "tipos_salida_activo_idx" ON "tipos_salida"("activo");
CREATE INDEX "tipos_salida_orden_idx" ON "tipos_salida"("orden");

-- Modificar tabla entradas_inventario para usar el nuevo tipo
ALTER TABLE "entradas_inventario" ADD COLUMN IF NOT EXISTS "tipo_entrada_id" TEXT;
ALTER TABLE "entradas_inventario" ADD CONSTRAINT "fk_tipo_entrada" 
    FOREIGN KEY ("tipo_entrada_id") REFERENCES "tipos_entrada"("id") ON DELETE SET NULL;

-- Modificar tabla salidas_inventario para usar el nuevo tipo  
ALTER TABLE "salidas_inventario" ADD COLUMN IF NOT EXISTS "tipo_salida_id" TEXT;
ALTER TABLE "salidas_inventario" ADD CONSTRAINT "fk_tipo_salida"
    FOREIGN KEY ("tipo_salida_id") REFERENCES "tipos_salida"("id") ON DELETE SET NULL;

-- Insertar tipos de entrada predefinidos
INSERT INTO "tipos_entrada" ("id", "codigo", "nombre", "descripcion", "color", "icono", "requiere_proveedor", "requiere_referencia", "orden", "activo")
VALUES 
    ('tipo_entrada_transferencia', 'TRANSFERENCIA', 'Transferencia', 'Transferencia entre almacenes o ubicaciones', 'blue', 'arrow-path', false, true, 1, true),
    ('tipo_entrada_compra', 'COMPRA_PROVEEDOR', 'Compra proveedor', 'Compra de productos a proveedor', 'green', 'shopping-cart', true, true, 2, true),
    ('tipo_entrada_donacion', 'DONACION', 'Donación', 'Donación recibida', 'purple', 'gift', false, false, 3, true),
    ('tipo_entrada_ajuste', 'AJUSTE', 'Ajuste', 'Ajuste de inventario (corrección)', 'orange', 'adjustments-horizontal', false, false, 4, true)
ON CONFLICT ("codigo") DO NOTHING;

-- Insertar tipos de salida predefinidos
INSERT INTO "tipos_salida" ("id", "codigo", "nombre", "descripcion", "color", "icono", "requiere_destino", "requiere_referencia", "orden", "activo")
VALUES 
    ('tipo_salida_servicios', 'SERVICIOS_MEDICOS', 'Servicios médicos', 'Salida para servicios médicos prestados', 'blue', 'heart', true, true, 1, true),
    ('tipo_salida_ajuste', 'AJUSTE', 'Ajuste', 'Ajuste de inventario (corrección)', 'orange', 'adjustments-horizontal', false, false, 2, true)
ON CONFLICT ("codigo") DO NOTHING;

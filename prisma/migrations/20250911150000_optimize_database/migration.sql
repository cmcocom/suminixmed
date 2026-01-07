-- Optimización de la base de datos
-- Agregar índices para mejorar el rendimiento

-- Índices para la tabla User
CREATE INDEX IF NOT EXISTS "User_activo_idx" ON "public"."User"("activo");
CREATE INDEX IF NOT EXISTS "User_email_activo_idx" ON "public"."User"("email", "activo");

-- Índices para la tabla Inventario
CREATE INDEX IF NOT EXISTS "Inventario_categoria_idx" ON "public"."Inventario"("categoria");
CREATE INDEX IF NOT EXISTS "Inventario_cantidad_idx" ON "public"."Inventario"("cantidad");
CREATE INDEX IF NOT EXISTS "Inventario_fechaVencimiento_idx" ON "public"."Inventario"("fechaVencimiento");
CREATE INDEX IF NOT EXISTS "Inventario_estado_idx" ON "public"."Inventario"("estado");
CREATE INDEX IF NOT EXISTS "Inventario_categoriaId_idx" ON "public"."Inventario"("categoria_id");

-- Índices para la tabla ActiveSession
CREATE INDEX IF NOT EXISTS "ActiveSession_lastActivity_idx" ON "public"."active_sessions"("lastActivity");
CREATE INDEX IF NOT EXISTS "ActiveSession_userId_lastActivity_idx" ON "public"."active_sessions"("userId", "lastActivity");

-- Índices para la tabla Categoria
CREATE INDEX IF NOT EXISTS "Categoria_activo_idx" ON "public"."categorias"("activo");
CREATE INDEX IF NOT EXISTS "Categoria_nombre_activo_idx" ON "public"."categorias"("nombre", "activo");

-- Índices para la tabla Cliente
CREATE INDEX IF NOT EXISTS "Cliente_activo_idx" ON "public"."clientes"("activo");
CREATE INDEX IF NOT EXISTS "Cliente_email_activo_idx" ON "public"."clientes"("email", "activo");

-- Índices para la tabla FondoFijo
CREATE INDEX IF NOT EXISTS "FondoFijo_cantidad_disponible_idx" ON "public"."ffijo"("cantidad_disponible");
CREATE INDEX IF NOT EXISTS "FondoFijo_cantidad_minima_idx" ON "public"."ffijo"("cantidad_minima");
CREATE INDEX IF NOT EXISTS "FondoFijo_low_stock_idx" ON "public"."ffijo"("cantidad_disponible", "cantidad_minima");

-- Índices para la tabla Entidad
CREATE INDEX IF NOT EXISTS "Entidad_estatus_idx" ON "public"."entidades"("estatus");

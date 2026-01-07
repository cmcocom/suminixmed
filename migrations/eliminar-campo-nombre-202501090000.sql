-- ===============================================================
-- MIGRACIÓN: Eliminar campo 'nombre' y usar solo 'descripcion'
-- Fecha: 2025-01-09
-- Descripción: Elimina la columna 'nombre' de la tabla Inventario
--              ya que tiene el mismo contenido que 'descripcion'
-- ===============================================================

BEGIN;

-- PASO 1: Hacer que descripcion sea NOT NULL (ya tiene todos los datos)
ALTER TABLE "Inventario" 
ALTER COLUMN "descripcion" SET NOT NULL;

-- PASO 2: Eliminar la columna 'nombre'
ALTER TABLE "Inventario" 
DROP COLUMN "nombre";

COMMIT;

-- NOTA: Todos los productos tienen nombre === descripcion verificado el 2025-01-09
-- La columna descripcion ya contiene toda la información necesaria

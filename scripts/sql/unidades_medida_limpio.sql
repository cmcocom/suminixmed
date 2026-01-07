-- EXPORTACIÓN DE UNIDADES DE MEDIDA LIMPIO
-- Fecha: 2025-11-04T13:16:06.132Z
-- Total: 8 registros

-- Limpiar tabla existente
TRUNCATE TABLE "unidades_medida" RESTART IDENTITY CASCADE;

-- Insertar unidades de medida (con fechas ISO)
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('fa71d19c-cbac-4c9f-9f98-50b1dbf5fd66', 'caja', 'Caja', 'Caja - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('6ff65602-c62e-45ed-b767-1b25475f4f2a', 'gramo', 'Gramo', 'Gramo - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('cf90def1-0db4-468d-ac89-b8d84a252233', 'kilogramo', 'Kilogramo', 'Kilogramo - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('6f70b7b4-899b-4852-8b8e-e7ee1043640c', 'litro', 'Litro', 'Litro - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('4d5ac926-f407-46a6-86ee-862ec7160cc6', 'metro', 'Metro', 'Metro - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('5da3e3a9-49e1-4062-a61e-0d188b0431cf', 'mililitro', 'Mililitro', 'Mililitro - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('a466e514-1efe-4b1d-8ee5-5290bc8fe19e', 'paquete', 'Paquete', 'Paquete - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');
INSERT INTO "unidades_medida" (id, clave, nombre, descripcion, activo, "createdAt", "updatedAt") VALUES ('ad70acb1-0ef8-4167-b8d2-afd7bdc4ded3', 'pieza', 'Pieza', 'Pieza - Unidad de medida', true, '2025-11-04T13:16:06.133Z', '2025-11-04T13:16:06.133Z');

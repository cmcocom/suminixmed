-- Migración de las tablas principales de datos
-- Inventario y transacciones
TRUNCATE TABLE public."Inventario" CASCADE;
INSERT INTO public."Inventario" SELECT * FROM temp_prod."Inventario";

TRUNCATE TABLE public.entradas_inventario CASCADE;
INSERT INTO public.entradas_inventario SELECT * FROM temp_prod.entradas_inventario;

TRUNCATE TABLE public.salidas_inventario CASCADE;
INSERT INTO public.salidas_inventario SELECT * FROM temp_prod.salidas_inventario;

-- Catálogos principales
TRUNCATE TABLE public.clientes CASCADE;
INSERT INTO public.clientes SELECT * FROM temp_prod.clientes;

TRUNCATE TABLE public.proveedores CASCADE;
INSERT INTO public.proveedores SELECT * FROM temp_prod.proveedores;

TRUNCATE TABLE public.categorias CASCADE;
INSERT INTO public.categorias SELECT * FROM temp_prod.categorias;

TRUNCATE TABLE public.empleados CASCADE;
INSERT INTO public.empleados SELECT * FROM temp_prod.empleados;
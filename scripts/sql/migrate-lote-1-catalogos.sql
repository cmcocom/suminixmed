-- Migración Lote 1: Catálogos base (sin dependencias)
TRUNCATE TABLE public.categorias CASCADE;
INSERT INTO public.categorias 
SELECT * FROM dblink('host=localhost dbname=suminix_temp_prod user=postgres password=notaR.psql port=5432', 
                     'SELECT * FROM categorias') 
AS t(id character varying, nombre character varying, descripcion text, activo boolean, created_at timestamp with time zone, updated_at timestamp with time zone, entidad_id character varying);

TRUNCATE TABLE public.proveedores CASCADE;  
INSERT INTO public.proveedores
SELECT * FROM dblink('host=localhost dbname=suminix_temp_prod user=postgres password=notaR.psql port=5432',
                     'SELECT * FROM proveedores')
AS t(id character varying, clave character varying, nombre character varying, contacto character varying, telefono character varying, email character varying, direccion text, activo boolean, created_at timestamp with time zone, updated_at timestamp with time zone, entidad_id character varying);

TRUNCATE TABLE public.empleados CASCADE;
INSERT INTO public.empleados  
SELECT * FROM dblink('host=localhost dbname=suminix_temp_prod user=postgres password=notaR.psql port=5432',
                     'SELECT * FROM empleados')
AS t(id character varying, clave character varying, nombre character varying, apellidos character varying, telefono character varying, email character varying, activo boolean, created_at timestamp with time zone, updated_at timestamp with time zone, entidad_id character varying);
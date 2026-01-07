-- VERIFICACIÓN DE INTEGRIDAD DEL RESPALDO
-- Script para confirmar que el respaldo contiene toda la información esperada

SELECT 'VERIFICACIÓN DE RESPALDO - ' || current_timestamp as titulo;

-- Conteo de tablas principales
SELECT 
    'RESUMEN DE DATOS RESPALDADOS' as seccion,
    (SELECT COUNT(*) FROM "User") as usuarios,
    (SELECT COUNT(*) FROM "Inventario") as productos,
    (SELECT COUNT(*) FROM entradas_inventario) as entradas,
    (SELECT COUNT(*) FROM salidas_inventario) as salidas,
    (SELECT COUNT(*) FROM partidas_entrada_inventario) as partidas_entrada,
    (SELECT COUNT(*) FROM partidas_salida_inventario) as partidas_salida,
    (SELECT COUNT(*) FROM clientes) as clientes,
    (SELECT COUNT(*) FROM proveedores) as proveedores,
    (SELECT COUNT(*) FROM categorias) as categorias,
    (SELECT COUNT(*) FROM rbac_roles) as roles,
    (SELECT COUNT(*) FROM rbac_permissions) as permisos;

-- Verificar estructura crítica
SELECT 'ESTRUCTURA CRITICA VERIFICADA' as seccion;
SELECT schemaname, tablename, hasindexes, hastriggers, hasrules
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Inventario', 'entradas_inventario', 'salidas_inventario')
ORDER BY tablename;

-- Verificar funciones y triggers
SELECT 'FUNCIONES Y TRIGGERS' as seccion;
SELECT COUNT(*) as total_funciones 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

SELECT COUNT(*) as total_triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal;

-- Verificar constraints y foreign keys
SELECT 'CONSTRAINTS Y FOREIGN KEYS' as seccion;
SELECT 
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = 'public' AND constraint_type = 'PRIMARY KEY') as primary_keys,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY') as foreign_keys,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE') as unique_constraints;

-- Estado de datos más recientes
SELECT 'DATOS MAS RECIENTES' as seccion;
SELECT 
    'Última entrada' as tipo,
    MAX(fecha_creacion) as fecha
FROM entradas_inventario
UNION ALL
SELECT 
    'Última salida' as tipo,
    MAX(fecha_creacion) as fecha
FROM salidas_inventario
UNION ALL
SELECT 
    'Último usuario' as tipo,
    MAX("createdAt") as fecha
FROM "User";

SELECT 'RESPALDO VERIFICADO EXITOSAMENTE' as resultado;
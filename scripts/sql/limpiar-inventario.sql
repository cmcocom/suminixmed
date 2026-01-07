-- Limpiar tabla inventario y restaurar solo esa tabla
SET session_replication_role = replica;
DELETE FROM "Inventario";
SET session_replication_role = DEFAULT;
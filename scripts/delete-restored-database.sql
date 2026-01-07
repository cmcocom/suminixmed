-- Script para eliminar la base de datos restored_suminix_20251027_backup
-- EJECUTAR SOLO DESPUÉS DE VERIFICAR QUE TODO FUNCIONA CORRECTAMENTE

-- 1. Conectarse a PostgreSQL como superusuario
-- psql -h localhost -p 5432 -U postgres

-- 2. Verificar que no hay conexiones activas a la BD restored
SELECT pid, usename, application_name, client_addr 
FROM pg_stat_activity 
WHERE datname = 'restored_suminix_20251027_backup';

-- 3. Terminar conexiones activas si las hay (OPCIONAL)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE datname = 'restored_suminix_20251027_backup' AND pid <> pg_backend_pid();

-- 4. Eliminar la base de datos
DROP DATABASE IF EXISTS "restored_suminix_20251027_backup";

-- 5. Verificar que se eliminó
\l

-- RESULTADO ESPERADO: La BD restored ya no debe aparecer en la lista
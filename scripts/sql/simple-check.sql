-- Script simple para verificar usuario admin
SELECT 'Usuario admin:' as info;
SELECT id, name, email, rol, activo FROM "User" WHERE email = 'admin@unidadc.com';

SELECT 'Todos los usuarios activos:' as info;
SELECT id, name, email, rol, activo FROM "User" WHERE activo = true ORDER BY email;

SELECT 'Sesiones activas:' as info;
SELECT "userId", "tabId", "lastActivity" FROM active_sessions ORDER BY "lastActivity" DESC;

SELECT 'Estadísticas de licencia:' as info;
SELECT * FROM get_license_stats();
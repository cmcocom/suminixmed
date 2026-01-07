@echo off
REM Script para migrar inventarios, entradas y salidas desde backup
REM Archivo: restore-inventarios-simple.bat

echo ========================================
echo 🔄 MIGRACIÓN DE INVENTARIOS Y MOVIMIENTOS  
echo ========================================
echo 📁 Backup origen: backups\suminix-2025-11-04T06-38-51-426Z.backup
echo 🎯 Base de datos: suminix
echo.

REM Variables
set BACKUP_FILE=backups\suminix-2025-11-04T06-38-51-426Z.backup
set DB_NAME=suminix
set DB_HOST=localhost
set DB_USER=postgres

REM 1. CREAR BACKUP DE SEGURIDAD
echo 📦 1. Creando backup de seguridad de tablas actuales...
for /f "delims=" %%i in ('powershell -command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set TIMESTAMP=%%i
set BACKUP_CURRENT=backup_antes_migracion_inventarios_%TIMESTAMP%.backup

pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -Fc --table=inventario --table=entradas_inventario --table=partidas_entrada_inventario --table=salidas_inventario --table=partidas_salida_inventario --table=categorias --table=clientes --table=proveedores --table=almacenes --table=tipos_entrada --table=tipos_salida --table=unidades_medida -f %BACKUP_CURRENT%

if %ERRORLEVEL% neq 0 (
    echo ❌ Error creando backup de seguridad
    pause
    exit /b 1
)

echo ✅ Backup de seguridad creado: %BACKUP_CURRENT%

REM 2. PREPARAR BASE DE DATOS Y LIMPIAR TABLAS
echo 🧹 2. Limpiando tablas existentes...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "BEGIN; SET session_replication_role = replica; TRUNCATE TABLE partidas_salida_inventario CASCADE; TRUNCATE TABLE partidas_entrada_inventario CASCADE; TRUNCATE TABLE salidas_inventario CASCADE; TRUNCATE TABLE entradas_inventario CASCADE; TRUNCATE TABLE inventario CASCADE; TRUNCATE TABLE clientes CASCADE; TRUNCATE TABLE proveedores CASCADE; TRUNCATE TABLE tipos_salida CASCADE; TRUNCATE TABLE tipos_entrada CASCADE; TRUNCATE TABLE almacenes CASCADE; TRUNCATE TABLE categorias CASCADE; TRUNCATE TABLE unidades_medida CASCADE;"

if %ERRORLEVEL% neq 0 (
    echo ❌ Error limpiando tablas
    pause
    exit /b 1
)

REM 3. RESTAURAR CADA TABLA EN ORDEN DE DEPENDENCIAS
echo 📥 3. Restaurando tablas desde backup...

echo    Restaurando tabla: unidades_medida
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=unidades_medida --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: categorias  
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=categorias --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: almacenes
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=almacenes --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: tipos_entrada
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=tipos_entrada --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: tipos_salida
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=tipos_salida --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: proveedores
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=proveedores --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: clientes
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=clientes --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: inventario
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=inventario --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: entradas_inventario
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=entradas_inventario --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: partidas_entrada_inventario
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=partidas_entrada_inventario --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: salidas_inventario
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=salidas_inventario --data-only --disable-triggers %BACKUP_FILE%

echo    Restaurando tabla: partidas_salida_inventario
pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% --table=partidas_salida_inventario --data-only --disable-triggers %BACKUP_FILE%

REM 4. FINALIZAR TRANSACCIÓN
echo 🔓 4. Finalizando transacción...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "SET session_replication_role = DEFAULT; COMMIT;"

REM 5. VERIFICAR INTEGRIDAD
echo ✅ 5. Verificando integridad de datos...
echo 📊 Conteo de registros restaurados:
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "SELECT 'inventario' as tabla, COUNT(*) as registros FROM inventario UNION ALL SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario UNION ALL SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario UNION ALL SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario UNION ALL SELECT 'partidas_salida_inventario', COUNT(*) FROM partidas_salida_inventario UNION ALL SELECT 'categorias', COUNT(*) FROM categorias UNION ALL SELECT 'clientes', COUNT(*) FROM clientes UNION ALL SELECT 'proveedores', COUNT(*) FROM proveedores UNION ALL SELECT 'almacenes', COUNT(*) FROM almacenes UNION ALL SELECT 'tipos_entrada', COUNT(*) FROM tipos_entrada UNION ALL SELECT 'tipos_salida', COUNT(*) FROM tipos_salida UNION ALL SELECT 'unidades_medida', COUNT(*) FROM unidades_medida;"

REM 6. VERIFICAR RELACIONES FK
echo 🔗 6. Verificando integridad referencial...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "SELECT 'inventario_categoria' as verificacion, COUNT(*) as problemas FROM inventario i LEFT JOIN categorias c ON i.categoria_id = c.id WHERE i.categoria_id IS NOT NULL AND c.id IS NULL UNION ALL SELECT 'entradas_proveedor', COUNT(*) FROM entradas_inventario e LEFT JOIN proveedores p ON e.proveedor_id = p.id WHERE e.proveedor_id IS NOT NULL AND p.id IS NULL UNION ALL SELECT 'salidas_cliente', COUNT(*) FROM salidas_inventario s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.cliente_id IS NOT NULL AND c.id IS NULL;"

REM 7. REGENERAR ESTADÍSTICAS
echo 📈 7. Regenerando estadísticas de PostgreSQL...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "ANALYZE inventario; ANALYZE entradas_inventario; ANALYZE partidas_entrada_inventario; ANALYZE salidas_inventario; ANALYZE partidas_salida_inventario; ANALYZE categorias; ANALYZE clientes; ANALYZE proveedores; ANALYZE almacenes; ANALYZE tipos_entrada; ANALYZE tipos_salida; ANALYZE unidades_medida;"

echo.
echo ========================================
echo ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
echo ========================================
echo 📋 Resumen:
echo    • Backup de seguridad: %BACKUP_CURRENT%
echo    • Origen: %BACKUP_FILE%
echo    • Tablas migradas: 12
echo.
echo 🔍 Próximos pasos recomendados:
echo    1. Verificar reportes de entradas/salidas
echo    2. Revisar inventario actualizado
echo    3. Probar movimientos de entrada/salida
echo.
echo 🎉 Listo para usar!

pause
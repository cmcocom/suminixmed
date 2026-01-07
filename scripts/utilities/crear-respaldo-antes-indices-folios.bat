@echo off
REM ============================================================================
REM Script de Respaldo ANTES de agregar índices en folios
REM Fecha: 2025-11-07
REM Motivo: Optimización de paginación en Salidas y Entradas
REM ============================================================================

echo.
echo ========================================================================
echo RESPALDO DE SEGURIDAD - Antes de Agregar Indices en Folios
echo ========================================================================
echo.
echo Este respaldo se crea ANTES de:
echo   1. Agregar indices en entradas_inventario.folio
echo   2. Agregar indices en salidas_inventario.folio
echo   3. Optimizar queries de paginacion
echo.
echo IMPORTANTE: Este es un respaldo de PRODUCCION
echo.

REM Generar timestamp simple
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"

set BACKUP_DIR=C:\UA-ISSSTE\backups
set BACKUP_FILE=%BACKUP_DIR%\suminix_antes_indices_folios_%TIMESTAMP%.backup

echo Creando directorio de respaldos si no existe...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo Iniciando respaldo completo de la base de datos...
echo Archivo: %BACKUP_FILE%
echo.

pg_dump -U postgres -h localhost -p 5432 -F c -b -v -f "%BACKUP_FILE%" suminix

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo RESPALDO COMPLETADO EXITOSAMENTE
    echo ========================================================================
    echo Archivo: %BACKUP_FILE%
    
    REM Obtener tamaño del archivo
    for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA
    echo Tamanio: %FILESIZE% bytes
    
    echo.
    echo SIGUIENTES PASOS:
    echo   1. Verificar que el archivo existe y tiene contenido
    echo   2. Aplicar script: agregar-indices-folios.sql
    echo   3. Probar paginacion en Salidas y Entradas
    echo.
    echo Para restaurar en caso de problemas:
    echo   pg_restore -U postgres -d suminix -c "%BACKUP_FILE%"
    echo.
    echo ========================================================================
) else (
    echo.
    echo ========================================================================
    echo ERROR AL CREAR EL RESPALDO
    echo ========================================================================
    echo NO PROCEDA CON LOS CAMBIOS HASTA RESOLVER ESTE ERROR
    echo ========================================================================
)

pause

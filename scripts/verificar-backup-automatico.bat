@echo off
REM ============================================================
REM Script de Verificación de Sistema de Backup Automático
REM Sistema: SuminixMed
REM ============================================================

echo.
echo ========================================
echo VERIFICACION DE SISTEMA DE BACKUP
echo ========================================
echo.

set TASK_NAME=SuminixMed-Backup-Diario
set SCRIPT_PATH=C:\UA-ISSSTE\suminixmed\scripts\backup-automatico-diario.ps1
set BACKUP_DIR=C:\UA-ISSSTE\suminixmed\backups

echo [1/5] Verificando archivos del sistema...
if exist "%SCRIPT_PATH%" (
    echo   [OK] Script de backup: %SCRIPT_PATH%
) else (
    echo   [ERROR] No se encuentra el script de backup
    goto :error
)

echo.
echo [2/5] Verificando carpeta de backups...
if exist "%BACKUP_DIR%" (
    echo   [OK] Carpeta de backups: %BACKUP_DIR%
) else (
    echo   [ADVERTENCIA] La carpeta de backups no existe
    echo   Se creara automaticamente en el primer respaldo
)

echo.
echo [3/5] Verificando PostgreSQL...
where pg_dump >nul 2>&1
if %errorLevel% EQU 0 (
    echo   [OK] PostgreSQL encontrado en PATH
    for /f "delims=" %%i in ('where pg_dump') do echo   Ubicacion: %%i
) else (
    echo   [INFO] PostgreSQL no esta en PATH
    echo   El script detectara automaticamente la version instalada
)

echo.
echo [4/5] Verificando tarea programada...
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% EQU 0 (
    echo   [OK] Tarea programada instalada: %TASK_NAME%
    echo.
    echo   Detalles de la tarea:
    schtasks /Query /TN "%TASK_NAME%" /FO LIST | findstr /C:"Siguiente hora" /C:"Ultima ejecucion" /C:"Ultimo resultado"
) else (
    echo   [ADVERTENCIA] La tarea programada NO esta instalada
    echo   Ejecuta: scripts\instalar-backup-automatico.bat
)

echo.
echo [5/5] Verificando backups existentes...
if exist "%BACKUP_DIR%\backup-automatico-sistema-*.backup" (
    echo   [OK] Se encontraron backups automaticos:
    dir /B "%BACKUP_DIR%\backup-automatico-sistema-*.backup" 2>nul | find /C /V "" > temp_count.txt
    set /p BACKUP_COUNT=<temp_count.txt
    del temp_count.txt
    echo   Total: %BACKUP_COUNT% archivo(s)
    echo.
    echo   Ultimos 5 backups:
    dir /B /O-D "%BACKUP_DIR%\backup-automatico-sistema-*.backup" 2>nul | findstr /N "^" | findstr "^[1-5]:"
) else (
    echo   [INFO] No hay backups automaticos todavia
    echo   Ejecuta un backup manual para probar: scripts\ejecutar-backup-manual.bat
)

echo.
echo ========================================
echo VERIFICACION COMPLETADA
echo ========================================
echo.
echo Estado del sistema:
echo   - Scripts instalados: OK
echo   - PostgreSQL: Verificar arriba
echo   - Tarea programada: Verificar arriba
echo   - Backups: Verificar arriba
echo.
echo Siguiente paso:
echo   1. Si la tarea NO esta instalada: ejecutar instalar-backup-automatico.bat
echo   2. Para probar: ejecutar ejecutar-backup-manual.bat
echo   3. Para ver logs: backups\backup-automatico.log
echo.

pause
exit /b 0

:error
echo.
echo [ERROR] La verificacion encontro problemas
echo Por favor revisa los mensajes arriba
echo.
pause
exit /b 1

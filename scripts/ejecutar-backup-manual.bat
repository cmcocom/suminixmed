@echo off
REM ============================================================
REM Script de Backup Manual - SuminixMed
REM Ejecuta un respaldo inmediato para probar el sistema
REM ============================================================

echo.
echo ========================================
echo BACKUP MANUAL - SUMINIXMED
echo ========================================
echo.

set SCRIPT_PATH=C:\UA-ISSSTE\suminixmed\scripts\backup-automatico-diario.ps1

if not exist "%SCRIPT_PATH%" (
    echo [ERROR] No se encontro el script de backup
    echo Ruta esperada: %SCRIPT_PATH%
    echo.
    pause
    exit /b 1
)

echo [INFO] Ejecutando backup manual...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

echo.
echo ========================================
if %errorLevel% EQU 0 (
    echo [OK] Backup completado exitosamente
) else (
    echo [ERROR] El backup fallo con codigo: %errorLevel%
)
echo ========================================
echo.
echo Revisa el log en: backups\backup-automatico.log
echo.

pause

@echo off
REM ============================================================
REM Script de Desinstalación de Tarea Programada - Backup Diario
REM Sistema: SuminixMed
REM ============================================================

echo.
echo ========================================
echo DESINSTALAR BACKUP AUTOMATICO DIARIO
echo ========================================
echo.

REM Verificar que se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Este script debe ejecutarse como ADMINISTRADOR
    echo.
    pause
    exit /b 1
)

set TASK_NAME=SuminixMed-Backup-Diario

REM Verificar si existe la tarea
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [INFO] La tarea "%TASK_NAME%" no existe
    echo No hay nada que desinstalar.
    echo.
    pause
    exit /b 0
)

REM Eliminar tarea
echo [INFO] Eliminando tarea programada...
schtasks /Delete /TN "%TASK_NAME%" /F

if %errorLevel% EQU 0 (
    echo.
    echo [OK] Tarea "%TASK_NAME%" desinstalada correctamente
    echo.
    echo NOTA: Los backups existentes NO se eliminaron.
    echo       Puedes eliminarlos manualmente desde: backups\
    echo.
) else (
    echo [ERROR] No se pudo eliminar la tarea
    echo.
)

pause

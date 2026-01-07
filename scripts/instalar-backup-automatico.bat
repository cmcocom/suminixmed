@echo off
REM ============================================================
REM Script de Instalación de Tarea Programada - Backup Diario
REM Sistema: SuminixMed
REM Descripción: Configura respaldo automático diario a las 00:05
REM ============================================================

echo.
echo ========================================
echo INSTALACION DE BACKUP AUTOMATICO DIARIO
echo ========================================
echo.

REM Verificar que se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Este script debe ejecutarse como ADMINISTRADOR
    echo.
    echo Por favor:
    echo 1. Haz clic derecho en este archivo
    echo 2. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [OK] Ejecutando con privilegios de administrador
echo.

REM Configuración
set TASK_NAME=SuminixMed-Backup-Diario
set SCRIPT_PATH=C:\UA-ISSSTE\suminixmed\scripts\backup-automatico-diario.ps1
set BACKUP_DIR=C:\UA-ISSSTE\suminixmed\backups

REM Verificar que existe el script
if not exist "%SCRIPT_PATH%" (
    echo [ERROR] No se encontro el script de backup en:
    echo %SCRIPT_PATH%
    echo.
    pause
    exit /b 1
)

echo [OK] Script de backup encontrado
echo.

REM Crear carpeta de backups si no existe
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [OK] Creada carpeta de backups: %BACKUP_DIR%
) else (
    echo [OK] Carpeta de backups existente: %BACKUP_DIR%
)
echo.

REM Eliminar tarea anterior si existe
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% EQU 0 (
    echo [INFO] Eliminando tarea programada anterior...
    schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1
    echo [OK] Tarea anterior eliminada
    echo.
)

REM Crear nueva tarea programada
echo [INFO] Creando tarea programada...
echo.

schtasks /Create ^
    /TN "%TASK_NAME%" ^
    /TR "powershell.exe -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\"" ^
    /SC DAILY ^
    /ST 00:05 ^
    /RU SYSTEM ^
    /RL HIGHEST ^
    /F

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo INSTALACION COMPLETADA EXITOSAMENTE
    echo ========================================
    echo.
    echo Configuracion:
    echo   Nombre tarea: %TASK_NAME%
    echo   Frecuencia:   Diaria a las 00:05
    echo   Script:       %SCRIPT_PATH%
    echo   Destino:      %BACKUP_DIR%
    echo   Retencion:    30 dias
    echo.
    echo La tarea se ejecutara automaticamente todos los dias.
    echo.
    echo Para verificar:
    echo   taskschd.msc  ^(abrir Programador de tareas^)
    echo.
    echo Para ejecutar manualmente ahora:
    echo   schtasks /Run /TN "%TASK_NAME%"
    echo.
) else (
    echo.
    echo [ERROR] Fallo la creacion de la tarea programada
    echo Codigo de error: %errorLevel%
    echo.
    pause
    exit /b 1
)

pause

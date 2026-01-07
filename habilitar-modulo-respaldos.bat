@echo off
REM ============================================================
REM Script para habilitar el módulo de Respaldos en el sistema
REM Sistema: SuminixMed
REM ============================================================

echo.
echo ========================================
echo HABILITAR MODULO DE RESPALDOS
echo ========================================
echo.

echo Este script habilitara el modulo "Respaldos de Base de Datos"
echo en el menu de Ajustes para todos los roles del sistema.
echo.

pause

echo.
echo [INFO] Ejecutando script SQL...
echo.

psql -U postgres -d suminix -f habilitar-modulo-respaldos.sql

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo [OK] MODULO HABILITADO CORRECTAMENTE
    echo ========================================
    echo.
    echo El modulo "Respaldos de Base de Datos" ahora es visible
    echo en: Menu Ajustes -^> Respaldos de Base de Datos
    echo.
    echo URL: /dashboard/ajustes/respaldos
    echo.
    echo IMPORTANTE: Recarga la pagina en el navegador (F5)
    echo             para ver los cambios en el menu.
    echo.
) else (
    echo.
    echo [ERROR] Fallo la ejecucion del script
    echo.
    echo Posibles causas:
    echo - PostgreSQL no esta corriendo
    echo - Credenciales incorrectas
    echo - Base de datos no encontrada
    echo.
)

pause
